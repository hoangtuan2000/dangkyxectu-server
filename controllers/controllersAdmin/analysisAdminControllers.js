const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getAnalysisTotalCommon = async (req, res) => {
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        let sql = "";
        let sqlTotalCar = `SELECT COUNT(idCar) as totalCar FROM car;`;
        let sqlTotalDriver = `SELECT COUNT(idUser) as totalDriver FROM user WHERE idRole = ${Constants.RoleCode.DRIVER};`;
        let sqlTotalScheduleComplete = `SELECT COUNT(idSchedule) as totalScheduleComplete 
                FROM schedule WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE};`;
        let sqlTotalSchedulePending = `SELECT COUNT(idSchedule) as totalSchedulePending 
                FROM schedule WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.PENDING} 
                AND DATE(FROM_UNIXTIME(startDate)) > CURRENT_DATE();`;
        let sqlTotalLicenseCarExpires = `SELECT COUNT(idCar) as totalLicenseCarExpires
                FROM car_license_detail 
                WHERE DATE(FROM_UNIXTIME(carLicenseExpirationDate)) <= CURRENT_DATE() AND noExpireDate = 0;`;
        sql +=
            sqlTotalCar +
            sqlTotalDriver +
            sqlTotalScheduleComplete +
            sqlTotalSchedulePending +
            sqlTotalLicenseCarExpires;
        db.query(sql, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                    data.data = {
                        totalCar: result[0][0].totalCar,
                        totalDriver: result[1][0].totalDriver,
                        totalScheduleComplete:
                            result[2][0].totalScheduleComplete,
                        totalSchedulePending: result[3][0].totalSchedulePending,
                        totalLicenseCarExpires:
                            result[4][0].totalLicenseCarExpires,
                    };
                    res.status(200).send(data);
                } else {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR_GET_DATA;
                    res.status(200).send(data);
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getTotalNumberOfTripsOverTime = async (req, res) => {
    let { startDate, endDate } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        let sql = `SELECT COUNT(sc.idSchedule) as totalSchedule, UNIX_TIMESTAMP(dateRange.date) as date
            FROM 
                (SELECT * FROM schedule 
                WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.MOVING}, 
                    ${Constants.ScheduleStatusCode.COMPLETE}, ${Constants.ScheduleStatusCode.RECEIVED})) as sc
            RIGHT JOIN (SELECT CURRENT_DATE() - INTERVAL seq DAY as date FROM seq_0_to_7) as dateRange
            ON DATE(FROM_UNIXTIME(sc.startDate)) = dateRange.date
            GROUP BY dateRange.date`;

        if (startDate && endDate) {
            const diffDays = helper.diffDaysOfTwoTimeStamp(startDate, endDate);
            startDate = helper.formatTimeStamp(startDate);
            endDate = helper.formatTimeStamp(endDate);
            sql = `SELECT COUNT(sc.idSchedule) as totalSchedule, UNIX_TIMESTAMP(dateRange.date) as date
            FROM 
                (SELECT * FROM schedule 
                WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.MOVING}, 
                    ${Constants.ScheduleStatusCode.COMPLETE}, ${Constants.ScheduleStatusCode.RECEIVED})) as sc
            RIGHT JOIN (SELECT DATE(FROM_UNIXTIME(${endDate})) - INTERVAL seq DAY as date FROM seq_0_to_${diffDays}) as dateRange
            ON DATE(FROM_UNIXTIME(sc.startDate)) = dateRange.date
            GROUP BY dateRange.date`;
        }

        db.query(sql, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                    data.data = [...result];
                    res.status(200).send(data);
                } else {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR_GET_DATA;
                    res.status(200).send(data);
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getDataTotalNumberOfTripsOverTime = async (req, res) => {
    let {
        page,
        limitEntry,
        startDate,
        endDate,
        haveSchedule,
        status,
        carType,
        faculty,
        infoUser,
        infoDriver,
        licensePlates,
        scheduleCode,
        address,
        idWard,
        startDateSchedule,
        endDateSchedule,
    } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;

    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if (
            (status && !helper.isArray(status)) ||
            (carType && !helper.isArray(carType)) ||
            (faculty && !helper.isArray(faculty))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            let sqlExecuteQuery = `SELECT COUNT(dateRange.date) as sizeQuerySnapshot 
                    FROM (SELECT * FROM schedule WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.MOVING}, 
                        ${Constants.ScheduleStatusCode.COMPLETE}, ${Constants.ScheduleStatusCode.RECEIVED})) as sc
                    RIGHT JOIN (SELECT CURRENT_DATE() - INTERVAL seq DAY as date FROM seq_0_to_7) as dateRange
                    ON DATE(FROM_UNIXTIME(sc.startDate)) = dateRange.date
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    WHERE 1 = 1 `;

            let sql = `SELECT 
                        UNIX_TIMESTAMP(dateRange.date) as date,
                        sc.idSchedule, sc.startDate, sc.endDate,
                        us.idUser, us.fullName as fullNameUser, us.code as codeUser,
                        dr.idUser as idDriver, dr.fullName as fullNameDriver, dr.code as codeDriver,
                        ss.idScheduleStatus, ss.name as nameScheduleStatus
                    FROM (SELECT * FROM schedule WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.MOVING}, 
                        ${Constants.ScheduleStatusCode.COMPLETE}, ${Constants.ScheduleStatusCode.RECEIVED})) as sc
                    RIGHT JOIN (SELECT CURRENT_DATE() - INTERVAL seq DAY as date FROM seq_0_to_7) as dateRange
                    ON DATE(FROM_UNIXTIME(sc.startDate)) = dateRange.date
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    WHERE 1 = 1 `;

            if (startDate && endDate) {
                const diffDays = helper.diffDaysOfTwoTimeStamp(
                    startDate,
                    endDate
                );
                endDate = helper.formatTimeStamp(endDate);

                sqlExecuteQuery = `SELECT COUNT(dateRange.date) as sizeQuerySnapshot 
                    FROM (SELECT * FROM schedule WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.MOVING}, 
                        ${Constants.ScheduleStatusCode.COMPLETE}, ${Constants.ScheduleStatusCode.RECEIVED})) as sc
                    RIGHT JOIN (SELECT DATE(FROM_UNIXTIME(${endDate})) - INTERVAL seq DAY as date FROM seq_0_to_${diffDays}) as dateRange
                    ON DATE(FROM_UNIXTIME(sc.startDate)) = dateRange.date
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    WHERE 1 = 1 `;

                sql = `SELECT 
                        UNIX_TIMESTAMP(dateRange.date) as date,
                        sc.idSchedule, sc.startDate, sc.endDate,
                        us.idUser, us.fullName as fullNameUser, us.code as codeUser,
                        dr.idUser as idDriver, dr.fullName as fullNameDriver, dr.code as codeDriver,
                        ss.idScheduleStatus, ss.name as nameScheduleStatus
                    FROM (SELECT * FROM schedule WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.MOVING}, 
                        ${Constants.ScheduleStatusCode.COMPLETE}, ${Constants.ScheduleStatusCode.RECEIVED})) as sc
                    RIGHT JOIN (SELECT DATE(FROM_UNIXTIME(${endDate})) - INTERVAL seq DAY as date FROM seq_0_to_${diffDays}) as dateRange
                    ON DATE(FROM_UNIXTIME(sc.startDate)) = dateRange.date
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    WHERE 1 = 1 `;
            }

            // CHECK CONDITION SQL
            let conditionSql = "";
            if (status && status.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < status.length; i++) {
                    if (i == 0) {
                        if (status.length > 1) {
                            sqlTemp += ` AND ( sc.idScheduleStatus = '${status[i]}' `;
                        } else {
                            sqlTemp += ` AND ( sc.idScheduleStatus = '${status[i]}' ) `;
                        }
                    } else if (i == status.length - 1) {
                        sqlTemp += ` OR sc.idScheduleStatus = '${status[i]}' ) `;
                    } else {
                        sqlTemp += ` OR sc.idScheduleStatus = '${status[i]}' `;
                    }
                }
                conditionSql += sqlTemp;
            }
            if (carType && carType.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < carType.length; i++) {
                    if (i == 0) {
                        if (carType.length > 1) {
                            sqlTemp += ` AND ( ct.idCarType = '${carType[i]}' `;
                        } else {
                            sqlTemp += ` AND ( ct.idCarType = '${carType[i]}' ) `;
                        }
                    } else if (i == carType.length - 1) {
                        sqlTemp += ` OR ct.idCarType = '${carType[i]}' ) `;
                    } else {
                        sqlTemp += ` OR ct.idCarType = '${carType[i]}' `;
                    }
                }
                conditionSql += sqlTemp;
            }
            if (faculty && faculty.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < faculty.length; i++) {
                    if (i == 0) {
                        if (faculty.length > 1) {
                            sqlTemp += ` AND ( fa.idFaculty = '${faculty[i]}' `;
                        } else {
                            sqlTemp += ` AND ( fa.idFaculty = '${faculty[i]}' ) `;
                        }
                    } else if (i == faculty.length - 1) {
                        sqlTemp += ` OR fa.idFaculty = '${faculty[i]}' ) `;
                    } else {
                        sqlTemp += ` OR fa.idFaculty = '${faculty[i]}' `;
                    }
                }
                conditionSql += sqlTemp;
            }
            if (!helper.isNullOrEmpty(scheduleCode)) {
                conditionSql += ` AND (sc.idSchedule = '${scheduleCode}') `;
            }
            if (!helper.isNullOrEmpty(haveSchedule)) {
                if (helper.convertStringBooleanToBoolean(haveSchedule)) {
                    conditionSql += ` AND (sc.idSchedule IS NOT NULL) `;
                } else {
                    conditionSql += ` AND (sc.idSchedule IS NULL) `;
                }
            }
            if (!helper.isNullOrEmpty(address)) {
                conditionSql += ` AND (sc.startLocation LIKE '%${address}%') `;
            }
            if (!helper.isNullOrEmpty(infoUser)) {
                conditionSql += ` AND (us.fullName LIKE '%${infoUser}%' OR us.code LIKE '%${infoUser}%') `;
            }
            if (!helper.isNullOrEmpty(infoDriver)) {
                conditionSql += ` AND (dr.fullName LIKE '%${infoDriver}%' OR dr.code LIKE '%${infoDriver}%') `;
            }
            if (!helper.isNullOrEmpty(licensePlates)) {
                conditionSql += ` AND (ca.licensePlates LIKE '%${licensePlates}%') `;
            }
            if (!helper.isNullOrEmpty(idWard)) {
                conditionSql += ` AND (sc.idWardStartLocation = '${idWard}' OR sc.idWardEndLocation = '${idWard}') `;
            }
            if (
                helper.formatTimeStamp(startDateSchedule) &&
                helper.formatTimeStamp(endDateSchedule)
            ) {
                const startTimeStamp =
                    helper.formatTimeStamp(startDateSchedule);
                const endTimeStamp = helper.formatTimeStamp(endDateSchedule);
                conditionSql += ` AND (( DATE(FROM_UNIXTIME(${startTimeStamp})) BETWEEN DATE(FROM_UNIXTIME(sc.startDate)) AND DATE(FROM_UNIXTIME(sc.endDate))) 
                OR ( DATE(FROM_UNIXTIME(${endTimeStamp})) BETWEEN DATE(FROM_UNIXTIME(sc.startDate)) AND DATE(FROM_UNIXTIME(sc.endDate))) 
                OR (DATE(FROM_UNIXTIME(sc.startDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))) 
                OR (DATE(FROM_UNIXTIME(sc.endDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp})))) `;
            }

            const resultExecuteQuery = await executeQuery(
                db,
                `${sqlExecuteQuery} ${conditionSql}`
            );

            if (!resultExecuteQuery) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_GET_DATA;
                res.status(200).send(data);
            } else {
                sql =
                    sql +
                    conditionSql +
                    ` LIMIT ${limitEntry * page - limitEntry}, ${limitEntry}`;
                db.query(sql, (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        dataList.status = Constants.ApiCode.OK;
                        dataList.message = Strings.Common.SUCCESS;
                        dataList.limitEntry = limitEntry;
                        dataList.page = page;
                        dataList.sizeQuerySnapshot =
                            resultExecuteQuery[0].sizeQuerySnapshot;
                        dataList.data = [...result];
                        res.status(200).send(dataList);
                    }
                });
            }
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getAnalysisDriverLicense = async (req, res) => {
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        let sql = `SELECT COUNT(dr.idUser) as totalDriversHasDriverLicense, dl.name as nameDriverLicense
                FROM driver_license as dl
                LEFT JOIN user as dr ON dr.idDriverLicense = dl.idDriverLicense
                GROUP BY dl.idDriverLicense`;
        db.query(sql, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            } else {
                data.status = Constants.ApiCode.OK;
                data.message = Strings.Common.SUCCESS;
                data.data = [...result];
                res.status(200).send(data);
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

module.exports = {
    getAnalysisTotalCommon,
    getTotalNumberOfTripsOverTime,
    getDataTotalNumberOfTripsOverTime,
    getAnalysisDriverLicense,
};

const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

// ANALYSIS TOTAL COMMON
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
                AND DATE(FROM_UNIXTIME(startDate)) >= CURRENT_DATE();`;
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

// ANALYSIS TOTAL NUMBER OF TRIPS OVER TIME
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
        getAllData,
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
                    if (!helper.isNullOrEmpty(status[i])) {
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
                }
                conditionSql += sqlTemp;
            }
            if (carType && carType.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < carType.length; i++) {
                    if (!helper.isNullOrEmpty(carType[i])) {
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
                }
                conditionSql += sqlTemp;
            }
            if (faculty && faculty.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < faculty.length; i++) {
                    if (!helper.isNullOrEmpty(faculty[i])) {
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
                // CHECK GET ALL DATA => NOT LIMIT DATA
                if (
                    getAllData &&
                    helper.convertStringBooleanToBoolean(getAllData)
                ) {
                    sql = sql + conditionSql;
                } else {
                    sql =
                        sql +
                        conditionSql +
                        ` LIMIT ${
                            limitEntry * page - limitEntry
                        }, ${limitEntry}`;
                }

                db.query(sql, (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        dataList.status = Constants.ApiCode.OK;
                        dataList.message = Strings.Common.SUCCESS;

                        if (
                            getAllData &&
                            helper.convertStringBooleanToBoolean(getAllData)
                        ) {
                            dataList.limitEntry =
                                resultExecuteQuery[0].sizeQuerySnapshot;
                        } else {
                            dataList.limitEntry = limitEntry;
                        }

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

// ANALYSIS DRIVER LICENSE
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

const getDataAnalysisDriverLicense = async (req, res) => {
    let {
        page,
        limitEntry,
        driverLicense,
        userStatus,
        haveDriver,
        codeDriver,
        fullNameDriver,
        emailDriver,
        phoneDriver,
        address,
        idWard,
        getAllData,
    } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;

    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if (
            (driverLicense && !helper.isArray(driverLicense)) ||
            (userStatus && !helper.isArray(userStatus))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            let sqlExecuteQuery = `SELECT COUNT(dl.idDriverLicense) as sizeQuerySnapshot 
            FROM driver_license as dl
            LEFT JOIN user as dr ON dr.idDriverLicense = dl.idDriverLicense
            LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
            WHERE 1 = 1 `;
            // CHECK CONDITION SQL
            let conditionSql = "";
            if (driverLicense && driverLicense.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < driverLicense.length; i++) {
                    if (!helper.isNullOrEmpty(driverLicense[i])) {
                        if (i == 0) {
                            if (driverLicense.length > 1) {
                                sqlTemp += ` AND ( dl.idDriverLicense = '${driverLicense[i]}' `;
                            } else {
                                sqlTemp += ` AND ( dl.idDriverLicense = '${driverLicense[i]}' ) `;
                            }
                        } else if (i == driverLicense.length - 1) {
                            sqlTemp += ` OR dl.idDriverLicense = '${driverLicense[i]}' ) `;
                        } else {
                            sqlTemp += ` OR dl.idDriverLicense = '${driverLicense[i]}' `;
                        }
                    }
                }
                conditionSql += sqlTemp;
            }

            if (userStatus && userStatus.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < userStatus.length; i++) {
                    if (!helper.isNullOrEmpty(userStatus[i])) {
                        if (i == 0) {
                            if (userStatus.length > 1) {
                                sqlTemp += ` AND ( uss.idUserStatus = '${userStatus[i]}' `;
                            } else {
                                sqlTemp += ` AND ( uss.idUserStatus = '${userStatus[i]}' ) `;
                            }
                        } else if (i == userStatus.length - 1) {
                            sqlTemp += ` OR uss.idUserStatus = '${userStatus[i]}' ) `;
                        } else {
                            sqlTemp += ` OR uss.idUserStatus = '${userStatus[i]}' `;
                        }
                    }
                }
                conditionSql += sqlTemp;
            }

            if (!helper.isNullOrEmpty(haveDriver)) {
                if (helper.convertStringBooleanToBoolean(haveDriver)) {
                    conditionSql += ` AND (dr.idUser IS NOT NULL) `;
                } else {
                    conditionSql += ` AND (dr.idUser IS NULL) `;
                }
            }

            if (!helper.isNullOrEmpty(codeDriver)) {
                conditionSql += ` AND (dr.code LIKE '%${codeDriver}%') `;
            }
            if (!helper.isNullOrEmpty(fullNameDriver)) {
                conditionSql += ` AND (dr.fullName LIKE '%${fullNameDriver}%') `;
            }

            if (!helper.isNullOrEmpty(emailDriver)) {
                conditionSql += ` AND (dr.email LIKE '%${emailDriver}%') `;
            }

            if (!helper.isNullOrEmpty(phoneDriver)) {
                conditionSql += ` AND (dr.phone LIKE '%${phoneDriver}%') `;
            }

            if (!helper.isNullOrEmpty(address)) {
                conditionSql += ` AND (dr.address LIKE '%${address}%') `;
            }

            if (!helper.isNullOrEmpty(idWard)) {
                conditionSql += ` AND (dr.idWard = '${idWard}') `;
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
                let sqlTemp = `SELECT 
                        dl.idDriverLicense, dl.name as nameDriverLicense,
                        dr.idUser as idDriver, dr.fullName as fullNameDriver, dr.code as codeDriver,
                        dr.email as emailDriver, dr.phone as phoneDriver,
                        uss.idUserStatus, uss.name as nameUserStatus
                    FROM driver_license as dl
                    LEFT JOIN user as dr ON dr.idDriverLicense = dl.idDriverLicense
                    LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
                    WHERE 1 = 1 ${conditionSql}
                    `;
                let limitData = `  LIMIT ${
                    limitEntry * page - limitEntry
                }, ${limitEntry}`;

                let sql = "";
                // CHECK GET ALL DATA => NOT LIMIT DATA
                if (
                    getAllData &&
                    helper.convertStringBooleanToBoolean(getAllData)
                ) {
                    sql += sqlTemp;
                } else {
                    sql += sqlTemp + limitData;
                }
                db.query(sql, (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        dataList.status = Constants.ApiCode.OK;
                        dataList.message = Strings.Common.SUCCESS;

                        if (
                            getAllData &&
                            helper.convertStringBooleanToBoolean(getAllData)
                        ) {
                            dataList.limitEntry =
                                resultExecuteQuery[0].sizeQuerySnapshot;
                        } else {
                            dataList.limitEntry = limitEntry;
                        }

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

// ANALYSIS TOTAL TRIPS OF FACULTIES
const getAnalysisTotalTripsOfFaculties = async (req, res) => {
    let { startDate, endDate } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        let sql = `SELECT COUNT(sc.idSchedule) as totalTripsOfFaculty, fa.name as nameFaculty
                FROM faculty as fa
                LEFT JOIN 
                    (SELECT schedule.idSchedule, schedule.idUser, faculty.idFaculty
                    FROM schedule
                    LEFT JOIN user ON user.idUser = schedule.idUser
                    LEFT JOIN faculty ON faculty.idFaculty = user.idFaculty
                    WHERE schedule.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}) as sc 
                    ON sc.idFaculty = fa.idFaculty
                GROUP BY fa.idFaculty`;

        if ((startDate, endDate)) {
            startDate = helper.formatTimeStamp(startDate);
            endDate = helper.formatTimeStamp(endDate);
            sql = `SELECT COUNT(sc.idSchedule) as totalTripsOfFaculty, fa.name as nameFaculty
                FROM faculty as fa
                LEFT JOIN 
                    (SELECT schedule.idSchedule, schedule.idUser, faculty.idFaculty
                    FROM schedule
                    LEFT JOIN user ON user.idUser = schedule.idUser
                    LEFT JOIN faculty ON faculty.idFaculty = user.idFaculty
                    WHERE schedule.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE} AND
                    (DATE(FROM_UNIXTIME(schedule.startDate)) BETWEEN 
                    DATE(FROM_UNIXTIME(${startDate})) AND DATE(FROM_UNIXTIME(${endDate})))) as sc 
                    ON sc.idFaculty = fa.idFaculty
                GROUP BY fa.idFaculty`;
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
                    data.data = {
                        date: {
                            startDate: startDate || null,
                            endDate: endDate || null,
                        },
                        data: [...result],
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

const getDataAnalysisTotalTripsOfFaculties = async (req, res) => {
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
        getAllData,
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
            let sqlExecuteQuery = `SELECT COUNT(fa.idFaculty) as sizeQuerySnapshot
            FROM faculty as fa
            LEFT JOIN 
                (SELECT schedule.*, faculty.idFaculty
                FROM schedule
                LEFT JOIN user ON user.idUser = schedule.idUser
                LEFT JOIN faculty ON faculty.idFaculty = user.idFaculty
                WHERE schedule.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}) as sc 
                ON sc.idFaculty = fa.idFaculty
            LEFT JOIN user as us ON us.idUser = sc.idUser
            LEFT JOIN user as dr ON dr.idUser = sc.idDriver
            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
            LEFT JOIN car as ca ON ca.idCar = sc.idCar
            LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
            WHERE 1=1 `;

            let sql = `SELECT 
                fa.name as nameFaculty, sc.idSchedule, sc.startDate, sc.endDate, sc.reason,
                us.code as codeUser, us.fullName as fullNameUser
            FROM faculty as fa
            LEFT JOIN 
                (SELECT schedule.*, faculty.idFaculty
                FROM schedule
                LEFT JOIN user ON user.idUser = schedule.idUser
                LEFT JOIN faculty ON faculty.idFaculty = user.idFaculty
                WHERE schedule.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}) as sc 
                ON sc.idFaculty = fa.idFaculty
            LEFT JOIN user as us ON us.idUser = sc.idUser
            LEFT JOIN user as dr ON dr.idUser = sc.idDriver
            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
            LEFT JOIN car as ca ON ca.idCar = sc.idCar
            LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
            WHERE 1 = 1 `;

            if (startDate && endDate) {
                startDate = helper.formatTimeStamp(startDate);
                endDate = helper.formatTimeStamp(endDate);

                sqlExecuteQuery = `SELECT COUNT(fa.idFaculty) as sizeQuerySnapshot
                FROM faculty as fa
                LEFT JOIN 
                    (SELECT schedule.*, faculty.idFaculty
                    FROM schedule
                    LEFT JOIN user ON user.idUser = schedule.idUser
                    LEFT JOIN faculty ON faculty.idFaculty = user.idFaculty
                    WHERE schedule.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE} AND
                    (DATE(FROM_UNIXTIME(schedule.startDate)) BETWEEN 
                    DATE(FROM_UNIXTIME(${startDate})) AND DATE(FROM_UNIXTIME(${endDate})))
                    ) as sc ON sc.idFaculty = fa.idFaculty
                LEFT JOIN user as us ON us.idUser = sc.idUser
                LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                LEFT JOIN car as ca ON ca.idCar = sc.idCar
                LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                WHERE 1=1 `;

                sql = `SELECT 
                    fa.name as nameFaculty, sc.idSchedule, sc.startDate, sc.endDate, sc.reason,
                    us.code as codeUser, us.fullName as fullNameUser
                FROM faculty as fa
                LEFT JOIN 
                    (SELECT schedule.*, faculty.idFaculty
                    FROM schedule
                    LEFT JOIN user ON user.idUser = schedule.idUser
                    LEFT JOIN faculty ON faculty.idFaculty = user.idFaculty
                    WHERE schedule.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE} AND
                    (DATE(FROM_UNIXTIME(schedule.startDate)) BETWEEN 
                    DATE(FROM_UNIXTIME(${startDate})) AND DATE(FROM_UNIXTIME(${endDate})))
                    ) as sc ON sc.idFaculty = fa.idFaculty
                LEFT JOIN user as us ON us.idUser = sc.idUser
                LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                LEFT JOIN car as ca ON ca.idCar = sc.idCar
                LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                WHERE 1 = 1 `;
            }

            // CHECK CONDITION SQL
            let conditionSql = "";
            if (status && status.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < status.length; i++) {
                    if (!helper.isNullOrEmpty(status[i])) {
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
                }
                conditionSql += sqlTemp;
            }
            if (carType && carType.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < carType.length; i++) {
                    if (!helper.isNullOrEmpty(carType[i])) {
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
                }
                conditionSql += sqlTemp;
            }
            if (faculty && faculty.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < faculty.length; i++) {
                    if (!helper.isNullOrEmpty(faculty[i])) {
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
                // CHECK GET ALL DATA => NOT LIMIT DATA
                if (
                    getAllData &&
                    helper.convertStringBooleanToBoolean(getAllData)
                ) {
                    sql = sql + conditionSql;
                } else {
                    sql =
                        sql +
                        conditionSql +
                        ` LIMIT ${
                            limitEntry * page - limitEntry
                        }, ${limitEntry}`;
                }

                db.query(sql, (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        dataList.status = Constants.ApiCode.OK;
                        dataList.message = Strings.Common.SUCCESS;

                        if (
                            getAllData &&
                            helper.convertStringBooleanToBoolean(getAllData)
                        ) {
                            dataList.limitEntry =
                                resultExecuteQuery[0].sizeQuerySnapshot;
                        } else {
                            dataList.limitEntry = limitEntry;
                        }

                        dataList.page = page;
                        dataList.sizeQuerySnapshot =
                            resultExecuteQuery[0].sizeQuerySnapshot;

                        dataList.data = {
                            date: {
                                startDate: startDate || null,
                                endDate: endDate || null,
                            },
                            data: [...result],
                        };
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

// ANALYSIS TOTAL TRIPS OF DRIVER
const getAnalysisTotalTripsOfDriver = async (req, res) => {
    let { startDate, endDate } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        let sql = `SELECT 
                COUNT(sc.idSchedule) as totalSchedule, dr.code, dr.fullName
            FROM user as dr
            LEFT JOIN 
                (SELECT * FROM schedule 
                WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}
                ) as sc ON sc.idDriver = dr.idUser
            WHERE dr.idRole = ${Constants.RoleCode.DRIVER}
            GROUP BY dr.idUser`;

        if ((startDate, endDate)) {
            startDate = helper.formatTimeStamp(startDate);
            endDate = helper.formatTimeStamp(endDate);
            sql = `SELECT 
                    COUNT(sc.idSchedule) as totalSchedule, dr.code, dr.fullName
                FROM user as dr
                LEFT JOIN 
                    (SELECT * FROM schedule 
                    WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE} AND
                    (DATE(FROM_UNIXTIME(startDate)) BETWEEN 
                    DATE(FROM_UNIXTIME(${startDate})) AND DATE(FROM_UNIXTIME(${endDate})))
                    ) as sc ON sc.idDriver = dr.idUser
                WHERE dr.idRole = ${Constants.RoleCode.DRIVER}
                GROUP BY dr.idUser`;
        }

        db.query(sql, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            } else {
                // if (result.length > 0) {
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                    data.data = {
                        date: {
                            startDate: startDate || null,
                            endDate: endDate || null,
                        },
                        data: [...result],
                    };
                    res.status(200).send(data);
                // } else {
                //     data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                //     data.message = Strings.Common.ERROR_GET_DATA;
                //     res.status(200).send(data);
                // }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getDataAnalysisTotalTripsOfDriver = async (req, res) => {
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
        starRating,
        startDateSchedule,
        endDateSchedule,
        getAllData,
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
            let sqlExecuteQuery = `SELECT 
                        COUNT(dr.idUser) as sizeQuerySnapshot
                    FROM user as dr
                    LEFT JOIN 
                        (SELECT * FROM schedule 
                        WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}
                        ) as sc ON sc.idDriver = dr.idUser
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    LEFT JOIN review as rv ON rv.idSchedule = sc.idSchedule
                    WHERE dr.idRole = ${Constants.RoleCode.DRIVER} `;

            let sql = `SELECT 
                        dr.fullName as fullNameDriver, dr.code as codeDriver,
                        sc.idSchedule, sc.startDate, sc.endDate,
                        us.fullName as fullNameUser, us.code as codeUser,
                        rv.starNumber
                    FROM user as dr
                    LEFT JOIN 
                        (SELECT * FROM schedule 
                        WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}
                        ) as sc ON sc.idDriver = dr.idUser
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    LEFT JOIN review as rv ON rv.idSchedule = sc.idSchedule
                    WHERE dr.idRole = ${Constants.RoleCode.DRIVER} `;

            if (startDate && endDate) {
                startDate = helper.formatTimeStamp(startDate);
                endDate = helper.formatTimeStamp(endDate);

                sqlExecuteQuery = `SELECT 
                        COUNT(dr.idUser) as sizeQuerySnapshot
                    FROM user as dr
                    LEFT JOIN 
                        (SELECT * FROM schedule 
                        WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE} AND
                        (DATE(FROM_UNIXTIME(schedule.startDate)) BETWEEN 
                        DATE(FROM_UNIXTIME(${startDate})) AND DATE(FROM_UNIXTIME(${endDate})))
                        ) as sc ON sc.idDriver = dr.idUser
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    LEFT JOIN review as rv ON rv.idSchedule = sc.idSchedule
                    WHERE dr.idRole = ${Constants.RoleCode.DRIVER} `;

                sql = `SELECT 
                        dr.fullName as fullNameDriver, dr.code as codeDriver,
                        sc.idSchedule, sc.startDate, sc.endDate,
                        us.fullName as fullNameUser, us.code as codeUser,
                        rv.starNumber
                    FROM user as dr
                    LEFT JOIN 
                        (SELECT * FROM schedule 
                        WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE} AND
                        (DATE(FROM_UNIXTIME(schedule.startDate)) BETWEEN 
                        DATE(FROM_UNIXTIME(${startDate})) AND DATE(FROM_UNIXTIME(${endDate})))
                        ) as sc ON sc.idDriver = dr.idUser
                    LEFT JOIN user as us ON us.idUser = sc.idUser
                    LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                    LEFT JOIN review as rv ON rv.idSchedule = sc.idSchedule
                    WHERE dr.idRole = ${Constants.RoleCode.DRIVER} `;
            }

            // CHECK CONDITION SQL
            let conditionSql = "";
            if (status && status.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < status.length; i++) {
                    if (!helper.isNullOrEmpty(status[i])) {
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
                }
                conditionSql += sqlTemp;
            }
            if (carType && carType.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < carType.length; i++) {
                    if (!helper.isNullOrEmpty(carType[i])) {
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
                }
                conditionSql += sqlTemp;
            }
            if (faculty && faculty.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < faculty.length; i++) {
                    if (!helper.isNullOrEmpty(faculty[i])) {
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
            if (!helper.isNullOrEmpty(starRating)) {
                starRating = helper.formatStarNumber(starRating)
                conditionSql += ` AND (rv.starNumber = ${starRating}) `;
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
                // CHECK GET ALL DATA => NOT LIMIT DATA
                if (
                    getAllData &&
                    helper.convertStringBooleanToBoolean(getAllData)
                ) {
                    sql = sql + conditionSql;
                } else {
                    sql =
                        sql +
                        conditionSql +
                        ` LIMIT ${
                            limitEntry * page - limitEntry
                        }, ${limitEntry}`;
                }

                db.query(sql, (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        dataList.status = Constants.ApiCode.OK;
                        dataList.message = Strings.Common.SUCCESS;

                        if (
                            getAllData &&
                            helper.convertStringBooleanToBoolean(getAllData)
                        ) {
                            dataList.limitEntry =
                                resultExecuteQuery[0].sizeQuerySnapshot;
                        } else {
                            dataList.limitEntry = limitEntry;
                        }

                        dataList.page = page;
                        dataList.sizeQuerySnapshot =
                            resultExecuteQuery[0].sizeQuerySnapshot;

                        dataList.data = {
                            date: {
                                startDate: startDate || null,
                                endDate: endDate || null,
                            },
                            data: [...result],
                        };
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

module.exports = {
    getAnalysisTotalCommon,
    getTotalNumberOfTripsOverTime,
    getDataTotalNumberOfTripsOverTime,
    getAnalysisDriverLicense,
    getDataAnalysisDriverLicense,
    getAnalysisTotalTripsOfFaculties,
    getDataAnalysisTotalTripsOfFaculties,
    getAnalysisTotalTripsOfDriver,
    getDataAnalysisTotalTripsOfDriver,
};

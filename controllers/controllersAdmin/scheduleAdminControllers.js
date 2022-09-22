const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getScheduleStatusList = (req, res) => {
    let data = { ...Constants.ResultData };
    const sql = `SELECT * FROM schedule_status WHERE idScheduleStatus != 4`;
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
};

const getAdminScheduleList = async (req, res) => {
    let {
        page,
        limitEntry,
        status,
        carType,
        scheduleCode,
        address,
        idWard,
        startDate,
        endDate,
    } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if (
            (status && !helper.isArray(status)) ||
            (carType && !helper.isArray(carType))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            const idUser = req.userToken.idUser;
            let sqlExecuteQuery = `SELECT COUNT(idSchedule) as sizeQuerySnapshot FROM schedule as sc, car as ca, car_type as ct
            WHERE sc.idCar = ca.idCar AND ca.idCarType = ct.idCarType `;

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
            if (!helper.isNullOrEmpty(scheduleCode)) {
                conditionSql += ` AND (sc.idSchedule = '${scheduleCode}') `;
            }
            if (!helper.isNullOrEmpty(address)) {
                conditionSql += ` AND (sc.startLocation LIKE '%${address}%') `;
            }
            if (!helper.isNullOrEmpty(idWard)) {
                conditionSql += ` AND (sc.idWardStartLocation = '${idWard}' OR sc.idWardEndLocation = '${idWard}') `;
            }
            if (
                helper.formatTimeStamp(startDate) &&
                helper.formatTimeStamp(endDate)
            ) {
                const startTimeStamp = helper.formatTimeStamp(startDate);
                const endTimeStamp = helper.formatTimeStamp(endDate);
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
                let sql = `SELECT
                                sc.idSchedule, sc.reason, sc.startDate, sc.endDate, sc.endLocation,
                                ca.idCar, ca.image, ca.licensePlates, ca.idCarType,
                                us.fullName as fullNameUser, us.code as codeUser,
                                fa.name as nameFaculty,
                                ct.name as carType, ct.seatNumber,
                                ss.name as scheduleStatus,
                                re.idReview, re.starNumber,
                                we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN user as us ON us.idUser = sc.idUser
                            LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                            LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                            LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                            LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                            LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                            LEFT JOIN review as re ON re.idSchedule = sc.idSchedule
                            ORDER BY FROM_UNIXTIME(sc.startDate) DESC
                            LIMIT ${
                                limitEntry * page - limitEntry
                            }, ${limitEntry}`;
                db.query(sql, [idUser], (err, result) => {
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

const getDriverListForSchedule = async (req, res) => {
    let { idCar, startDate, endDate } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const startTimeStamp = helper.formatTimeStamp(startDate);
        const endTimeStamp = helper.formatTimeStamp(endDate);
        let sql = `
                SELECT dr.idUser as idDriver, dr.fullName as fullNameDriver, dr.code as codeDriver
                FROM user as dr
                WHERE 
                    dr.idUserStatus = 1
                    AND DATE(FROM_UNIXTIME(dr.driverLicenseExpirationDate)) > CURRENT_DATE()
                    AND dr.idDriverLicense IN 
                        (SELECT dld.idDriverLicense
                        FROM car as ca,  driver_license_detail as dld, schedule as sc
                        WHERE ca.idCar = ? AND dld.idCarType = ca.idCarType)
                    AND dr.idUser NOT IN 
                        (SELECT idDriver 
                        FROM schedule as sc
                        WHERE (( DATE(FROM_UNIXTIME(${startTimeStamp})) BETWEEN DATE(FROM_UNIXTIME(sc.startDate)) AND DATE(FROM_UNIXTIME(sc.endDate))) 
                            OR ( DATE(FROM_UNIXTIME(${endTimeStamp})) BETWEEN DATE(FROM_UNIXTIME(sc.startDate)) AND DATE(FROM_UNIXTIME(sc.endDate))) 
                            OR (DATE(FROM_UNIXTIME(sc.startDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))) 
                            OR (DATE(FROM_UNIXTIME(sc.endDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp})))) AND idScheduleStatus = 2 )`;
        db.query(sql, [idCar], (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
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

const updateSchedule = async (req, res) => {
    let { idSchedule, idScheduleStatus, idDriver } = req.body;
    let data = { ...Constants.ResultData };

    const executeUpdate = (SQL) => {
        db.query(SQL, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            } else {
                if (result.changedRows > 0) {
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                    res.status(200).send(data);
                } else {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR_SERVER;
                    res.status(200).send(data);
                }
            }
        });
    };

    if (req.userToken) {
        const idAdmin = req.userToken.idUser;
        // get schedule status old and date
        let sqlExecuteQuery = `SELECT idScheduleStatus, startDate, idDriver FROM schedule WHERE idSchedule = ${idSchedule}`;
        const resultExecuteQuery = await executeQuery(db, sqlExecuteQuery);

        if (!resultExecuteQuery) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_GET_DATA;
            res.status(200).send(data);
        } else {
            const idScheduleStatusOld =
                (resultExecuteQuery &&
                    resultExecuteQuery.length > 0 &&
                    resultExecuteQuery[0].idScheduleStatus) ||
                null;
            const idDriverOld =
                (resultExecuteQuery &&
                    resultExecuteQuery.length > 0 &&
                    resultExecuteQuery[0].idDriver) ||
                null;
            // check data => format SQL
            if (
                (idScheduleStatusOld == Constants.ScheduleStatusCode.PENDING &&
                    helper.isDateTimeStampGreaterThanCurrentDate(
                        resultExecuteQuery[0].startDate
                    )) ||
                idScheduleStatusOld == Constants.ScheduleStatusCode.APPROVED
            ) {
                let sql = "";
                const currentDate = helper.formatTimeStamp(
                    new Date().getTime()
                );
                switch (idScheduleStatusOld) {
                    // if idScheduleStatus old is pending => (check startDate < current date)
                    case Constants.ScheduleStatusCode.PENDING:
                        // check: idScheduleStatus new is approved => update status and driver (check startDate < current date)
                        if (
                            idScheduleStatus ==
                                Constants.ScheduleStatusCode.APPROVED &&
                            idDriver
                        ) {
                            sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin}, 
                            idDriver=${idDriver}, idScheduleStatus=${idScheduleStatus} WHERE idSchedule = ${idSchedule}`;
                            executeUpdate(sql);
                        }
                        // the updated data is the same as the server data => Old dScheduleStatus = New idScheduleStatus
                        else if (
                            idScheduleStatus ==
                            Constants.ScheduleStatusCode.PENDING
                        ) {
                            data.status = Constants.ApiCode.BAD_REQUEST;
                            data.message = Strings.Common.INVALID_DATA;
                            res.status(200).send(data);
                        }
                        // if idScheduleStatus new not is approved => only update status
                        else if (
                            idScheduleStatus !=
                            Constants.ScheduleStatusCode.APPROVED
                        ) {
                            sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin}, 
                             idScheduleStatus=${idScheduleStatus} WHERE idSchedule = ${idSchedule}`;
                            executeUpdate(sql);
                        }
                        break;

                    // if idScheduleStatus old is approved => update status complete (check startDate >= current date)
                    case Constants.ScheduleStatusCode.APPROVED:
                        // complete schedule
                        if (
                            idScheduleStatus ==
                                Constants.ScheduleStatusCode.COMPLETE &&
                            !helper.isDateTimeStampGreaterThanCurrentDate(
                                resultExecuteQuery[0].startDate
                            )
                        ) {
                            sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin}, 
                                 idScheduleStatus=${idScheduleStatus} WHERE idSchedule = ${idSchedule}`;
                            executeUpdate(sql);
                        } else if (
                            helper.isDateTimeStampGreaterThanCurrentDate(
                                resultExecuteQuery[0].startDate
                            ) &&
                            idDriver &&
                            idDriver != idDriverOld
                        ) {
                            sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin}, 
                            idDriver=${idDriver} WHERE idSchedule = ${idSchedule}`;
                            executeUpdate(sql);
                        } else {
                            data.status = Constants.ApiCode.BAD_REQUEST;
                            data.message = Strings.Common.INVALID_DATA;
                            res.status(200).send(data);
                        }
                        break;
                }
            } else {
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.INVALID_REQUEST;
                res.status(200).send(data);
            }
        }
    } else {
        ata.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

module.exports = {
    getAdminScheduleList,
    getDriverListForSchedule,
    getScheduleStatusList,
    updateSchedule,
};

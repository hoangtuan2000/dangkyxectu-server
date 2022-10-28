const { async } = require("@firebase/util");
const e = require("express");
const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");
const {
    getScheduleToSendEmail,
} = require("../controllersGlobal/scheduleControllers");

const getAdminScheduleStatusListToUpdate = (req, res) => {
    const { idScheduleStatus } = req.body;
    let data = { ...Constants.ResultData };

    const executeSQL = (SQL) => {
        db.query(SQL, (err, result) => {
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

    switch (idScheduleStatus) {
        case Constants.ScheduleStatusCode.PENDING:
            const sql = `SELECT * FROM schedule_status WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.APPROVED}, ${Constants.ScheduleStatusCode.REFUSE})`;
            executeSQL(sql);
            break;
        default:
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
            break;
    }
};

const getAdminScheduleList = async (req, res) => {
    let {
        page,
        limitEntry,
        status,
        carType,
        faculty,
        infoUser,
        infoDriver,
        licensePlates,
        scheduleCode,
        address,
        idWard,
        startDate,
        endDate,
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
            const idUser = req.userToken.idUser;
            let sqlExecuteQuery = `SELECT COUNT(idSchedule) as sizeQuerySnapshot
                                    FROM 
                                        schedule as sc
                                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                                    LEFT JOIN user as us ON us.idUser = sc.idUser
                                    LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                                    WHERE 1 = 1 `;

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

            // EXECUTE SQL
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
                                sc.idSchedule, sc.reason, sc.startDate, sc.endDate, sc.startLocation, sc.endLocation,
                                ca.idCar, ca.image, ca.licensePlates, ca.idCarType,
                                us.fullName as fullNameUser, us.code as codeUser,
                                dr.fullName as fullNameDriver, dr.code as codeDriver,
                                fa.name as nameFaculty,
                                ct.name as carType, ct.seatNumber,
                                ss.name as scheduleStatus,
                                re.idReview, re.starNumber,
                                ws.name as wardStart, ds.name as districtStart, ps.name as provinceStart,
                                we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN user as us ON us.idUser = sc.idUser
                            LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                            LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                            LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus                            
                            LEFT JOIN ward as ws ON ws.idWard = sc.idWardStartLocation
                            LEFT JOIN district as ds ON ds.idDistrict = ws.idDistrict
                            LEFT JOIN province as ps ON ps.idProvince = ds.idProvince
                            LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                            LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                            LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                            LEFT JOIN review as re ON re.idSchedule = sc.idSchedule
                            WHERE 1 = 1 ${conditionSql}
                            ORDER BY FROM_UNIXTIME(sc.startDate) DESC
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

                db.query(sql, [idUser], (err, result) => {
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
                    dr.idUserStatus = ${Constants.UserStatusCode.WORKING}
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
                            OR (DATE(FROM_UNIXTIME(sc.endDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp})))) 
                            AND idScheduleStatus = ${Constants.ScheduleStatusCode.APPROVED} )`;
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

const getScheduleListOfDriver = async (req, res) => {
    let {
        page,
        limitEntry,
        idDriver,
        status,
        carType,
        faculty,
        infoUser,
        infoDriver,
        licensePlates,
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
            (carType && !helper.isArray(carType)) ||
            (faculty && !helper.isArray(faculty))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            const idUser = req.userToken.idUser;
            let sqlExecuteQuery = `SELECT COUNT(idSchedule) as sizeQuerySnapshot
                                    FROM 
                                        schedule as sc
                                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                                    LEFT JOIN user as us ON us.idUser = sc.idUser
                                    LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                                    LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                                    WHERE sc.idDriver = ${idDriver} `;

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

            // EXECUTE SQL
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
                                dr.fullName as fullNameDriver, dr.code as codeDriver,
                                fa.name as nameFaculty,
                                ct.name as carType, ct.seatNumber,
                                ss.name as scheduleStatus,
                                re.idReview, re.starNumber,
                                we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN user as us ON us.idUser = sc.idUser
                            LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                            LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                            LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                            LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                            LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                            LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                            LEFT JOIN review as re ON re.idSchedule = sc.idSchedule
                            WHERE sc.idDriver = ${idDriver} ${conditionSql}
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

// const updateSchedule = async (req, res) => {
//     let { idSchedule, idScheduleStatus, idDriver } = req.body;
//     let data = { ...Constants.ResultData };

//     const executeUpdate = (SQL) => {
//         db.query(SQL, (err, result) => {
//             if (err) {
//                 data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                 data.message = Strings.Common.ERROR_SERVER;
//                 res.status(200).send(data);
//             } else {
//                 if (result.changedRows > 0) {
//                     data.status = Constants.ApiCode.OK;
//                     data.message = Strings.Common.SUCCESS;
//                     res.status(200).send(data);
//                 } else {
//                     data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                     data.message = Strings.Common.ERROR_SERVER;
//                     res.status(200).send(data);
//                 }
//             }
//         });
//     };

//     if (req.userToken) {
//         const idAdmin = req.userToken.idUser;
//         // get schedule status old and date
//         let sqlExecuteQuery = `SELECT idScheduleStatus, startDate, idDriver FROM schedule WHERE idSchedule = ${idSchedule}`;
//         const resultExecuteQuery = await executeQuery(db, sqlExecuteQuery);

//         if (!resultExecuteQuery) {
//             data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//             data.message = Strings.Common.ERROR_GET_DATA;
//             res.status(200).send(data);
//         } else {
//             const idScheduleStatusOld =
//                 (resultExecuteQuery &&
//                     resultExecuteQuery.length > 0 &&
//                     resultExecuteQuery[0].idScheduleStatus) ||
//                 null;
//             const idDriverOld =
//                 (resultExecuteQuery &&
//                     resultExecuteQuery.length > 0 &&
//                     resultExecuteQuery[0].idDriver) ||
//                 null;
//             // check data => format SQL
//             if (
//                 (idScheduleStatusOld == Constants.ScheduleStatusCode.PENDING &&
//                     helper.isDateTimeStampGreaterThanCurrentDate(
//                         resultExecuteQuery[0].startDate
//                     )) ||
//                 idScheduleStatusOld == Constants.ScheduleStatusCode.APPROVED
//             ) {
//                 let sql = "";
//                 const currentDate = helper.formatTimeStamp(
//                     new Date().getTime()
//                 );
//                 switch (idScheduleStatusOld) {
//                     // if idScheduleStatus old is pending => (check startDate < current date)
//                     case Constants.ScheduleStatusCode.PENDING:
//                         // check: idScheduleStatus new is approved => update status and driver (check startDate < current date)
//                         if (
//                             idScheduleStatus ==
//                                 Constants.ScheduleStatusCode.APPROVED &&
//                             idDriver
//                         ) {
//                             sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin},
//                             idDriver=${idDriver}, idScheduleStatus=${idScheduleStatus} WHERE idSchedule = ${idSchedule}`;
//                             executeUpdate(sql);
//                         }
//                         // the updated data is the same as the server data => Old dScheduleStatus = New idScheduleStatus
//                         else if (
//                             idScheduleStatus ==
//                             Constants.ScheduleStatusCode.PENDING
//                         ) {
//                             data.status = Constants.ApiCode.BAD_REQUEST;
//                             data.message = Strings.Common.INVALID_DATA;
//                             res.status(200).send(data);
//                         }
//                         // if idScheduleStatus new not is approved => only update status REFUSE
//                         else if (
//                             idScheduleStatus ==
//                             Constants.ScheduleStatusCode.REFUSE
//                         ) {
//                             sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin},
//                              idScheduleStatus=${idScheduleStatus} WHERE idSchedule = ${idSchedule}`;
//                             executeUpdate(sql);
//                         } else {
//                             data.status = Constants.ApiCode.BAD_REQUEST;
//                             data.message = Strings.Common.INVALID_DATA;
//                             res.status(200).send(data);
//                         }
//                         break;

//                     // if idScheduleStatus old is approved => update status complete (check startDate >= current date)
//                     case Constants.ScheduleStatusCode.APPROVED:
//                         // complete schedule
//                         if (
//                             idScheduleStatus ==
//                                 Constants.ScheduleStatusCode.COMPLETE &&
//                             !helper.isDateTimeStampGreaterThanCurrentDate(
//                                 resultExecuteQuery[0].startDate
//                             )
//                         ) {
//                             sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin},
//                                  idScheduleStatus=${idScheduleStatus} WHERE idSchedule = ${idSchedule}`;
//                             executeUpdate(sql);
//                         }
//                         // UPDATE DRIVER
//                         else if (
//                             helper.isDateTimeStampGreaterThanCurrentDate(
//                                 resultExecuteQuery[0].startDate
//                             ) &&
//                             idDriver &&
//                             idDriver != idDriverOld
//                         ) {
//                             sql = `UPDATE schedule SET updatedAt=${currentDate}, idAdmin=${idAdmin},
//                             idDriver=${idDriver} WHERE idSchedule = ${idSchedule}`;
//                             executeUpdate(sql);
//                         } else {
//                             data.status = Constants.ApiCode.BAD_REQUEST;
//                             data.message = Strings.Common.INVALID_DATA;
//                             res.status(200).send(data);
//                         }
//                         break;
//                 }
//             } else {
//                 data.status = Constants.ApiCode.BAD_REQUEST;
//                 data.message = Strings.Common.INVALID_REQUEST;
//                 res.status(200).send(data);
//             }
//         }
//     } else {
//         ata.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//         data.message = Strings.Common.USER_NOT_EXIST;
//         res.status(200).send(data);
//     }
// };

const getCarListToChangeCar = async (req, res) => {
    const {
        idCar,
        page,
        limitEntry,
        searchCar,
        isSearchCarCode,
        isSearchCarLicensePlates,
        isSearchCarSeatNumber,
    } = req.body;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        let sqlExecuteQuery = `SELECT COUNT(ca.idCar) as sizeQuerySnapshot 
                                FROM car as ca
                                LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                                WHERE ca.idCar != ?`;

        let conditionSql = "";
        if (searchCar) {
            if (
                !isSearchCarCode &&
                !isSearchCarLicensePlates &&
                !isSearchCarSeatNumber
            ) {
                conditionSql += ` AND (ca.idCar = '${searchCar}' OR ca.licensePlates LIKE '%${searchCar}%' OR ct.seatNumber = '${searchCar}') `;
            } else {
                let conditionCarCode = isSearchCarCode
                    ? ` ca.idCar = '${searchCar}' OR `
                    : "";
                let conditionCarLicensePlates = isSearchCarLicensePlates
                    ? ` ca.licensePlates LIKE '%${searchCar}%' OR `
                    : "";
                let conditionCarSeatNumber = isSearchCarSeatNumber
                    ? ` ct.seatNumber = '${searchCar}' OR `
                    : "";
                conditionSql += ` AND ( ${conditionCarCode} ${conditionCarLicensePlates} ${conditionCarSeatNumber} 1 != 1 ) `;
            }
        }

        const resultExecuteQuery = await executeQuery(
            db,
            `${sqlExecuteQuery} ${conditionSql}`,
            idCar
        );

        if (!resultExecuteQuery) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_GET_DATA;
            res.status(200).send(data);
        } else {
            const sql = `SELECT
                            ca.idCar, ca.licensePlates, ca.image,
                            ct.idCarType, ct.name as nameCarType, ct.seatNumber
                        FROM car as ca
                        LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                        WHERE ca.idCar != ?  ${conditionSql}
                        LIMIT ${limitEntry * page - limitEntry}, ${limitEntry}`;

            db.query(sql, idCar, (err, result) => {
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
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const updateSchedulePending = async (req, res, next) => {
    let { idSchedule, idScheduleStatus, idDriver, reasonRefuse } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const idAdmin = req.userToken.idUser;
        let currentDate = helper.formatTimeStamp(new Date().getTime());
        let sql = "";
        let dataSql = [];
        let titleEmail = "";
        let colorTitleEmail = Constants.Styles.COLOR_PRIMARY;
        // REFUSE SCHEDULE
        if (
            idScheduleStatus == Constants.ScheduleStatusCode.REFUSE &&
            !helper.isNullOrEmpty(reasonRefuse) &&
            helper.isValidStringBetweenMinMaxLength(
                reasonRefuse,
                Constants.Common.CHARACTERS_MIN_LENGTH_REASON_CANCEL_SCHEDULE,
                Constants.Common.CHARACTERS_MAX_LENGTH_REASON_CANCEL_SCHEDULE
            )
        ) {
            titleEmail = Strings.Common.SCHEDULE_HAS_BEEN_REFUSED;
            colorTitleEmail = Constants.Styles.COLOR_ERROR;
            dataSql = [
                currentDate,
                idAdmin,
                idAdmin,
                idScheduleStatus,
                reasonRefuse,
                idSchedule,
            ];
            sql = `UPDATE schedule SET updatedAt=?, idAdmin=?, idUserLastUpdated=?, idScheduleStatus=?, reasonCancel=?
                WHERE idSchedule =? AND idScheduleStatus = ${Constants.ScheduleStatusCode.PENDING}  AND DATE(FROM_UNIXTIME(startDate)) > CURRENT_DATE()`;
        }
        // APPROVED SCHEDULE
        else if (
            idScheduleStatus == Constants.ScheduleStatusCode.APPROVED &&
            !helper.isNullOrEmpty(idDriver)
        ) {
            titleEmail = Strings.Common.SCHEDULE_HAS_BEEN_APPROVED;
            colorTitleEmail = Constants.Styles.COLOR_SUCCESS;
            dataSql = [
                currentDate,
                idAdmin,
                idDriver,
                idAdmin,
                idScheduleStatus,
                idSchedule,
            ];
            sql = `UPDATE schedule SET updatedAt=?, idAdmin=?, idDriver=?, idUserLastUpdated=?, idScheduleStatus=? 
            WHERE idSchedule =? AND idScheduleStatus = ${Constants.ScheduleStatusCode.PENDING}  AND DATE(FROM_UNIXTIME(startDate)) > CURRENT_DATE()`;
        }

        if (helper.isNullOrEmpty(sql) || helper.isArrayEmpty(dataSql)) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            db.query(sql, [...dataSql], (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.changedRows > 0) {
                        data.status = Constants.ApiCode.OK;
                        data.message = Strings.Common.SUCCESS;
                        res.status(200).send(data);
                        // call getScheduleToSendEmail function
                        next();
                    } else {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message =
                            Strings.Common.CURRENTLY_CANNOT_CANCEL_SCHEDULE;
                        res.status(200).send(data);
                    }
                }
            });
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const sendNotificationEmailUpdateSchedulePeding = async (req, res) => {
    const { idSchedule } = req.body;

    if (req.userToken) {
        const sql = `SELECT 
                        ad.email as emailAdmin, dr.email as emailDriver, us.email as emailUser, sc.idScheduleStatus
                    FROM schedule as sc
                    RIGHT JOIN user as ad ON ad.idUser = sc.idAdmin
                    RIGHT JOIN user as dr ON dr.idUser = sc.idDriver
                    RIGHT JOIN user as us ON us.idUser = sc.idUser
                    WHERE sc.idSchedule = ?`;
        db.query(sql, idSchedule, (err, result) => {
            if (!err) {
                if (result.length > 0) {
                    let titleEmail = "";
                    let colorTitleEmail = Constants.Styles.COLOR_PRIMARY;
                    if (
                        result[0].idScheduleStatus ==
                        Constants.ScheduleStatusCode.APPROVED
                    ) {
                        titleEmail = Strings.Common.SCHEDULE_HAS_BEEN_APPROVED;
                        colorTitleEmail = Constants.Styles.COLOR_SUCCESS;
                        getScheduleToSendEmail(
                            idSchedule,
                            result[0].emailDriver,
                            titleEmail,
                            colorTitleEmail
                        );
                    } else if (
                        result[0].idScheduleStatus ==
                        Constants.ScheduleStatusCode.REFUSE
                    ) {
                        titleEmail = Strings.Common.SCHEDULE_HAS_BEEN_REFUSED;
                        colorTitleEmail = Constants.Styles.COLOR_ERROR;
                    }
                    getScheduleToSendEmail(
                        idSchedule,
                        result[0].emailUser,
                        titleEmail,
                        colorTitleEmail
                    );
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const updateScheduleApproved = async (req, res) => {
    let { idSchedule, idDriver } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        if (helper.isNullOrEmpty(idDriver)) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.NOT_ENOUGH_DATA;
            res.status(200).send(data);
        } else {
            const idAdmin = req.userToken.idUser;
            let currentDate = helper.formatTimeStamp(new Date().getTime());
            let sql = `UPDATE schedule SET updatedAt=?, idDriver=?, idUserLastUpdated=? WHERE idSchedule =? AND idScheduleStatus = ${Constants.ScheduleStatusCode.APPROVED}
                AND DATE(FROM_UNIXTIME(startDate)) >= CURRENT_DATE()`;
            db.query(
                sql,
                [currentDate, idDriver, idAdmin, idSchedule],
                (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        if (result.changedRows > 0) {
                            data.status = Constants.ApiCode.OK;
                            data.message = Strings.Common.SUCCESS;
                            res.status(200).send(data);
                            // call getScheduleToSendEmail function
                            getScheduleToSendEmail(
                                idSchedule,
                                null,
                                Strings.Common.CHANGED_DRIVER,
                                Constants.Styles.COLOR_PRIMARY
                            );
                        } else {
                            data.status =
                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                            data.message =
                                Strings.Common.CURRENTLY_UNABLE_TO_UPDATE;
                            res.status(200).send(data);
                        }
                    }
                }
            );
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const changeCarSchedule = async (req, res, next) => {
    let { idSchedule, idCarNew } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const idAdmin = req.userToken.idUser;
        let currentDate = helper.formatTimeStamp(new Date().getTime());
        const sql = `UPDATE schedule SET updatedAt=?, idUserLastUpdated=?, idCar=? WHERE idSchedule = ? 
                        AND idScheduleStatus IN (${Constants.ScheduleStatusCode.PENDING}, ${Constants.ScheduleStatusCode.APPROVED})`;
        db.query(
            sql,
            [currentDate, idAdmin, idCarNew, idSchedule],
            (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.changedRows > 0) {
                        data.status = Constants.ApiCode.OK;
                        data.message = Strings.Common.SUCCESS;
                        res.status(200).send(data);
                        // call getScheduleToSendEmail function
                        next();
                    } else {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message =
                            Strings.Common.CURRENTLY_UNABLE_TO_UPDATE;
                        res.status(200).send(data);
                    }
                }
            }
        );
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const sendNotificationEmailChangeCarSchedule = async (req, res) => {
    const { idSchedule } = req.body;

    if (req.userToken) {
        const sql = `SELECT 
                        ad.email as emailAdmin, dr.email as emailDriver, us.email as emailUser, ca.licensePlates
                    FROM schedule as sc
                    LEFT JOIN car as ca ON ca.idCar = sc.idCar
                    RIGHT JOIN user as ad ON ad.idUser = sc.idAdmin
                    RIGHT JOIN user as dr ON dr.idUser = sc.idDriver
                    RIGHT JOIN user as us ON us.idUser = sc.idUser
                    WHERE sc.idSchedule = ?`;
        db.query(sql, idSchedule, (err, result) => {
            if (!err) {
                if (result.length > 0) {
                    let titleEmail = `Đổi Sang Xe ${result[0].licensePlates}`;
                    let colorTitleEmail = Constants.Styles.COLOR_WARNING;
                    getScheduleToSendEmail(
                        idSchedule,
                        result[0].emailDriver,
                        titleEmail,
                        colorTitleEmail
                    );
                    getScheduleToSendEmail(
                        idSchedule,
                        result[0].emailUser,
                        titleEmail,
                        colorTitleEmail
                    );
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

// CAR STATUS BEFORE AND AFTER TRIP
const getCarStatusListOfTrips = async (req, res, next) => {
    let {
        page,
        limitEntry,
        carType,
        carBrand,
        driver,
        licensePlates,
        carCode,
        isBrokenCarPartsBeforeTrip,
        isBrokenCarPartsAfterTrip,
        startDate,
        endDate,
    } = req.body;

    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;

    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if (
            (driver && !helper.isArray(driver)) ||
            (carType && !helper.isArray(carType)) ||
            (carBrand && !helper.isArray(carBrand))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            let sqlExecuteQuery = `SELECT
                                    COUNT(sc.idSchedule) as sizeQuerySnapshot 
                                FROM schedule as sc
                                LEFT JOIN car as ca ON ca.idCar = sc.idCar
                                LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                                LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                                LEFT JOIN user as us ON us.idUser = sc.idUser
                                LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                                LEFT JOIN 
                                    (SELECT idSchedule, SUM(IF(isBeforeCarRuns = '1', 1, 0)) as totalBrokenPartsBeforeTrip, 
                                     SUM(IF(isBeforeCarRuns = '0', 1, 0)) as totalBrokenPartsAfterTrip
                                    FROM broken_car_parts
                                    GROUP BY idSchedule) as bcp 
                                    ON bcp.idSchedule = sc.idSchedule
                                WHERE sc.idScheduleStatus NOT IN (${Constants.ScheduleStatusCode.PENDING}, ${Constants.ScheduleStatusCode.APPROVED}) `;

            let conditionSql = "";
            if (driver && driver.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < driver.length; i++) {
                    if (i == 0) {
                        if (driver.length > 1) {
                            sqlTemp += ` AND ( dr.idUser = '${driver[i]}' `;
                        } else {
                            sqlTemp += ` AND ( dr.idUser = '${driver[i]}' ) `;
                        }
                    } else if (i == driver.length - 1) {
                        sqlTemp += ` OR dr.idUser = '${driver[i]}' ) `;
                    } else {
                        sqlTemp += ` OR dr.idUser = '${driver[i]}' `;
                    }
                }
                conditionSql += sqlTemp;
            }

            if (carBrand && carBrand.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < carBrand.length; i++) {
                    if (i == 0) {
                        if (carBrand.length > 1) {
                            sqlTemp += ` AND ( cb.idCarBrand = '${carBrand[i]}' `;
                        } else {
                            sqlTemp += ` AND ( cb.idCarBrand = '${carBrand[i]}' ) `;
                        }
                    } else if (i == carBrand.length - 1) {
                        sqlTemp += ` OR cb.idCarBrand = '${carBrand[i]}' ) `;
                    } else {
                        sqlTemp += ` OR cb.idCarBrand = '${carBrand[i]}' `;
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

            if (!helper.isNullOrEmpty(isBrokenCarPartsBeforeTrip)) {
                if (
                    helper.convertStringBooleanToBoolean(
                        isBrokenCarPartsBeforeTrip
                    )
                ) {
                    conditionSql += ` AND (bcp.totalBrokenPartsBeforeTrip IS NULL ) `;
                } else {
                    conditionSql += ` AND (bcp.totalBrokenPartsBeforeTrip IS NOT NULL) `;
                }
            }

            if (!helper.isNullOrEmpty(isBrokenCarPartsAfterTrip)) {
                if (
                    helper.convertStringBooleanToBoolean(
                        isBrokenCarPartsAfterTrip
                    )
                ) {
                    conditionSql += ` AND (bcp.totalBrokenPartsAfterTrip IS NULL) `;
                } else {
                    conditionSql += ` AND (bcp.totalBrokenPartsAfterTrip IS NOT NULL) `;
                }
            }

            if (!helper.isNullOrEmpty(carCode)) {
                conditionSql += ` AND (ca.idCar = '${carCode}') `;
            }

            if (!helper.isNullOrEmpty(licensePlates)) {
                conditionSql += ` AND (ca.licensePlates LIKE '%${licensePlates}%') `;
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
                const sql = `SELECT
                                IFNULL(bcp.totalBrokenPartsBeforeTrip, 0) as totalBrokenPartsBeforeTrip,
                                IFNULL(bcp.totalBrokenPartsAfterTrip, 0) as totalBrokenPartsAfterTrip,
                                sc.idSchedule, sc.startDate, sc.endDate,
                                ss.idScheduleStatus, ss.name as nameScheduleStatus,
                                ca.idCar, ca.licensePlates, ca.image,
                                ct.idCarType, ct.name as nameCarType, ct.seatNumber,
                                cb.idCarBrand, cb.name as nameCarBrand,
                                us.idUser as idUser, us.fullName as fullNameUser, us.code as codeUser,
                                dr.idUser as idDriver, dr.fullName as fullNameDriver, dr.code as codeDriver
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                            LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                            LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                            LEFT JOIN user as us ON us.idUser = sc.idUser
                            LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                            LEFT JOIN
                                (SELECT idSchedule,
                                SUM(IF(isBeforeCarRuns = '1', 1, 0)) as totalBrokenPartsBeforeTrip,
                                SUM(IF(isBeforeCarRuns = '0', 1, 0)) as totalBrokenPartsAfterTrip
                                FROM broken_car_parts
                                GROUP BY idSchedule) as bcp
                                ON bcp.idSchedule = sc.idSchedule
                            WHERE sc.idScheduleStatus NOT IN (${
                                Constants.ScheduleStatusCode.PENDING
                            }, ${
                    Constants.ScheduleStatusCode.APPROVED
                }) ${conditionSql}
                            ORDER BY FROM_UNIXTIME(sc.startDate) DESC
                            LIMIT ${
                                limitEntry * page - limitEntry
                            }, ${limitEntry}`;

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

const getScheduleBrokenCarParts = async (req, res) => {
    let { idSchedule } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        console.log("idSchedule", idSchedule);
        const sql = `SELECT isCarFailBeforeRun, isCarFailAfterRun
                    FROM schedule
                    WHERE idSchedule = ?`;
        const result = await executeQuery(db, sql, idSchedule);
        if (!result) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else {
            if (result.length > 0) {
                let tempObject = {
                    beforeCarRuns: {
                        isCarBroken: false,
                        brokenCarParts: [],
                    },
                    afterCarRuns: { isCarBroken: false, brokenCarParts: [] },
                };
                let errorGetData = false;
                // CAR PARTS BROKEN BEFORE RUN
                if (result[0].isCarFailBeforeRun == "1") {
                    const sqlBeforeRun = `SELECT 
                                bcp.image, bcp.comment, cp.name as nameBrokenCarParts
                            FROM broken_car_parts as bcp
                            LEFT JOIN car_parts as cp ON cp.idCarParts = bcp.idCarParts
                            WHERE bcp.idSchedule = ? AND isBeforeCarRuns = 1`;
                    const resultBrokenBeforeRun = await executeQuery(
                        db,
                        sqlBeforeRun,
                        idSchedule
                    );
                    if (
                        !resultBrokenBeforeRun ||
                        resultBrokenBeforeRun.length <= 0
                    ) {
                        errorGetData = true;
                    } else {
                        tempObject.beforeCarRuns.isCarBroken = true;
                        tempObject.beforeCarRuns.brokenCarParts = [
                            ...resultBrokenBeforeRun,
                        ];
                    }
                } else {
                    tempObject.beforeCarRuns.isCarBroken = false;
                }

                // CAR PARTS BROKEN AFTER RUN
                if (result[0].isCarFailAfterRun == "1") {
                    const sqlAfterRun = `SELECT 
                                bcp.image, bcp.comment, cp.name as nameBrokenCarParts
                            FROM broken_car_parts as bcp
                            LEFT JOIN car_parts as cp ON cp.idCarParts = bcp.idCarParts
                            WHERE bcp.idSchedule = ? AND isBeforeCarRuns = 0`;
                    const resultBrokenAfterRun = await executeQuery(
                        db,
                        sqlAfterRun,
                        idSchedule
                    );
                    if (
                        !resultBrokenAfterRun ||
                        resultBrokenAfterRun.length <= 0
                    ) {
                        errorGetData = true;
                    } else {
                        tempObject.afterCarRuns.isCarBroken = true;
                        tempObject.afterCarRuns.brokenCarParts = [
                            ...resultBrokenAfterRun,
                        ];
                    }
                } else {
                    tempObject.afterCarRuns.isCarBroken = false;
                }

                // CHECK ERROR
                if (errorGetData) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                    data.data = tempObject;
                    res.status(200).send(data);
                }
            } else {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            }
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getDriverListForFilter = async (req, res) => {
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT idUser as idDriver, fullName as fullNameDriver, code as codeDriver FROM user WHERE idRole = ${Constants.RoleCode.DRIVER}`;
        db.query(sql, (err, result) => {
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

module.exports = {
    getAdminScheduleList,
    getDriverListForSchedule,
    getAdminScheduleStatusListToUpdate,
    updateSchedulePending,
    updateScheduleApproved,
    getCarListToChangeCar,
    sendNotificationEmailUpdateSchedulePeding,
    changeCarSchedule,
    sendNotificationEmailChangeCarSchedule,
    getCarStatusListOfTrips,
    getScheduleBrokenCarParts,
    getDriverListForFilter,
    getScheduleListOfDriver,
};

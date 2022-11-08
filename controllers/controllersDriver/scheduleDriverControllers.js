const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");
const {
    getScheduleToSendEmail,
} = require("../controllersGlobal/scheduleControllers");

const getDriverScheduleList = async (req, res) => {
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
                            WHERE sc.idDriver = ${idUser} AND sc.idCar = ca.idCar AND ca.idCarType = ct.idCarType `;

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
                                sc.idSchedule, sc.startDate, sc.endDate, sc.endLocation, sc.startLocation,
                                ca.idCar, ca.image, ca.licensePlates, ca.idCarType,
                                ct.name as carType, ct.seatNumber,
                                ss.idScheduleStatus, ss.name as scheduleStatus,
                                ws.name as wardStart, ds.name as districtStart, ps.name as provinceStart,
                                we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                            LEFT JOIN ward as ws ON ws.idWard = sc.idWardEndLocation
                            LEFT JOIN district as ds ON ds.idDistrict = ws.idDistrict
                            LEFT JOIN province as ps ON ps.idProvince = ds.idProvince
                            LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                            LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                            LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                            WHERE sc.idDriver = ? AND sc.idScheduleStatus != 1 ${conditionSql}
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

// UPDATE RECEIVE AND COMPLETE SCHEDULE
const checkBrokenCarPartsHasBeenConfirmed = async (req, res, next) => {
    console.log("Call checkBrokenCarPartsHasBeenConfirmed");
    const { idSchedule } = req.body;
    let data = { ...Constants.ResultData };
    const sql = `SELECT * FROM schedule WHERE idSchedule = ?`;
    db.query(sql, idSchedule, (err, result) => {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else {
            if (result.length > 0) {
                if (
                    result[0].idScheduleStatus ==
                        Constants.ScheduleStatusCode.APPROVED ||
                    result[0].idScheduleStatus ==
                        Constants.ScheduleStatusCode.MOVING
                ) {
                    if (
                        helper.isNullOrEmpty(result[0].isCarFailBeforeRun) ||
                        helper.isNullOrEmpty(result[0].isCarFailAfterRun)
                    ) {
                        req.updateIsCarFailBeforeRun = helper.isNullOrEmpty(
                            result[0].isCarFailBeforeRun
                        )
                            ? true
                            : false;
                        next();
                    } else {
                        data.status = Constants.ApiCode.BAD_REQUEST;
                        data.message =
                            Strings.Common.CAR_STATUS_HAS_BEEN_UPDATED_BEFORE;
                        res.status(200).send(data);
                    }
                } else {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.CURRENTLY_UNABLE_TO_UPDATE;
                    res.status(200).send(data);
                }
            } else {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_GET_DATA;
                res.status(200).send(data);
            }
        }
    });
};

const validateDataToConfirmReceivedOrCompleteOfSchedule = async (
    req,
    res,
    next
) => {
    console.log("Call validateDataToConfirmReceivedOrCompleteOfSchedule");

    const { isCarBroken, arrayIdCarParts, arrayComment } = req.body;
    let data = { ...Constants.ResultData };

    if (helper.convertStringBooleanToBoolean(isCarBroken)) {
        if (
            helper.isArray(arrayIdCarParts) &&
            helper.isArray(arrayComment) &&
            !helper.isArrayEmpty(arrayIdCarParts) &&
            !helper.isArrayEmpty(arrayComment) &&
            !helper.isArrayEmpty(req.files)
        ) {
            if (
                arrayIdCarParts.length == arrayComment.length &&
                arrayComment.length == req.files.length
            ) {
                next();
            } else {
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.INVALID_DATA;
                res.status(200).send(data);
            }
        } else {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        }
    } else {
        next();
    }
};

const confirmReceivedOrCompleteOfSchedule = async (req, res, next) => {
    console.log("Call confirmReceivedOrCompleteOfSchedule");

    const { idSchedule, isCarBroken, arrayIdCarParts, arrayComment } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        // BROKEN CAR PARTS
        let sql = "";
        const idUser = req.userToken.idUser;
        let isCarFail = helper.convertStringBooleanToBoolean(isCarBroken)
            ? 1
            : 0;
        const currentDate = helper.formatTimeStamp(new Date().getTime());
        let scheduleStatusCode = null;
        let titleEmail = "";
        let colorTitleEmail = Constants.Styles.COLOR_PRIMARY;
        // UPDATE CAR FAIL BEFORE RUN
        if (req.updateIsCarFailBeforeRun) {
            titleEmail = Strings.Common.SCHEDULE_HAS_BEEN_RECEIVED;
            colorTitleEmail = Constants.Styles.COLOR_BLUE_GREEN;
            scheduleStatusCode = Constants.ScheduleStatusCode.RECEIVED;
            sql = `UPDATE schedule SET isCarFailBeforeRun= ?, idScheduleStatus= ?, idUserLastUpdated= ?, updatedAt= ? WHERE idSchedule = ?`;
        }
        // UPDATE CAR FAIL AFTER RUN
        else {
            titleEmail = Strings.Common.COMPLETE_SCHEDULE;
            colorTitleEmail = Constants.Styles.COLOR_PRIMARY;
            scheduleStatusCode = Constants.ScheduleStatusCode.COMPLETE;
            sql = `UPDATE schedule SET isCarFailAfterRun= ?, idScheduleStatus= ?, idUserLastUpdated= ?, updatedAt= ? WHERE idSchedule = ?`;
        }
        db.query(
            sql,
            [isCarFail, scheduleStatusCode, idUser, currentDate, idSchedule],
            (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.changedRows > 0) {
                        getScheduleToSendEmail(
                            idSchedule,
                            null,
                            titleEmail,
                            colorTitleEmail
                        );
                        next();
                    } else {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
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

const createBrokenCarParts = async (req, res) => {
    console.log("Call createBrokenCarParts");

    const { idSchedule, isCarBroken, arrayIdCarParts, arrayComment } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        if (helper.convertStringBooleanToBoolean(isCarBroken)) {
            if (
                helper.isArray(arrayIdCarParts) &&
                helper.isArray(arrayComment)
            ) {
                if (
                    req.arrayUrlImagesFirebase.length ==
                        arrayIdCarParts.length &&
                    arrayIdCarParts.length == arrayComment.length
                ) {
                    const idUser = req.userToken.idUser;
                    const isBeforeCarRuns = req.updateIsCarFailBeforeRun ? 1 : 0;
                    const currentDate = helper.formatTimeStamp(
                        new Date().getTime()
                    );
                    const sql = `INSERT INTO broken_car_parts(image, comment, isBeforeCarRuns, createdAt, idSchedule, idCarParts, idUserCreated) VALUES ?`;
                    // FORMAT DATA
                    let arrayData = [];
                    for (let i = 0; i < arrayIdCarParts.length; i++) {
                        let arr = [
                            req.arrayUrlImagesFirebase[i],
                            arrayComment[i],
                            isBeforeCarRuns,
                            currentDate,
                            idSchedule,
                            arrayIdCarParts[i],
                            idUser,
                        ];
                        arrayData.push(arr);
                    }
                    console.log('arrayData', arrayData);
                    db.beginTransaction(function (err) {
                        if (err) {
                            console.log('err createBrokenCarParts 1');
                            data.status =
                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                            data.message = Strings.Common.ERROR;
                            res.status(200).send(data);
                        }
                        db.query(sql, [arrayData], function (error, results) {
                            if (error) {
                                console.log('err createBrokenCarParts 2', error);
                                return db.rollback(function () {
                                    data.status =
                                        Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                    data.message = Strings.Common.ERROR;
                                    res.status(200).send(data);
                                });
                            } else {
                                if (results.affectedRows > 0) {
                                    db.commit(function (err) {
                                        if (err) {
                                            console.log('err createBrokenCarParts 3');
                                            return db.rollback(function () {
                                                data.status =
                                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                                data.message =
                                                    Strings.Common.ERROR;
                                                res.status(200).send(data);
                                            });
                                        } else {
                                            data.status = Constants.ApiCode.OK;
                                            data.message =
                                                Strings.Common.SUCCESS;
                                            res.status(200).send(data);
                                        }
                                    });
                                } else {
                                    console.log('err createBrokenCarParts 4');
                                    data.status =
                                        Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                    data.message = Strings.Common.ERROR;
                                    res.status(200).send(data);
                                }
                            }
                        });
                    });
                }
            } else {
                console.log('err createBrokenCarParts 5');
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.INVALID_DATA;
                res.status(200).send(data);
            }
        } else {
            data.status = Constants.ApiCode.OK;
            data.message = Strings.Common.SUCCESS;
            res.status(200).send(data);
        }
    } else {
        console.log('err createBrokenCarParts 6');
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

// UPDATE MOVING SCHEDULE
// const confirmMoving = async (req, res) => {
//     console.log("Call Driver confirmMoving");

//     const { idSchedule } = req.body;
//     let data = { ...Constants.ResultData };

//     if (req.userToken) {
//         // CHECK SCHEDULE STATUS BEFORE UPDATE SCHEDULE STATUS MOVING
//         const sqlCheck = `SELECT * FROM schedule WHERE idSchedule = ?`;
//         const resultCheck = await executeQuery(db, sqlCheck, idSchedule);
//         if (!resultCheck) {
//             data.status = Constants.ApiCode.BAD_REQUEST;
//             data.message = Strings.Common.ERROR_GET_DATA;
//             res.status(200).send(data);
//         } else {
//             if (resultCheck.length > 0) {
//                 if (
//                     resultCheck[0].idScheduleStatus ==
//                     Constants.ScheduleStatusCode.RECEIVED
//                 ) {
//                     // UPDATE SCHEDULE STATUS MOVING
//                     const idUser = req.userToken.idUser;
//                     const currentDate = helper.formatTimeStamp(
//                         new Date().getTime()
//                     );
//                     const sql = `UPDATE schedule SET updatedAt= ?, idUserLastUpdated= ?, idScheduleStatus= ? WHERE idSchedule = ?`;
//                     db.query(
//                         sql,
//                         [
//                             currentDate,
//                             idUser,
//                             Constants.ScheduleStatusCode.MOVING,
//                             idSchedule,
//                         ],
//                         (err, result) => {
//                             if (err) {
//                                 data.status =
//                                     Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                 data.message = Strings.Common.ERROR;
//                                 res.status(200).send(data);
//                             } else {
//                                 if (result.changedRows > 0) {
//                                     getScheduleToSendEmail(
//                                         idSchedule,
//                                         null,
//                                         Strings.Common.MOVING,
//                                         Constants.Styles.COLOR_YELLOW_GREEN
//                                     );
//                                     data.status = Constants.ApiCode.OK;
//                                     data.message = Strings.Common.SUCCESS;
//                                     res.status(200).send(data);
//                                 } else {
//                                     data.status =
//                                         Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                     data.message = Strings.Common.ERROR;
//                                     res.status(200).send(data);
//                                 }
//                             }
//                         }
//                     );
//                 } else {
//                     data.status = Constants.ApiCode.BAD_REQUEST;
//                     data.message = Strings.Common.CURRENTLY_UNABLE_TO_UPDATE;
//                     res.status(200).send(data);
//                 }
//             } else {
//                 data.status = Constants.ApiCode.BAD_REQUEST;
//                 data.message = Strings.Common.ERROR_GET_DATA;
//                 res.status(200).send(data);
//             }
//         }
//     } else {
//         data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//         data.message = Strings.Common.USER_NOT_EXIST;
//         res.status(200).send(data);
//     }
// };

const confirmMoving = async (req, res) => {
    console.log("Call Driver confirmMoving");

    const { idSchedule } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        // UPDATE SCHEDULE STATUS MOVING
        const idUser = req.userToken.idUser;
        const currentDate = helper.formatTimeStamp(new Date().getTime());
        const sql = `UPDATE schedule SET updatedAt= ?, idUserLastUpdated= ?, idScheduleStatus= ? WHERE idSchedule = ? AND idScheduleStatus = ${Constants.ScheduleStatusCode.RECEIVED}`;
        db.query(
            sql,
            [
                currentDate,
                idUser,
                Constants.ScheduleStatusCode.MOVING,
                idSchedule,
            ],
            (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.changedRows > 0) {
                        getScheduleToSendEmail(
                            idSchedule,
                            null,
                            Strings.Common.MOVING,
                            Constants.Styles.COLOR_YELLOW_GREEN
                        );
                        data.status = Constants.ApiCode.OK;
                        data.message = Strings.Common.SUCCESS;
                        res.status(200).send(data);
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

module.exports = {
    getDriverScheduleList,
    validateDataToConfirmReceivedOrCompleteOfSchedule,
    checkBrokenCarPartsHasBeenConfirmed,
    confirmReceivedOrCompleteOfSchedule,
    createBrokenCarParts,
    confirmMoving,
};

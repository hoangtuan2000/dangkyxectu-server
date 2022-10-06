const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");
const {
    getScheduleToSendEmail,
} = require("../controllersGlobal/scheduleControllers");

const getUserRegisteredScheduleList = async (req, res) => {
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
            WHERE sc.idUser = ${idUser} AND sc.idCar = ca.idCar AND ca.idCarType = ct.idCarType `;

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
                                ct.name as carType, ct.seatNumber,
                                ss.name as scheduleStatus,
                                re.idReview, re.starNumber,
                                we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                            LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                            LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                            LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                            LEFT JOIN review as re ON re.idSchedule = sc.idSchedule
                            WHERE sc.idUser = ? ${conditionSql}
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

const createOrUpdateReview = async (req, res) => {
    const { idReview, idSchedule, comment } = req.body;
    let { starNumber } = req.body;
    let data = { ...Constants.ResultData };

    // check valid starNumber
    if (helper.isValidStarNumber(starNumber)) {
        starNumber = helper.formatStarNumber(starNumber);
        if (req.userToken) {
            const idUser = req.userToken.idUser;

            // check schedule status == complete
            const resultExecuteQuery = await executeQuery(
                db,
                `SELECT ss.name FROM schedule as sc, schedule_status as ss
            WHERE sc.idScheduleStatus = ss.idScheduleStatus AND sc.idSchedule = ${idSchedule}`
            );

            if (!resultExecuteQuery) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_GET_DATA;
                res.status(200).send(data);
            } else {
                if (
                    resultExecuteQuery[0].name ==
                    Constants.ScheduleStatus.COMPLETE
                ) {
                    let currentDate = helper.formatTimeStamp(
                        new Date().getTime()
                    );
                    let sql = `INSERT INTO review(starNumber, comment, createdAt, idUser, idSchedule) VALUES (?,?,?,?,?)`;
                    let dataSql = [
                        starNumber,
                        comment,
                        currentDate,
                        idUser,
                        idSchedule,
                    ];
                    if (idReview) {
                        sql = `UPDATE review SET starNumber=?, comment=?, updatedAt=? WHERE idReview = ?`;
                        dataSql = [starNumber, comment, currentDate, idReview];
                    }
                    db.query(sql, [...dataSql], (err, result) => {
                        if (err) {
                            data.status =
                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                            data.message = Strings.Common.ERROR;
                            res.status(200).send(data);
                        } else {
                            if (
                                (!idReview && result.affectedRows > 0) ||
                                (idReview && result.changedRows > 0)
                            ) {
                                data.status = Constants.ApiCode.OK;
                                data.message = Strings.Common.SUCCESS;
                                res.status(200).send(data);
                            } else {
                                data.status =
                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                data.message = Strings.Common.ERROR_SERVER;
                                res.status(200).send(data);
                            }
                        }
                    });
                } else {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.INVALID_REQUEST;
                    res.status(200).send(data);
                }
            }
        } else {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.USER_NOT_EXIST;
            res.status(200).send(data);
        }
    } else {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.INVALID_DATA;
        res.status(200).send(data);
    }
};

const updatePhoneNumberUserInSchedule = async (req, res) => {
    const { phoneUser, idSchedule } = req.body;

    let data = { ...Constants.ResultData };

    if (req.userToken) {
        if (helper.isValidPhoneNumber(phoneUser)) {
            let sql = `UPDATE schedule SET phoneUser=?, updatedAt=? WHERE idSchedule = ?`;
            let currentDate = helper.formatTimeStamp(new Date().getTime());
            db.query(
                sql,
                [phoneUser, currentDate, idSchedule],
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
                            const idUser = req.userToken.idUser;
                            const email = req.userToken.email;
                            getScheduleToSendEmail(
                                idSchedule,
                                email,
                                idUser,
                                Strings.Common.UPDATE_PHONE_NUMBER_SUCCESS,
                                Constants.Styles.COLOR_PRIMARY
                            );
                        } else {
                            data.status =
                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                            data.message = Strings.Common.ERROR_SERVER;
                            res.status(200).send(data);
                        }
                    }
                }
            );
        } else {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const cancelSchedule = async (req, res) => {
    const { idSchedule } = req.body;

    let data = { ...Constants.ResultData };

    if (req.userToken) {
        let sql = `UPDATE schedule SET updatedAt=?, idScheduleStatus=? WHERE idSchedule = ? AND 
                    (idScheduleStatus = 1 OR idScheduleStatus = 2) AND DATE(FROM_UNIXTIME(startDate)) > CURRENT_DATE()`;
        let currentDate = helper.formatTimeStamp(new Date().getTime());
        let scheduleStatusCode = Constants.ScheduleStatusCode.CANCELLED;
        db.query(
            sql,
            [currentDate, scheduleStatusCode, idSchedule],
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
                        const idUser = req.userToken.idUser;
                        const email = req.userToken.email;
                        getScheduleToSendEmail(
                            idSchedule,
                            email,
                            idUser,
                            Strings.Common.CANCEL_SUCCESSFUL_REGISTRATION,
                            Constants.Styles.COLOR_ERROR
                        );
                    } else {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR_SERVER;
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

const updateSchedulePending = async (req, res) => {
    const {
        startDate,
        endDate,
        startLocation,
        endLocation,
        reason,
        note,
        idCar, //use to checkScheduleDuplication function
        phoneUser,
        idWardStartLocation,
        idWardEndLocation,
        idSchedule,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (
        req.userToken &&
        !helper.isNullOrEmpty(startDate) &&
        !helper.isNullOrEmpty(endDate) &&
        !helper.isNullOrEmpty(startLocation) &&
        !helper.isNullOrEmpty(endLocation) &&
        !helper.isNullOrEmpty(reason) &&
        !helper.isNullOrEmpty(idWardStartLocation) &&
        !helper.isNullOrEmpty(idWardEndLocation)
    ) {
        const startTimeStamp = helper.formatTimeStamp(startDate);
        const endTimeStamp = helper.formatTimeStamp(endDate);

        if (helper.isStartTimeStampLessThanOrEqualEndTimeStamp(startTimeStamp, endTimeStamp)) {
            const idUser = req.userToken.idUser;
            const email = req.userToken.email;
            const sql = `UPDATE schedule SET startDate =?, endDate =?, startLocation =?, endLocation =?, 
                        reason =?, note =?, phoneUser =?, updatedAt =?, idWardStartLocation =?, 
                        idWardEndLocation =? WHERE idSchedule =? AND idScheduleStatus = 1`;

            const currentDate = helper.formatTimeStamp(new Date().getTime());

            const dataSql = [
                startTimeStamp,
                endTimeStamp,
                startLocation,
                endLocation,
                reason,
                note,
                phoneUser,
                currentDate,
                idWardStartLocation,
                idWardEndLocation,
                idSchedule,
            ];

            db.query(sql, [...dataSql], (error, result) => {
                if (error) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.affectedRows > 0) {
                        data.status = Constants.ApiCode.OK;
                        data.message = Strings.Common.SUCCESS;
                        res.status(200).send(data);

                        // call getScheduleToSendEmail function
                        getScheduleToSendEmail(
                            idSchedule,
                            email,
                            idUser,
                            Strings.Common.UPDATE_SUCCESS,
                            Constants.Styles.COLOR_PRIMARY
                        );
                    } else {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    }
                }
            });
        } else {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATE;
            res.status(200).send(data);
        }
    } else {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    }
};

module.exports = {
    getUserRegisteredScheduleList,
    createOrUpdateReview,
    updatePhoneNumberUserInSchedule,
    cancelSchedule,
    updateSchedulePending,
};

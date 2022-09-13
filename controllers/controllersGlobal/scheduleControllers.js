const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { helper } = require("../../common/helper");

const getScheduleList = async (req, res) => {
    const { idCar } = req.body;
    let data = { ...Constants.ResultData };
    let sql = `SELECT * FROM schedule WHERE idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDate)`;
    if (idCar) {
        sql = `SELECT * FROM schedule WHERE idCar = ${idCar} AND idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDate)`;
    }
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
};

const checkScheduleDuplication = async (req, res, next) => {
    const { startDate, endDate } = req.body;
    let data = { ...Constants.ResultData };
    if (!helper.isNullOrEmpty(startDate) && !helper.isNullOrEmpty(endDate)) {
        const startTimeStamp = helper.formatTimeStamp(startDate);
        const endTimeStamp = helper.formatTimeStamp(endDate);
        const sql = `SELECT 
                        idSchedule, startDate, endDate, idScheduleStatus,
                        DATE(FROM_UNIXTIME(startDate)) as dateStart, 
                        DATE(FROM_UNIXTIME(endDate)) as dateEnd,
                        DATE(FROM_UNIXTIME(${startTimeStamp})) as StartSend,
                        DATE(FROM_UNIXTIME(${endTimeStamp})) as EndSend
                    FROM schedule 
                    WHERE 
                        idScheduleStatus = 2 AND (( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR ( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR (DATE(FROM_UNIXTIME(startDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))) 
                        OR (DATE(FROM_UNIXTIME(endDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))))`;
        db.query(sql, [startDate, endDate], (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.DUPLICATE_SCHEDULE;
                    res.status(200).send(data);
                } else {
                    next();
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    }
};

const createSchedule = async (req, res) => {
    const {
        startDate,
        endDate,
        startLocation,
        endLocation,
        reason,
        note,
        idCar,
        idWardStartLocation,
        idWardEndLocation,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (
        req.userToken &&
        !helper.isNullOrEmpty(startDate) &&
        !helper.isNullOrEmpty(endDate) &&
        !helper.isNullOrEmpty(startLocation) &&
        !helper.isNullOrEmpty(endLocation) &&
        !helper.isNullOrEmpty(reason) &&
        !helper.isNullOrEmpty(idCar) &&
        !helper.isNullOrEmpty(idWardStartLocation) &&
        !helper.isNullOrEmpty(idWardEndLocation)
    ) {
        const startTimeStamp = helper.formatTimeStamp(startDate);
        const endTimeStamp = helper.formatTimeStamp(endDate);

        if (helper.compareBiggerDateTimeStamp(startTimeStamp, endTimeStamp)) {
            const idUser = req.userToken.idUser;
            const sql = `INSERT INTO schedule
                        (startDate, endDate, startLocation, endLocation, reason, note, createdAt, 
                         idUser, idWardStartLocation, idWardEndLocation, idCar, idScheduleStatus) 
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

            const createdAt = helper.formatTimeStamp(new Date().getTime());

            db.beginTransaction(function (err) {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                }
                db.query(
                    sql,
                    [
                        startTimeStamp,
                        endTimeStamp,
                        startLocation,
                        endLocation,
                        reason,
                        note,
                        createdAt,
                        idUser,
                        idWardStartLocation,
                        idWardEndLocation,
                        idCar,
                        1,
                    ],
                    function (error, results, fields) {
                        if (error) {
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
                                        return db.rollback(function () {
                                            data.status =
                                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                            data.message = Strings.Common.ERROR;
                                            res.status(200).send(data);
                                        });
                                    } else {
                                        data.status = Constants.ApiCode.OK;
                                        data.message = Strings.Common.SUCCESS;
                                        res.status(200).send(data);
                                    }
                                });
                            } else {
                                data.status =
                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                data.message = Strings.Common.ERROR;
                                res.status(200).send(data);
                            }
                        }
                    }
                );
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
    getScheduleList,
    createSchedule,
    checkScheduleDuplication,
};

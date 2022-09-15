const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { helper } = require("../../common/helper");
const { sendEmailCreateOrUpdateSchedule } = require("../../common/function");

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

const getScheduledDateForCar = async (req, res) => {
    const { idCar } = req.body;
    let data = { ...Constants.ResultData };
    let sql = `SELECT idSchedule, startDate, endDate FROM schedule WHERE idCar = ${idCar} AND idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDate)`;
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

const createSchedule = async (req, res, next) => {
    const {
        startDate,
        endDate,
        startLocation,
        endLocation,
        reason,
        note,
        phone,
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
            const email = req.userToken.email;
            const sql = `INSERT INTO schedule
                        (startDate, endDate, startLocation, endLocation, reason, note, phoneUser, createdAt, 
                         idUser, idWardStartLocation, idWardEndLocation, idCar, idScheduleStatus) 
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

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
                        phone,
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

                                        // create variable for getScheduleToSendEmail function
                                        req.idScheduleJustCreated =
                                            results.insertId;
                                        req.email = email;
                                        req.idUser = idUser;
                                        req.phoneUser = phone;
                                        next();
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

const getScheduleToSendEmail = (req, res) => {
    const idScheduleJustCreated = req.idScheduleJustCreated;
    const email = req.email;
    const idUser = req.idUser;
    const phoneUser = req.phoneUser;
    const sql = `SELECT 
                    ca.idCar, ca.image, ca.licensePlates, 
                    ct.name as carType, ct.seatNumber,
                    ss.name as scheduleStatus,
                    sc.idSchedule, sc.startDate, sc.endDate, sc.startLocation, sc.endLocation, sc.createdAt,
                    ws.name as wardStart, ds.name as districtStart, ps.name as provinceStart,
                    we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd,
                    us.fullName as fullNameUser,
                    dr.fullName as fullNameDriver, dr.phone as phoneDriver
                FROM car as ca 
                LEFT JOIN schedule as sc ON ca.idCar = sc.idCar
                LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                LEFT JOIN schedule_status as ss ON sc.idScheduleStatus = ss.idScheduleStatus
                LEFT JOIN user as us ON us.idUser = ? AND us.idUser = sc.idUser
                LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                LEFT JOIN ward as ws ON ws.idWard = sc.idWardStartLocation
                LEFT JOIN district as ds ON ws.idDistrict = ds.idDistrict
                LEFT JOIN province as ps ON ds.idProvince = ps.idProvince
                LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                LEFT JOIN district as de ON we.idDistrict = de.idDistrict
                LEFT JOIN province as pe ON de.idProvince = pe.idProvince
                WHERE sc.idSchedule = ?`;
    db.query(sql, [idUser, idScheduleJustCreated], (err, result) => {
        if (err) {
            console.log("Cannot send email err getScheduleToSendEmail", err);
        } else {
            if (result.length > 0) {
                result = result[0];
                const startDate = new Date(
                    parseInt(result.startDate) * 1000
                ).toLocaleDateString("en-GB");
                const endDate = new Date(
                    parseInt(result.endDate) * 1000
                ).toLocaleDateString("en-GB");
                const createdAt = new Date(
                    parseInt(result.createdAt) * 1000
                ).toLocaleDateString("en-GB");
                const startLocation = `${result.startLocation} - ${result.wardStart} - ${result.districtStart} - ${result.provinceStart}`;
                const endLocation = `${result.endLocation} - ${result.wardEnd} - ${result.districtEnd} - ${result.provinceEnd}`;
                sendEmailCreateOrUpdateSchedule(
                    email,
                    `Đăng Ký ${result.carType} ${result.seatNumber} Chổ (${idScheduleJustCreated})`,
                    null,
                    result.image,
                    result.carType,
                    result.seatNumber,
                    result.licensePlates,
                    result.scheduleStatus,
                    `${startDate} - ${endDate}`,
                    startLocation,
                    endLocation,
                    result.fullNameUser,
                    phoneUser,
                    result.fullNameDriver,
                    result.phoneDriver,
                    createdAt
                );
            } else {
                console.log("Cannot send email err SQL getScheduleToSendEmail");
            }
        }
    });
};

module.exports = {
    getScheduleList,
    getScheduledDateForCar,
    createSchedule,
    checkScheduleDuplication,
    getScheduleToSendEmail,
};

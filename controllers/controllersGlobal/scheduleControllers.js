const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { helper } = require("../../common/helper");
const { sendEmailCreateOrUpdateSchedule } = require("../../common/function");

const getSchedule = async (req, res) => {
    const { idSchedule } = req.body;
    let data = { ...Constants.ResultData };
    let sql = `SELECT
                    sc.idSchedule, sc.reason, sc.note, sc.startDate, sc.endDate, sc.startLocation, sc.endLocation, sc.phoneUser, 
                    sc.createdAt, sc.updatedAt, sc.reasonCancel, 
                    ca.idCar, ca.image, ca.licensePlates, ca.idCarType, ca.idCarColor, ca.idCarBrand, ca.idCarStatus,
                    ct.name as carType, ct.seatNumber,
                    ss.name as scheduleStatus, ss.idScheduleStatus,
                    re.idReview, re.starNumber, re.comment as commentReview,
                    cb.name as carBrand,
                    cs.name as carStatus,
                    userUpdate.fullName as fullNameUserUpdate, userUpdate.email as emailUserUpdate, userUpdate.code as codeUserUpdate,
                    us.fullName as fullNameUser, us.email as emailUser, us.code as codeUser,
                    dr.idUser as idDriver, dr.fullName as fullNameDriver, dr.phone as phoneDriver, dr.email as emailDriver, dr.code as codeDriver,
                    ad.fullName as fullNameAdmin, ad.code as codeAdmin,
                    fa.name as nameFaculty,
                    ws.name as wardStart, ws.idWard as idWardStart, ws.type as wardTypeStart, ws.idDistrict as idDistrictWardStart,
                    ds.name as districtStart, ds.idDistrict as idDistrictStart, ds.type as districtTypeStart, ds.idProvince as idProvinceDistrictStart,
                    ps.name as provinceStart, ps.idProvince as idProvinceStart, ps.type as provinceTypeStart,
                    we.name as wardEnd, we.idWard as idWardEnd, we.type as wardTypeEnd, we.idDistrict as idDistrictWardEnd,
                    de.name as districtEnd, de.idDistrict as idDistrictEnd, de.type as districtTypeEnd, de.idProvince as idProvinceDistrictEnd,
                    pe.name as provinceEnd, pe.idProvince as idProvinceEnd, pe.type as provinceTypeEnd
                FROM schedule as sc
                LEFT JOIN car as ca ON ca.idCar = sc.idCar
                LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
                LEFT JOIN ward as ws ON ws.idWard = sc.idWardEndLocation
                LEFT JOIN district as ds ON ds.idDistrict = ws.idDistrict
                LEFT JOIN province as ps ON ps.idProvince = ds.idProvince
                LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                LEFT JOIN review as re ON re.idSchedule = sc.idSchedule
                LEFT JOIN user as userUpdate ON userUpdate.idUser = sc.idUserLastUpdated
                LEFT JOIN user as us ON us.idUser = sc.idUser
                LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                LEFT JOIN user as ad ON ad.idUser = sc.idAdmin
                LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                WHERE sc.idSchedule = ?`;
    db.query(sql, [idSchedule], (err, result) => {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
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
};

const getScheduleList = async (req, res) => {
    const { idCar, idDriver } = req.body;
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
    const { idCar, notSchedule } = req.body;
    let data = { ...Constants.ResultData };
    let sql = `SELECT idSchedule, startDate, endDate FROM schedule WHERE idCar = ${idCar} AND idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDate)`;
    if (notSchedule) {
        sql = `SELECT idSchedule, startDate, endDate FROM schedule WHERE idCar = ${idCar} AND idSchedule != ${notSchedule} AND idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDate)`;
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
    const { startDate, endDate, idCar, idSchedule } = req.body;
    let data = { ...Constants.ResultData };
    if (!helper.isNullOrEmpty(startDate) && !helper.isNullOrEmpty(endDate)) {
        const startTimeStamp = helper.formatTimeStamp(startDate);
        const endTimeStamp = helper.formatTimeStamp(endDate);
        let sql = `SELECT 
                        idSchedule, startDate, endDate, idScheduleStatus,
                        DATE(FROM_UNIXTIME(startDate)) as dateStart, 
                        DATE(FROM_UNIXTIME(endDate)) as dateEnd,
                        DATE(FROM_UNIXTIME(${startTimeStamp})) as StartSend,
                        DATE(FROM_UNIXTIME(${endTimeStamp})) as EndSend
                    FROM schedule 
                    WHERE 
                        idCar = ${idCar} AND idScheduleStatus IN (${Constants.ScheduleStatusCode.APPROVED}, ${Constants.ScheduleStatusCode.RECEIVED}, ${Constants.ScheduleStatusCode.MOVING}) 
                        AND (( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR ( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR (DATE(FROM_UNIXTIME(startDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))) 
                        OR (DATE(FROM_UNIXTIME(endDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))))`;

        // update scheduled pending => exist IdSchedule => not get date of that schedule
        if (idSchedule) {
            sql = `SELECT 
                        idSchedule, startDate, endDate, idScheduleStatus,
                        DATE(FROM_UNIXTIME(startDate)) as dateStart, 
                        DATE(FROM_UNIXTIME(endDate)) as dateEnd,
                        DATE(FROM_UNIXTIME(${startTimeStamp})) as StartSend,
                        DATE(FROM_UNIXTIME(${endTimeStamp})) as EndSend
                    FROM schedule 
                    WHERE 
                        idSchedule != ${idSchedule} AND idCar = ${idCar} AND idScheduleStatus IN (${Constants.ScheduleStatusCode.APPROVED}, ${Constants.ScheduleStatusCode.RECEIVED}, ${Constants.ScheduleStatusCode.MOVING}) 
                        AND (( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR ( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR (DATE(FROM_UNIXTIME(startDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))) 
                        OR (DATE(FROM_UNIXTIME(endDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))))`;
        }

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

        if (
            helper.isStartTimeStampLessThanOrEqualEndTimeStamp(
                startTimeStamp,
                endTimeStamp
            )
        ) {
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

                                        // call getScheduleToSendEmail function
                                        getScheduleToSendEmail(
                                            results.insertId,
                                            email,
                                            Strings.Common.SIGN_UP_SUCCESS,
                                            Constants.Styles.COLOR_PRIMARY
                                        );
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

const getScheduleToSendEmail = (
    idSchedule,
    email,
    titleEmail,
    colorTitleEmail
) => {
    console.log("call EMAIL getScheduleToSendEmail");
    const sql = `SELECT 
                    ca.idCar, ca.image, ca.licensePlates, 
                    ct.name as carType, ct.seatNumber,
                    ss.name as scheduleStatus,
                    sc.idSchedule, sc.startDate, sc.reason, sc.phoneUser, sc.endDate, sc.startLocation, sc.endLocation, sc.createdAt, 
                    sc.updatedAt, sc.reasonCancel, sc.idScheduleStatus,
                    ws.name as wardStart, ds.name as districtStart, ps.name as provinceStart,
                    we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd,
                    us.fullName as fullNameUser, us.email as emailUser,
                    dr.fullName as fullNameDriver, dr.phone as phoneDriver
                FROM car as ca 
                LEFT JOIN schedule as sc ON ca.idCar = sc.idCar
                LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                LEFT JOIN schedule_status as ss ON sc.idScheduleStatus = ss.idScheduleStatus
                LEFT JOIN user as us ON us.idUser = sc.idUser
                LEFT JOIN user as dr ON dr.idUser = sc.idDriver
                LEFT JOIN ward as ws ON ws.idWard = sc.idWardStartLocation
                LEFT JOIN district as ds ON ws.idDistrict = ds.idDistrict
                LEFT JOIN province as ps ON ds.idProvince = ps.idProvince
                LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                LEFT JOIN district as de ON we.idDistrict = de.idDistrict
                LEFT JOIN province as pe ON de.idProvince = pe.idProvince
                WHERE sc.idSchedule = ?`;
    db.query(sql, idSchedule, (err, result) => {
        if (err) {
            console.log("Cannot send email err getScheduleToSendEmail", err);
        } else {
            if (result.length > 0) {
                result = result[0];
                let colorTextScheduleStatus = "";
                switch (result.scheduleStatus) {
                    case Constants.ScheduleStatus.PENDING:
                        colorTextScheduleStatus =
                            Constants.Styles.COLOR_PINK_LIGHT;
                        break;
                    case Constants.ScheduleStatus.APPROVED:
                        colorTextScheduleStatus =
                            Constants.Styles.COLOR_SUCCESS;
                        break;
                    case Constants.ScheduleStatus.COMPLETE:
                        colorTextScheduleStatus =
                            Constants.Styles.COLOR_BLUE_LIGHT;
                        break;
                    case Constants.ScheduleStatus.CANCELLED:
                        colorTextScheduleStatus =
                            Constants.Styles.COLOR_SECONDARY;
                        break;
                    case Constants.ScheduleStatus.REFUSE:
                        colorTextScheduleStatus = Constants.Styles.COLOR_ERROR;
                        break;
                    case Constants.ScheduleStatus.RECEIVED:
                        colorTextScheduleStatus =
                            Constants.Styles.COLOR_BLUE_GREEN;
                        break;
                    case Constants.ScheduleStatus.MOVING:
                        colorTextScheduleStatus =
                            Constants.Styles.COLOR_YELLOW_GREEN;
                        break;
                }
                const startDate = new Date(
                    parseInt(result.startDate) * 1000
                ).toLocaleDateString("en-GB");
                const endDate = new Date(
                    parseInt(result.endDate) * 1000
                ).toLocaleDateString("en-GB");
                const createdAt = new Date(
                    parseInt(result.createdAt) * 1000
                ).toLocaleString("en-GB");
                const updatedAt =
                    parseInt(result.updatedAt) > 0 &&
                    new Date(parseInt(result.updatedAt) * 1000).toLocaleString(
                        "en-GB"
                    );
                const startLocation = `${result.startLocation} - ${result.wardStart} - ${result.districtStart} - ${result.provinceStart}`;
                const endLocation = `${result.endLocation} - ${result.wardEnd} - ${result.districtEnd} - ${result.provinceEnd}`;
                const sendEmailAddress = email ? email : result.emailUser;
                let reasonCancel = null;
                let titleReasonCancel = "Lý Do";
                if (
                    result.idScheduleStatus ==
                        Constants.ScheduleStatusCode.CANCELLED ||
                    result.idScheduleStatus ==
                        Constants.ScheduleStatusCode.REFUSE
                ) {
                    reasonCancel = result.reasonCancel;
                    titleReasonCancel =
                        result.idScheduleStatus ==
                        Constants.ScheduleStatusCode.CANCELLED
                            ? "Lý Do Hủy"
                            : "Lý Do Từ Chối";
                }
                sendEmailCreateOrUpdateSchedule(
                    sendEmailAddress,
                    `Đăng Ký ${result.carType} ${result.seatNumber} Chổ ( Số: ${idSchedule} )`,
                    null,
                    result.image,
                    titleEmail,
                    colorTitleEmail,
                    result.carType,
                    result.seatNumber,
                    result.licensePlates,
                    result.scheduleStatus,
                    titleReasonCancel,
                    reasonCancel,
                    colorTextScheduleStatus,
                    `${startDate} - ${endDate}`,
                    result.reason,
                    startLocation,
                    endLocation,
                    result.fullNameUser,
                    result.phoneUser,
                    result.fullNameDriver,
                    result.phoneDriver,
                    createdAt,
                    updatedAt
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
    getSchedule,
};

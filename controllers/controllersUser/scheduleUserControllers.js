const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getUserRegisteredScheduleList = async (req, res) => {
    let { page, limitEntry } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        const idUser = req.userToken.idUser;
        const resultExecuteQuery = await executeQuery(
            db,
            `SELECT COUNT(idSchedule) as sizeQuerySnapshot FROM schedule WHERE idUser = ${idUser}`
        );
        if (!resultExecuteQuery) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_GET_DATA;
            res.status(200).send(data);
        } else {
            if (resultExecuteQuery.length > 0) {
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
                            WHERE sc.idUser = ?
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
            } else {
                dataList.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                dataList.message = Strings.Common.ERROR_GET_DATA;
                dataList.limitEntry = limitEntry;
                dataList.page = page;
                dataList.sizeQuerySnapshot =
                    resultExecuteQuery[0].sizeQuerySnapshot;
                res.status(200).send(dataList);
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
                                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
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

module.exports = {
    getUserRegisteredScheduleList,
    createOrUpdateReview,
};

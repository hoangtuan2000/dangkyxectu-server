const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

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

module.exports = {
    getAdminScheduleList
};

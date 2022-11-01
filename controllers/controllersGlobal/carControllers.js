const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");

const getCar = async (req, res) => {
    const { idCar } = req.body;
    let data = { ...Constants.ResultData };
    const sql = `SELECT * FROM car WHERE idCar = ?`;
    db.query(sql, [idCar], (err, result) => {
        //error select data
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

const getCarList = async (req, res) => {
    let {
        page,
        limitEntry,
        carType,
        carBrand,
        licensePlates,
        haveTrip,
        getAllData,
    } = req.body;

    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if (
            (carType && !helper.isArray(carType)) ||
            (carBrand && !helper.isArray(carBrand))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            const idUser = req.userToken.idUser;
            let sqlExecuteQuery = `SELECT
                COUNT(ca.idCar) as sizeQuerySnapshot
            FROM car as ca
            LEFT JOIN
                (SELECT COUNT(idSchedule) as totalSchedule, idCar
                FROM schedule
                WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.APPROVED}
                GROUP BY idCar
                ) as sc ON ca.idCar = sc.idCar
            LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
            LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
            LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
            WHERE ca.idCarStatus = ${Constants.CarStatusCode.WORK} `;

            // CHECK CONDITION SQL
            let conditionSql = "";
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
            if (carBrand && carBrand.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < carBrand.length; i++) {
                    if (!helper.isNullOrEmpty(carBrand[i])) {
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
                }
                conditionSql += sqlTemp;
            }

            if (!helper.isNullOrEmpty(haveTrip)) {
                if (helper.convertStringBooleanToBoolean(haveTrip) === true)
                    conditionSql += ` AND (sc.totalSchedule IS NOT NULL) `;
                else if (
                    helper.convertStringBooleanToBoolean(haveTrip) === false
                )
                    conditionSql += ` AND (sc.totalSchedule IS NULL) `;
            }

            if (!helper.isNullOrEmpty(licensePlates)) {
                conditionSql += ` AND (ca.licensePlates LIKE '%${licensePlates}%') `;
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
                     ca.idCar, ca.licensePlates, ca.image,
                     IFNULL(sc.totalSchedule, 0) as totalSchedule,
                     ct.idCarType, ct.name as nameCarType, ct.seatNumber,
                     cs.idCarStatus, cs.name as nameCarStatus,
                     cb.idCarBrand, cb.name as nameCarBrand
                 FROM car as ca
                 LEFT JOIN
                     (SELECT COUNT(idSchedule) as totalSchedule, idCar
                     FROM schedule
                     WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.APPROVED}
                     GROUP BY idCar
                     ) as sc ON ca.idCar = sc.idCar
                 LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                 LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
                 LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                 WHERE ca.idCarStatus = ${Constants.CarStatusCode.WORK} ${conditionSql}
                 ORDER BY ct.seatNumber`;
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

module.exports = {
    getCarList,
    getCar,
};

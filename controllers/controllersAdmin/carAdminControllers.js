const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getCarListForAdmin = async (req, res) => {
    let {
        page,
        limitEntry,
        carStatus,
        carType,
        carBrand,
        licensePlates,
        carCode,
    } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if (
            (carStatus && !helper.isArray(carStatus)) ||
            (carType && !helper.isArray(carType)) ||
            (carBrand && !helper.isArray(carBrand))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            let sqlExecuteQuery = `SELECT COUNT(ca.idCar) as sizeQuerySnapshot 
                                    FROM car as ca
                                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                                    LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
                                    LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                                    WHERE 1 = 1 `;
            // CHECK CONDITION SQL
            let conditionSql = "";
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
            if (carStatus && carStatus.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < carStatus.length; i++) {
                    if (i == 0) {
                        if (carStatus.length > 1) {
                            sqlTemp += ` AND ( cs.idCarStatus = '${carStatus[i]}' `;
                        } else {
                            sqlTemp += ` AND ( cs.idCarStatus = '${carStatus[i]}' ) `;
                        }
                    } else if (i == carStatus.length - 1) {
                        sqlTemp += ` OR cs.idCarStatus = '${carStatus[i]}' ) `;
                    } else {
                        sqlTemp += ` OR cs.idCarStatus = '${carStatus[i]}' `;
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
            if (!helper.isNullOrEmpty(carCode)) {
                conditionSql += ` AND (ca.idCar = '${carCode}') `;
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
                const sql = `SELECT 
                            ca.idCar, ca.licensePlates, ca.image,
                            IFNULL(carSchedule.numberOfTrips, 0) as numberOfTrips,
                            IFNULL(licenseExpired.licenseNumberExpired , 0) as licenseNumberExpired,
                            cbd.numberOfFailures,
                            cb.idCarBrand, cb.name as nameCarBrand,
                            ct.idCarType, ct.name as nameCarType, ct.seatNumber,
                            cs.idCarStatus, cs.name as nameCarStatus
                        FROM car as ca
                        LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                        LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                        LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
                        LEFT JOIN 
                            (SELECT COUNT(schedule.idCar) as numberOfTrips, car.idCar
                                FROM car 
                                RIGHT JOIN schedule ON car.idCar = schedule.idCar
                                GROUP BY schedule.idCar) as carSchedule ON carSchedule.idCar = ca.idCar
                        LEFT JOIN 
                            (SELECT COUNT(idCar) as numberOfFailures, idCar
                                FROM car_breakdown
                                GROUP BY idCar) as cbd ON cbd.idCar = ca.idCar
                        LEFT JOIN
                            (SELECT COUNT(cld.idCar) as licenseNumberExpired, cld.idCar
                                FROM car as ca
                                RIGHT JOIN car_license_detail as cld 
                                ON ca.idCar = cld.idCar 
                                AND DATE(FROM_UNIXTIME(cld.carLicenseExpirationDate)) <= CURRENT_DATE()
                                GROUP BY cld.idCar) as licenseExpired ON licenseExpired.idCar = ca.idCar  
                        WHERE 1 = 1 ${conditionSql}   
                        LIMIT ${limitEntry * page - limitEntry}, ${limitEntry}`;
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

const createCar = async (req, res) => {
    const {
        licensePlates,
        idCarColor,
        idCarBrand,
        idCarType,
        dateCarRegistrationCertificate,
        datePeriodicInspectionCertificate,
        dateCarInsurance,
    } = req.body;
    let data = { ...Constants.ResultData };
    if (req.userToken) {
        // VALIDATE DATA
        if (
            helper.isNullOrEmpty(licensePlates) ||
            helper.isNullOrEmpty(idCarBrand) ||
            helper.isNullOrEmpty(idCarColor) ||
            helper.isNullOrEmpty(idCarType) ||
            !helper.isArray(dateCarRegistrationCertificate) ||
            !helper.isArray(datePeriodicInspectionCertificate) ||
            !helper.isArray(dateCarInsurance) ||
            helper.isArrayEmpty(dateCarRegistrationCertificate) ||
            helper.isArrayEmpty(datePeriodicInspectionCertificate) ||
            helper.isArrayEmpty(dateCarInsurance)
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            const urlImageFirebase = req.urlImageFirebase;
            const currentDate = helper.formatTimeStamp(new Date().getTime());
            // INSERT CAR
            const sqlCreateCar = `INSERT INTO 
            car(licensePlates, image, createdAt, idCarColor, idCarBrand, idCarStatus, idCarType) VALUES (?,?,?,?,?,?,?)`;
            db.query(
                sqlCreateCar,
                [
                    licensePlates,
                    urlImageFirebase,
                    currentDate,
                    idCarColor,
                    idCarBrand,
                    Constants.CarStatusCode.WORK,
                    idCarType,
                ],
                (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        if (result.affectedRows > 0) {
                            // INSERT CAR LICENSE
                            const sqlCreateCarLicense = `INSERT INTO 
                            car_license_detail(idCar, idCarLicense, carLicenseDate, carLicenseExpirationDate, createdAt) VALUES ?`;
                        } else {
                            data.status =
                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                            data.message = Strings.Common.ERROR;
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

module.exports = {
    getCarListForAdmin,
    createCar,
};

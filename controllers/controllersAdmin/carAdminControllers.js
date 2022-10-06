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
        licenseExpires,
        haveTrip,
        haveMaintenance,
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
                                    LEFT JOIN 
                                        (SELECT COUNT(schedule.idCar) as numberOfTrips, car.idCar
                                        FROM car, schedule 
                                        WHERE car.idCar = schedule.idCar
                                        GROUP BY schedule.idCar) as trip ON trip.idCar = ca.idCar
                                    LEFT JOIN 
                                        (SELECT COUNT(idCar) as numberOfMaintenance, idCar
                                        FROM car_breakdown
                                        GROUP BY idCar) as maintenance ON maintenance.idCar = ca.idCar
                                    LEFT JOIN
                                        (SELECT COUNT(cld.idCar) as licenseNumberExpired, cld.idCar
                                        FROM car as ca, car_license_detail as cld 
                                        WHERE ca.idCar = cld.idCar 
                                        AND DATE(FROM_UNIXTIME(cld.carLicenseExpirationDate)) <= CURRENT_DATE()
                                        AND noExpireDate = 0
                                        GROUP BY cld.idCar) as licenseExpired ON licenseExpired.idCar = ca.idCar
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
            if (!helper.isNullOrEmpty(licenseExpires)) {
                // license expired
                if (licenseExpires === true)
                    conditionSql += ` AND (licenseExpired.licenseNumberExpired IS NOT NULL) `;
                // license not expired
                else if (licenseExpires === false)
                    conditionSql += ` AND (licenseExpired.licenseNumberExpired IS NULL) `;
            }
            if (!helper.isNullOrEmpty(haveTrip)) {
                if (haveTrip === true)
                    conditionSql += ` AND (trip.numberOfTrips IS NOT NULL) `;
                else if (haveTrip === false)
                    conditionSql += ` AND (trip.numberOfTrips IS NULL) `;
            }
            if (!helper.isNullOrEmpty(haveMaintenance)) {
                if (haveMaintenance === true)
                    conditionSql += ` AND (maintenance.numberOfMaintenance IS NOT NULL) `;
                else if (haveMaintenance === false)
                    conditionSql += ` AND (maintenance.numberOfMaintenance IS NULL) `;
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
                                IFNULL(trip.numberOfTrips, 0) as numberOfTrips,
                                IFNULL(licenseExpired.licenseNumberExpired , 0) as licenseNumberExpired,
                                maintenance.numberOfMaintenance,
                                cb.idCarBrand, cb.name as nameCarBrand,
                                ct.idCarType, ct.name as nameCarType, ct.seatNumber,
                                cs.idCarStatus, cs.name as nameCarStatus
                            FROM car as ca
                            LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                            LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                            LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
                            LEFT JOIN 
                                (SELECT COUNT(schedule.idCar) as numberOfTrips, car.idCar
                                    FROM car, schedule 
                                    WHERE car.idCar = schedule.idCar
                                    GROUP BY schedule.idCar) as trip ON trip.idCar = ca.idCar
                            LEFT JOIN 
                                (SELECT COUNT(idCar) as numberOfMaintenance, idCar
                                    FROM car_breakdown
                                    GROUP BY idCar) as maintenance ON maintenance.idCar = ca.idCar
                            LEFT JOIN
                                (SELECT COUNT(cld.idCar) as licenseNumberExpired, cld.idCar
                                    FROM car as ca, car_license_detail as cld 
                                    WHERE ca.idCar = cld.idCar 
                                    AND DATE(FROM_UNIXTIME(cld.carLicenseExpirationDate)) <= CURRENT_DATE()
                                    AND noExpireDate = 0
                                    GROUP BY cld.idCar) as licenseExpired ON licenseExpired.idCar = ca.idCar
                            WHERE 1 = 1 ${conditionSql}   
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

const getCarToUpdate = async (req, res) => {
    const { idCar } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT 
                        ca.idCar, ca.image, ca.licensePlates, ca.createdAt, ca.updatedAt,
                        ad.idUser as idAdmin, ad.fullName as fullNameAdmin, ad.code as codeAdmin, ad.email as emailAdmin, ad.phone as phoneAdmin,
                        ct.idCarType, ct.name as nameCarType, ct.seatNumber,
                        cs.idCarStatus, cs.name as nameCarStatus,
                        cb.idCarBrand, cb.name as nameCarBrand,
                        cc.idCarColor, cc.name as nameCarColor
                    FROM car as ca
                    LEFT JOIN user as ad ON ad.idUser = ca.idAdmin
                    LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                    LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
                    LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                    LEFT JOIN car_color as cc ON cc.idCarColor = ca.idCarColor
                    WHERE ca.idCar = ?`;
        db.query(sql, idCar, (err, result) => {
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
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getCarLicense = async (req, res) => {
    const { group, idCar } = req.body;

    let data = { ...Constants.ResultData };

    if (group) {
        const arrNameCarLicense = group.split(",") || group;

        for (let i = 0; i < arrNameCarLicense.length; i++) {
            const nameCarLicense = arrNameCarLicense[i].replace(
                /\s+|\s+/gm,
                ""
            ); //remove space
            let idCarLicense = null;
            switch (nameCarLicense) {
                case Constants.CarLicense.REGISTRATION_CERTIFICATE:
                    idCarLicense =
                        Constants.CarLicenseCode.REGISTRATION_CERTIFICATE;
                    break;
                case Constants.CarLicense.PERIODIC_INSPECTION_CERTIFICATE:
                    idCarLicense =
                        Constants.CarLicenseCode
                            .PERIODIC_INSPECTION_CERTIFICATE;
                    break;
                case Constants.CarLicense.INSURANCE:
                    idCarLicense = Constants.CarLicenseCode.INSURANCE;
                    break;
            }
            const result = await executeQuery(
                db,
                `SELECT cld.*, ad.fullName as fullNameAdmin, ad.code as codeAdmin
                FROM car_license_detail as cld
                LEFT JOIN user as ad ON ad.idUser = cld.idAdmin
                WHERE idCar = ${idCar} AND idCarLicense = ${idCarLicense}`
            );
            if (!result) {
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.ERROR_GET_DATA;
                data.data = [];
                break;
            } else {
                if (result.length > 0) {
                    const tempObject = {};
                    tempObject[`${nameCarLicense}`] = [...result];
                    data.data = { ...data.data, ...tempObject };
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                } else {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.ERROR_GET_DATA;
                    data.data = [];
                    break;
                }
            }
        }
        res.status(200).send(data);
    } else {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    }
};

const checkLicensePlatesExist = async (req, res, next) => {
    const { licensePlates, idCar } = req.body;
    if (licensePlates) {
        let data = { ...Constants.ResultData };
        let sql = `SELECT * FROM car WHERE licensePlates = ?`;
        if (idCar) {
            sql = `SELECT * FROM car WHERE licensePlates = ? AND idCar != ${idCar}`;
        }
        db.query(sql, licensePlates, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            } else {
                // LICENSE PLATES EXIST
                if (result.length > 0) {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LICENSE_PLATES_EXIST;
                    res.status(200).send(data);
                } else {
                    next();
                }
            }
        });
    } else {
        next();
    }
};

// CREATE CAR
const validateDataCreateCar = async (req, res, next) => {
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

    // CHECK DATA NULL / EMPTY / INVALID DATA
    if (
        helper.isNullOrEmpty(licensePlates) ||
        helper.isNullOrEmpty(idCarBrand) ||
        helper.isNullOrEmpty(idCarColor) ||
        helper.isNullOrEmpty(idCarType) ||
        helper.isNullOrEmpty(dateCarRegistrationCertificate) ||
        helper.isNullOrEmpty(datePeriodicInspectionCertificate) ||
        helper.isNullOrEmpty(dateCarInsurance)
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    } else if (
        !helper.isValidStringBetweenMinMaxLength(
            licensePlates,
            Constants.Common.CHARACTERS_MIN_LENGTH_LICENSE_PLATES,
            Constants.Common.CHARACTERS_MAX_LENGTH_LICENSE_PLATES
        )
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.SUPPORT_LENGTH_LICENSE_PLATES;
        res.status(200).send(data);
    }
    // CHECK NOT ARRAY OR ARRAY EMPTY
    else if (
        helper.isArrayEmpty(dateCarRegistrationCertificate) ||
        helper.isArrayEmpty(datePeriodicInspectionCertificate) ||
        helper.isArrayEmpty(dateCarInsurance) ||
        !helper.isArray(dateCarRegistrationCertificate) ||
        !helper.isArray(datePeriodicInspectionCertificate) ||
        !helper.isArray(dateCarInsurance)
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.INVALID_DATA;
        res.status(200).send(data);
    }
    // CHECK LENGTH OF ARRAY DATE
    else if (
        !helper.isValidArrayLength(dateCarRegistrationCertificate, 2) ||
        !helper.isValidArrayLength(datePeriodicInspectionCertificate, 2) ||
        !helper.isValidArrayLength(dateCarInsurance, 2)
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.INVALID_DATA;
        res.status(200).send(data);
    }
    // CHECK VALID DATE RANGE
    else if (
        !helper.isStartTimeStampLessThanOrEqualEndTimeStamp(
            dateCarRegistrationCertificate[0],
            dateCarRegistrationCertificate[1]
        ) ||
        !helper.isStartTimeStampSmallerEndTimestamp(
            datePeriodicInspectionCertificate[0],
            datePeriodicInspectionCertificate[1]
        ) ||
        !helper.isStartTimeStampSmallerEndTimestamp(
            dateCarInsurance[0],
            dateCarInsurance[1]
        )
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.INVALID_DATE;
        res.status(200).send(data);
    } else {
        next();
    }
};

const createCar = async (req, res, next) => {
    const { licensePlates, idCarColor, idCarBrand, idCarType } = req.body;
    let data = { ...Constants.ResultData };
    if (req.userToken) {
        if (req.urlImageFirebase) {
            const idUser = req.userToken.idUser;
            const urlImageFirebase = req.urlImageFirebase;
            const currentDate = helper.formatTimeStamp(new Date().getTime());
            const idCarStatus = Constants.CarStatusCode.WORK;
            // INSERT CAR
            const sqlCreateCar = `INSERT INTO
                car(licensePlates, image, createdAt, idCarColor, idCarBrand, idCarStatus, idCarType, idAdmin) VALUES (?,?,?,?,?,?,?,?)`;
            db.beginTransaction(function (err) {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                }
                db.query(
                    sqlCreateCar,
                    [
                        licensePlates,
                        urlImageFirebase,
                        currentDate,
                        idCarColor,
                        idCarBrand,
                        idCarStatus,
                        idCarType,
                        idUser,
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
                                        req.idCarJustCreate = results.insertId;
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
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_SERVER;
            res.status(200).send(data);
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const createCarLicense = async (req, res, next) => {
    const {
        dateCarRegistrationCertificate,
        datePeriodicInspectionCertificate,
        dateCarInsurance,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const idUser = req.userToken.idUser;
        const idCarJustCreate = req.idCarJustCreate;
        const currentDate = helper.formatTimeStamp(new Date().getTime());
        const noExpireDate = helper.isTwoEqualDateTimestamp(
            dateCarRegistrationCertificate[0],
            dateCarRegistrationCertificate[1]
        )
            ? 1
            : 0;
        // FORMAT DATA
        let arrayData = [
            [
                idCarJustCreate,
                Constants.CarLicenseCode.REGISTRATION_CERTIFICATE,
                helper.formatTimeStamp(dateCarRegistrationCertificate[0]),
                helper.formatTimeStamp(dateCarRegistrationCertificate[1]),
                noExpireDate,
                currentDate,
                idUser,
            ],
            [
                idCarJustCreate,
                Constants.CarLicenseCode.PERIODIC_INSPECTION_CERTIFICATE,
                helper.formatTimeStamp(datePeriodicInspectionCertificate[0]),
                helper.formatTimeStamp(datePeriodicInspectionCertificate[1]),
                0,
                currentDate,
                idUser,
            ],
            [
                idCarJustCreate,
                Constants.CarLicenseCode.INSURANCE,
                helper.formatTimeStamp(dateCarInsurance[0]),
                helper.formatTimeStamp(dateCarInsurance[1]),
                0,
                currentDate,
                idUser,
            ],
        ];

        // INSERT CAR LICENSE
        const sqlCreateCarLicense = `INSERT INTO car_license_detail(idCar, idCarLicense, carLicenseDate, carLicenseExpirationDate, noExpireDate, createdAt, idAdmin) VALUES ? `;
        db.beginTransaction(function (err) {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            }
            db.query(
                sqlCreateCarLicense,
                [arrayData],
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
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

// UPDATE CAR
const validateDataUpdateCar = async (req, res, next) => {
    const {
        licensePlates,
        idCarColor,
        idCarBrand,
        idCarType,
        idCarStatus,
        dateCarRegistrationCertificate,
        datePeriodicInspectionCertificate,
        dateCarInsurance,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (
        !licensePlates &&
        !idCarColor &&
        !idCarBrand &&
        !idCarType &&
        !idCarStatus &&
        !dateCarRegistrationCertificate &&
        !datePeriodicInspectionCertificate &&
        !dateCarInsurance
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.DATA_IS_UNCHANGED;
        res.status(200).send(data);
    } else if (
        !helper.isNullOrEmpty(licensePlates) &&
        !helper.isValidStringBetweenMinMaxLength(
            licensePlates,
            Constants.Common.CHARACTERS_MIN_LENGTH_LICENSE_PLATES,
            Constants.Common.CHARACTERS_MAX_LENGTH_LICENSE_PLATES
        )
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.SUPPORT_LENGTH_LICENSE_PLATES;
        res.status(200).send(data);
    }
    // CHECK NOT ARRAY OR ARRAY EMPTY
    else if (
        (!helper.isNullOrEmpty(dateCarRegistrationCertificate) &&
            (helper.isArrayEmpty(dateCarRegistrationCertificate) ||
                !helper.isArray(dateCarRegistrationCertificate))) ||
        (!helper.isNullOrEmpty(datePeriodicInspectionCertificate) &&
            (helper.isArrayEmpty(datePeriodicInspectionCertificate) ||
                !helper.isArray(datePeriodicInspectionCertificate))) ||
        (!helper.isNullOrEmpty(dateCarInsurance) &&
            (helper.isArrayEmpty(dateCarInsurance) ||
                !helper.isArray(dateCarInsurance)))
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.INVALID_DATA;
        res.status(200).send(data);
    }
    // CHECK LENGTH OF ARRAY DATE
    else if (
        (!helper.isNullOrEmpty(dateCarRegistrationCertificate) &&
            !helper.isValidArrayLength(dateCarRegistrationCertificate, 2)) ||
        (!helper.isNullOrEmpty(datePeriodicInspectionCertificate) &&
            !helper.isValidArrayLength(datePeriodicInspectionCertificate, 2)) ||
        (!helper.isNullOrEmpty(dateCarInsurance) &&
            !helper.isValidArrayLength(dateCarInsurance, 2))
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.INVALID_DATA;
        res.status(200).send(data);
    }
    // CHECK VALID DATE RANGE
    else if (
        (!helper.isNullOrEmpty(dateCarRegistrationCertificate) &&
            !helper.isStartTimeStampLessThanOrEqualEndTimeStamp(
                dateCarRegistrationCertificate[0],
                dateCarRegistrationCertificate[1]
            )) ||
        (!helper.isNullOrEmpty(datePeriodicInspectionCertificate) &&
            !helper.isStartTimeStampSmallerEndTimestamp(
                datePeriodicInspectionCertificate[0],
                datePeriodicInspectionCertificate[1]
            )) ||
        (!helper.isNullOrEmpty(dateCarInsurance) &&
            !helper.isStartTimeStampSmallerEndTimestamp(
                dateCarInsurance[0],
                dateCarInsurance[1]
            ))
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.INVALID_DATE;
        res.status(200).send(data);
    } else {
        next();
    }
};

const getImageCar = async (req, res, next) => {
    const { idCar } = req.body;
    const sql = `SELECT image FROM car WHERE idCar = ?`;
    db.query(sql, idCar, (err, result) => {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_GET_DATA;
            res.status(200).send(data);
        } else {
            req.deleteImage = result.length > 0 && result[0].image;
            next();
        }
    });
};

const updateCar = async (req, res, next) => {
    const {
        idCar,
        licensePlates,
        idCarColor,
        idCarBrand,
        idCarType,
        idCarStatus,
    } = req.body;
    let data = { ...Constants.ResultData };
    if (req.userToken) {
        const idUser = req.userToken.idUser;
        const urlImageFirebase = req.urlImageFirebase;
        const currentDate = helper.formatTimeStamp(new Date().getTime());
        // UPDATE CAR
        let sql = null;
        let sqlData = "";
        if (urlImageFirebase) {
            sqlData += ` image = '${urlImageFirebase}',`;
        }
        if (licensePlates) {
            sqlData += ` licensePlates = '${licensePlates}',`;
        }
        if (idCarColor) {
            sqlData += ` idCarColor = ${idCarColor},`;
        }
        if (idCarBrand) {
            sqlData += ` idCarBrand = ${idCarBrand},`;
        }
        if (idCarType) {
            sqlData += ` idCarType = ${idCarType},`;
        }
        if (idCarStatus) {
            sqlData += ` idCarStatus = ${idCarStatus},`;
        }

        if (sqlData) {
            sql = `UPDATE car SET ${sqlData} updatedAt = ${currentDate}, idAdmin = ${idUser} WHERE idCar = ${idCar}`;
        }

        if (sql) {
            db.query(sql, (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR_SERVER;
                    res.status(200).send(data);
                } else {
                    if (result.changedRows > 0) {
                        next();
                    } else {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR_SERVER;
                        res.status(200).send(data);
                    }
                }
            });
        } else {
            next();
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const updateCarLicense = async (req, res, next) => {
    const {
        idCar,
        dateCarRegistrationCertificate,
        datePeriodicInspectionCertificate,
        dateCarInsurance,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const idUser = req.userToken.idUser;
        // FORMAT SQL
        if (
            dateCarRegistrationCertificate ||
            datePeriodicInspectionCertificate ||
            dateCarInsurance
        ) {
            const currentDate = helper.formatTimeStamp(new Date().getTime());
            let errorUpdate = false;

            // UPDATE Registration Certificate
            if (dateCarRegistrationCertificate) {
                const noExpireDate = helper.isTwoEqualDateTimestamp(
                    dateCarRegistrationCertificate[0],
                    dateCarRegistrationCertificate[1]
                )
                    ? 1
                    : 0;
                let carLicenseDate = helper.formatTimeStamp(
                    dateCarRegistrationCertificate[0]
                );
                let carLicenseExpirationDate = helper.formatTimeStamp(
                    dateCarRegistrationCertificate[1]
                );
                const result = await executeQuery(
                    db,
                    `UPDATE car_license_detail SET carLicenseDate='${carLicenseDate}',
                carLicenseExpirationDate='${carLicenseExpirationDate}',
                noExpireDate='${noExpireDate}', updatedAt='${currentDate}' , idAdmin=${idUser}
                WHERE idCar = '${idCar}' AND idCarLicense = '${Constants.CarLicenseCode.REGISTRATION_CERTIFICATE}' `
                );
                if (!result || result.changedRows <= 0) {
                    errorUpdate = true;
                }
            }

            // UPDATE Periodic Inspection Certificate
            if (datePeriodicInspectionCertificate) {
                let carLicenseDate = helper.formatTimeStamp(
                    datePeriodicInspectionCertificate[0]
                );
                let carLicenseExpirationDate = helper.formatTimeStamp(
                    datePeriodicInspectionCertificate[1]
                );
                const result = await executeQuery(
                    db,
                    `UPDATE car_license_detail SET carLicenseDate='${carLicenseDate}',
                carLicenseExpirationDate='${carLicenseExpirationDate}',
                noExpireDate='0', updatedAt='${currentDate}' , idAdmin=${idUser}
                WHERE idCar = '${idCar}' AND idCarLicense = '${Constants.CarLicenseCode.PERIODIC_INSPECTION_CERTIFICATE}'`
                );
                if (!result || result.changedRows <= 0) {
                    errorUpdate = true;
                }
            }

            // UPDATE Insurance
            if (dateCarInsurance) {
                let carLicenseDate = helper.formatTimeStamp(
                    dateCarInsurance[0]
                );
                let carLicenseExpirationDate = helper.formatTimeStamp(
                    dateCarInsurance[1]
                );
                const result = await executeQuery(
                    db,
                    `UPDATE car_license_detail SET carLicenseDate='${carLicenseDate}',
                carLicenseExpirationDate='${carLicenseExpirationDate}',
                noExpireDate='0', updatedAt='${currentDate}', idAdmin=${idUser}
                WHERE idCar = '${idCar}' AND idCarLicense = '${Constants.CarLicenseCode.INSURANCE}'`
                );
                if (!result || result.changedRows <= 0) {
                    errorUpdate = true;
                }
            }

            if (errorUpdate) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            } else {
                next();
            }
        } else {
            next();
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

module.exports = {
    getCarListForAdmin,
    getCarToUpdate,
    validateDataCreateCar,
    checkLicensePlatesExist,
    createCar,
    createCarLicense,
    getCarLicense,
    validateDataUpdateCar,
    updateCar,
    getImageCar,
    updateCarLicense,
};

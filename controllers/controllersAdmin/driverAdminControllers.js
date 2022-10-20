const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getDriverList = async (req, res) => {
    let {
        page,
        limitEntry,
        driverLicense,
        driverStatus,
        starNumber,
        licenseExpires,
        numberOfTrip,
        codeDriver,
        fullNameDriver,
        emailDriver,
        phoneDriver,
    } = req.body;

    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;

    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if (
            (driverLicense && !helper.isArray(driverLicense)) ||
            (driverStatus && !helper.isArray(driverStatus))
        ) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            let sqlExecuteQuery = `SELECT 
                    COUNT(dr.idUser) as sizeQuerySnapshot 
                FROM user as dr
                LEFT JOIN driver_license as dl ON dl.idDriverLicense = dr.idDriverLicense
                LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
                LEFT JOIN
                    (SELECT idDriver, COUNT(idDriver) as numberOfTrips
                    FROM schedule 
                    WHERE idDriver IS NOT NULL
                    GROUP BY idDriver) as trip ON trip.idDriver = dr.idUser
                LEFT JOIN 
                    (SELECT sc.*, AVG(rv.starNumber) as averageStar
                    FROM review as rv
                    RIGHT JOIN
                        (SELECT dr.idUser as idDriver, sc.idSchedule
                        FROM user as dr
                        LEFT JOIN schedule as sc ON sc.idDriver = dr.idUser
                        WHERE idRole = ${Constants.RoleCode.DRIVER} 
                        AND sc.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE} ) as sc
                        ON sc.idSchedule = rv.idSchedule
                    GROUP BY sc.idDriver) as avgRv
                    ON avgRv.idDriver = dr.idUser
                WHERE idRole = ${Constants.RoleCode.DRIVER} `;

            let conditionSql = "";
            if (driverLicense && driverLicense.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < driverLicense.length; i++) {
                    if (i == 0) {
                        if (driverLicense.length > 1) {
                            sqlTemp += ` AND ( dl.idDriverLicense = '${driverLicense[i]}' `;
                        } else {
                            sqlTemp += ` AND ( dl.idDriverLicense = '${driverLicense[i]}' ) `;
                        }
                    } else if (i == driverLicense.length - 1) {
                        sqlTemp += ` OR dl.idDriverLicense = '${driverLicense[i]}' ) `;
                    } else {
                        sqlTemp += ` OR dl.idDriverLicense = '${driverLicense[i]}' `;
                    }
                }
                conditionSql += sqlTemp;
            }

            if (driverStatus && driverStatus.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < driverStatus.length; i++) {
                    if (i == 0) {
                        if (driverStatus.length > 1) {
                            sqlTemp += ` AND ( uss.idUserStatus = '${driverStatus[i]}' `;
                        } else {
                            sqlTemp += ` AND ( uss.idUserStatus = '${driverStatus[i]}' ) `;
                        }
                    } else if (i == driverStatus.length - 1) {
                        sqlTemp += ` OR uss.idUserStatus = '${driverStatus[i]}' ) `;
                    } else {
                        sqlTemp += ` OR uss.idUserStatus = '${driverStatus[i]}' `;
                    }
                }
                conditionSql += sqlTemp;
            }

            if (!helper.isNullOrEmpty(starNumber)) {
                if (starNumber == 0) {
                    conditionSql += ` AND (avgRv.averageStar IS NULL OR avgRv.averageStar = 0) `;
                } else {
                    conditionSql += ` AND (avgRv.averageStar = ${starNumber}) `;
                }
            }

            if (!helper.isNullOrEmpty(licenseExpires)) {
                if (helper.convertStringBooleanToBoolean(licenseExpires)) {
                    conditionSql += ` AND (DATE(FROM_UNIXTIME(dr.driverLicenseExpirationDate)) <= CURRENT_DATE()) `;
                } else {
                    conditionSql += ` AND (DATE(FROM_UNIXTIME(dr.driverLicenseExpirationDate)) > CURRENT_DATE()) `;
                }
            }

            if (!helper.isNullOrEmpty(numberOfTrip)) {
                conditionSql += ` AND (trip.numberOfTrips = ${numberOfTrip}) `;
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
                const sql = `SELECT
                                IFNULL(avgRv.averageStar, 0) as averageStar,
                                IFNULL(trip.numberOfTrips, 0) as numberOfTrips,
                                dr.idUser as idDriver, dr.fullName as fullNameDriver,
                                dr.code as codeDriver, dr.phone as phoneDriver, dr.email as emailDriver,
                                dl.idDriverLicense, dl.name as nameDriverLicense,
                                uss.idUserStatus, uss.name as nameUserStatus
                            FROM user as dr
                            LEFT JOIN driver_license as dl ON dl.idDriverLicense = dr.idDriverLicense
                            LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
                            LEFT JOIN
                                (SELECT idDriver, COUNT(idDriver) as numberOfTrips
                                FROM schedule
                                WHERE idDriver IS NOT NULL
                                GROUP BY idDriver) as trip ON trip.idDriver = dr.idUser
                                LEFT JOIN 
                                (SELECT sc.*, AVG(rv.starNumber) as averageStar
                                FROM review as rv
                                RIGHT JOIN
                                    (SELECT dr.idUser as idDriver, sc.idSchedule
                                    FROM user as dr
                                    LEFT JOIN schedule as sc ON sc.idDriver = dr.idUser
                                    WHERE idRole = ${Constants.RoleCode.DRIVER} 
                                    AND sc.idScheduleStatus = ${
                                        Constants.ScheduleStatusCode.COMPLETE
                                    } ) as sc
                                    ON sc.idSchedule = rv.idSchedule
                                GROUP BY sc.idDriver) as avgRv
                                ON avgRv.idDriver = dr.idUser
                            WHERE idRole = ${Constants.RoleCode.DRIVER}
                            ORDER BY dr.code
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

module.exports = { getDriverList };

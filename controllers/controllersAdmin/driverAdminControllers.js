const { async } = require("@firebase/util");
const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { ldapClient } = require("../../middlewares/ldap/ldapConfig");
const ldap = require("ldapjs");
const db = require("../../models/index");
require("dotenv").config();

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
                    (SELECT sc.*, ROUND(AVG(rv.starNumber)) as averageStar
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

            if (!helper.isNullOrEmpty(codeDriver)) {
                conditionSql += ` AND (dr.code = '${codeDriver}') `;
            }

            if (!helper.isNullOrEmpty(fullNameDriver)) {
                conditionSql += ` AND (dr.fullName  LIKE '%${fullNameDriver}%') `;
            }

            if (!helper.isNullOrEmpty(emailDriver)) {
                conditionSql += ` AND (dr.email  LIKE '%${emailDriver}%') `;
            }

            if (!helper.isNullOrEmpty(phoneDriver)) {
                conditionSql += ` AND (dr.phone  LIKE '%${phoneDriver}%') `;
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
                                (SELECT sc.*, ROUND(AVG(rv.starNumber)) as averageStar
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
                            WHERE idRole = ${
                                Constants.RoleCode.DRIVER
                            }  ${conditionSql}
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

const getInfoDriver = async (req, res) => {
    let { idDriver } = req.body;

    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT
            avgRv.averageStar,
            dr.fullName, dr.code, dr.email, dr.phone, 
            dr.driverLicenseExpirationDate, dr.address,
            dr.createdAt, dr.updatedAt,
            userUpdate.idUser as idUserUpdate, userUpdate.fullName as fullNameUserUpdate,
            userUpdate.code as codeUserUpdate,
            uss.idUserStatus, uss.name as nameUserStatus,
            dl.idDriverLicense, dl.name as nameDriverLicense,
            wa.idWard, wa.name as nameWard, wa.type as typeWard, wa.idDistrict as idDistrictWard,
            ds.idDistrict, ds.name as nameDistrict, ds.type as typeDistrict, ds.idProvince as idProvinceDistrict,
            pv.idProvince, pv.name as nameProvince, pv.type as typeProvince
            FROM user as dr
            LEFT JOIN user as userUpdate ON userUpdate.idUser = dr.idUserUpdate
            LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
            LEFT JOIN driver_license as dl ON dl.idDriverLicense = dr.idDriverLicense
            LEFT JOIN ward as wa ON wa.idWard = dr.idWard
            LEFT JOIN district as ds ON ds.idDistrict = wa.idDistrict
            LEFT JOIN province as pv ON pv.idProvince = ds.idProvince
            LEFT JOIN 
                (SELECT sc.*, ROUND(AVG(rv.starNumber)) as averageStar
                FROM review as rv
                RIGHT JOIN
                    (SELECT dr.idUser as idDriver, sc.idSchedule
                    FROM user as dr
                    LEFT JOIN schedule as sc ON sc.idDriver = dr.idUser
                    WHERE idRole = ${Constants.RoleCode.DRIVER} AND dr.idUser = ${idDriver}
                    AND sc.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}) as sc
                ON sc.idSchedule = rv.idSchedule
                GROUP BY sc.idDriver) as avgRv
                ON avgRv.idDriver = dr.idUser
            WHERE dr.idUser = ${idDriver} AND dr.idRole = ${Constants.RoleCode.DRIVER}`;
        db.query(sql, idDriver, (err, result) => {
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
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getDriverToUpdate = async (req, res) => {
    let { idDriver } = req.body;

    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT
                        dr.fullName, dr.code, dr.email, dr.phone, 
                        dr.driverLicenseExpirationDate, dr.address,
                        uss.idUserStatus, uss.name as nameUserStatus,
                        dl.idDriverLicense, dl.name as nameDriverLicense,
                        wa.idWard, wa.name as nameWard, wa.type as typeWard, wa.idDistrict as idDistrictWard,
                        ds.idDistrict, ds.name as nameDistrict, ds.type as typeDistrict, ds.idProvince as idProvinceDistrict,
                        pv.idProvince, pv.name as nameProvince, pv.type as typeProvince
                    FROM user as dr
                    LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
                    LEFT JOIN driver_license as dl ON dl.idDriverLicense = dr.idDriverLicense
                    LEFT JOIN ward as wa ON wa.idWard = dr.idWard
                    LEFT JOIN district as ds ON ds.idDistrict = wa.idDistrict
                    LEFT JOIN province as pv ON pv.idProvince = ds.idProvince
                    WHERE dr.idUser = ?`;
        db.query(sql, idDriver, (err, result) => {
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
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

// CREATE DRIVER
const createDriver = async (req, res) => {
    let {
        idDriverLicense,
        fullName,
        code,
        email,
        pass,
        phone,
        driverLicenseExpirationDate,
        address,
        idWard,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        if (!idDriverLicense || !driverLicenseExpirationDate) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.NOT_ENOUGH_DATA;
            res.status(200).send(data);
        } else if (!helper.isTimeStamp(driverLicenseExpirationDate)) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            const idUser = req.userToken.idUser;
            let currentDate = helper.formatTimeStamp(new Date().getTime());
            const sql = `INSERT INTO user(fullName, code, email, phone, address, driverLicenseExpirationDate,
                    createdAt,  idDriverLicense, idRole, idWard, idUserStatus, idUserUpdate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

            driverLicenseExpirationDate = helper.formatTimeStamp(
                driverLicenseExpirationDate
            );
            fullName = helper.removeVietnameseAccents(fullName);
            db.beginTransaction(function (err) {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                }
                db.query(
                    sql,
                    [
                        fullName,
                        code,
                        email,
                        phone,
                        address,
                        driverLicenseExpirationDate,
                        currentDate,
                        idDriverLicense,
                        Constants.RoleCode.DRIVER,
                        idWard,
                        Constants.UserStatusCode.WORKING,
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
                                db.commit(async function (err) {
                                    if (err) {
                                        return db.rollback(function () {
                                            data.status =
                                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                            data.message = Strings.Common.ERROR;
                                            res.status(200).send(data);
                                        });
                                    } else {
                                        const resultAddUserLdap =
                                            await addDriverLdap(
                                                fullName,
                                                code,
                                                pass
                                            );
                                        if (resultAddUserLdap) {
                                            data.status = Constants.ApiCode.OK;
                                            data.message =
                                                Strings.Common.SUCCESS;
                                            res.status(200).send(data);
                                        } else {
                                            return db.rollback(function () {
                                                data.status =
                                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                                data.message =
                                                    Strings.Common.ERROR;
                                                res.status(200).send(data);
                                            });
                                        }
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
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const addDriverLdap = async (fullName, code, password) => {
    const result = await ldapClient.bind(
        process.env.DN_LDAP_ADMIN,
        process.env.SECRET_LDAP_ADMIN,
        function (err) {
            // error authentication ldap server
            if (err) {
                console.log("err addDriverLdap 1", err);
                return false;
            }
            // get data user => token
            else {
                var entry = {
                    sn: `${fullName}`,
                    objectclass: `${process.env.OBJECT_CLASS_LDAP}`,
                    userPassword: `${password}`,
                };
                ldapClient.add(
                    `cn=${code},ou=users,ou=system`,
                    entry,
                    function (err) {
                        if (err) {
                            console.log("err addDriverLdap 2" + err);
                            return false;
                        } else {
                            console.log("added user");
                            return true;
                        }
                    }
                );
            }
        }
    );

    return result;
};

//UDPATE DRIVER
const updateDriver = async (req, res) => {
    let {
        idUser,
        idDriverLicense,
        fullName,
        code,
        email,
        pass,
        phone,
        driverLicenseExpirationDate,
        address,
        idWard,
        idUserStatus,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        if (idUser) {
            if (
                driverLicenseExpirationDate &&
                !helper.isTimeStamp(driverLicenseExpirationDate)
            ) {
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.INVALID_DATA;
                res.status(200).send(data);
            } else {
                const sqlGetCodeOld = `SELECT code as codeOld FROM user WHERE idUser = ?`;
                const resExecuteQuery = await executeQuery(
                    db,
                    sqlGetCodeOld,
                    idUser
                );
                if (!resExecuteQuery) {
                    console.log("err !resExecuteQuery");
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.ERROR_GET_DATA;
                    res.status(200).send(data);
                } else {
                    if (resExecuteQuery.length > 0) {
                        const idCurrentUser = req.userToken.idUser;
                        const currentDate = helper.formatTimeStamp(
                            new Date().getTime()
                        );
                        let codeOld = resExecuteQuery[0].codeOld;
                        // UPDATE DRIVER
                        let sql = null;
                        let sqlData = "";
                        if (idDriverLicense) {
                            sqlData += ` idDriverLicense = '${idDriverLicense}',`;
                        }
                        if (fullName) {
                            fullName = helper.removeVietnameseAccents(fullName);
                            sqlData += ` fullName = '${fullName}',`;
                        }
                        if (code) {
                            sqlData += ` code = '${code}',`;
                        }
                        if (email) {
                            sqlData += ` email = '${email}',`;
                        }
                        if (phone) {
                            sqlData += ` phone = '${phone}',`;
                        }
                        if (driverLicenseExpirationDate) {
                            driverLicenseExpirationDate =
                                helper.formatTimeStamp(
                                    driverLicenseExpirationDate
                                );
                            sqlData += ` driverLicenseExpirationDate = '${driverLicenseExpirationDate}',`;
                        }
                        if (address) {
                            sqlData += ` address = '${address}',`;
                        }
                        if (idWard) {
                            sqlData += ` idWard = '${idWard}',`;
                        }
                        if (idUserStatus) {
                            sqlData += ` idUserStatus = ${idUserStatus},`;
                        }

                        if (sqlData) {
                            sql = `UPDATE user SET ${sqlData} updatedAt = ${currentDate}, idUserUpdate = ${idCurrentUser} WHERE idUser = ${idUser} AND idRole = ${Constants.RoleCode.DRIVER}`;
                        }

                        if (sql) {
                            db.query(sql, async (err, result) => {
                                if (err) {
                                    data.status =
                                        Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                    data.message = Strings.Common.ERROR_SERVER;
                                    res.status(200).send(data);
                                } else {
                                    if (result.changedRows > 0) {
                                        // UPDATE LDAP
                                        let errorLdap = false;
                                        if (code) {
                                            const resultUpdateCNLdap =
                                                await updateCNLdap(
                                                    codeOld,
                                                    code
                                                );
                                            if (!resultUpdateCNLdap) {
                                                errorLdap = true;
                                            }
                                        }
                                        if (pass) {
                                            const resultUpdatePasswordLdap =
                                                await updatePasswordLdap(
                                                    codeOld,
                                                    pass
                                                );
                                            if (!resultUpdatePasswordLdap) {
                                                errorLdap = true;
                                            }
                                        }
                                        if (fullName) {
                                            fullName =
                                                helper.removeVietnameseAccents(
                                                    fullName
                                                );
                                            const resultUpdateSNLdap =
                                                await updateSNLdap(
                                                    codeOld,
                                                    fullName
                                                );
                                            if (!resultUpdateSNLdap) {
                                                errorLdap = true;
                                            }
                                        }

                                        // CHECK ERROR LDAP
                                        if (errorLdap) {
                                            data.status =
                                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                            data.message =
                                                Strings.Common.ERROR_SERVER;
                                            res.status(200).send(data);
                                        } else {
                                            data.status = Constants.ApiCode.OK;
                                            data.message =
                                                Strings.Common.SUCCESS;
                                            res.status(200).send(data);
                                        }
                                    } else {
                                        data.status =
                                            Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                        data.message =
                                            Strings.Common.ERROR_SERVER;
                                        res.status(200).send(data);
                                    }
                                }
                            });
                        } else {
                            data.status = Constants.ApiCode.BAD_REQUEST;
                            data.message = Strings.Common.DATA_IS_UNCHANGED;
                            res.status(200).send(data);
                        }
                    } else {
                        console.log("err else");
                        data.status = Constants.ApiCode.BAD_REQUEST;
                        data.message = Strings.Common.ERROR_GET_DATA;
                        res.status(200).send(data);
                    }
                }
            }
        } else {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.NOT_ENOUGH_DATA;
            res.status(200).send(data);
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const updateCNLdap = async (codeOld, codeNew) => {
    const result = await ldapClient.bind(
        process.env.DN_LDAP_ADMIN,
        process.env.SECRET_LDAP_ADMIN,
        function (err) {
            // error authentication ldap server
            if (err) {
                console.log("err addDriverLdap 1", err);
                return false;
            }
            // get data user => token
            else {
                ldapClient.modifyDN(
                    `cn=${codeOld},${process.env.DN_LDAP_COMMON}`,
                    `cn=${codeNew}`,
                    function (err) {
                        if (err) {
                            console.log("err in update user " + err);
                            return false;
                        } else {
                            console.log("result :");
                            return true;
                        }
                    }
                );
            }
        }
    );

    return result;
};

const updatePasswordLdap = async (code, password) => {
    const result = await ldapClient.bind(
        process.env.DN_LDAP_ADMIN,
        process.env.SECRET_LDAP_ADMIN,
        function (err) {
            // error authentication ldap server
            if (err) {
                console.log("err addDriverLdap 1", err);
                return false;
            }
            // get data user => token
            else {
                var change = new ldap.Change({
                    operation: "replace", // use replace to update the existing attribute
                    modification: {
                        userPassword: password,
                    },
                });

                ldapClient.modify(
                    `cn=${code},${process.env.DN_LDAP_COMMON}`,
                    change,
                    function (err) {
                        if (err) {
                            console.log("err in update user " + err);
                            return false;
                        } else {
                            console.log("add update user");
                            return true;
                        }
                    }
                );
            }
        }
    );

    return result;
};

const updateSNLdap = async (code, fullName) => {
    const result = await ldapClient.bind(
        process.env.DN_LDAP_ADMIN,
        process.env.SECRET_LDAP_ADMIN,
        function (err) {
            // error authentication ldap server
            if (err) {
                console.log("err addDriverLdap 1", err);
                return false;
            }
            // get data user => token
            else {
                var change = new ldap.Change({
                    operation: "replace", // use replace to update the existing attribute
                    modification: {
                        sn: fullName,
                    },
                });

                ldapClient.modify(
                    `cn=${code},${process.env.DN_LDAP_COMMON}`,
                    change,
                    function (err) {
                        if (err) {
                            console.log("err in update user " + err);
                            return false;
                        } else {
                            console.log("add update user");
                            return true;
                        }
                    }
                );
            }
        }
    );

    return result;
};

module.exports = {
    getDriverList,
    getInfoDriver,
    getDriverToUpdate,
    createDriver,
    updateDriver,
};

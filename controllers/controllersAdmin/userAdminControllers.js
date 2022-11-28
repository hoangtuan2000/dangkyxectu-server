const { async } = require("@firebase/util");
const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { ldapClient } = require("../../middlewares/ldap/ldapConfig");
const ldap = require("ldapjs");
const db = require("../../models/index");
require("dotenv").config();

const getUserList = async (req, res) => {
    let {
        page,
        limitEntry,
        userStatus,
        faculty,
        code,
        fullName,
        email,
        phone,
        getAllData,
    } = req.body;

    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;

    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        if ((userStatus && !helper.isArray(userStatus)) || (faculty && !helper.isArray(faculty))) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATA;
            res.status(200).send(data);
        } else {
            let sqlExecuteQuery = `SELECT 
                    COUNT(us.idUser) as sizeQuerySnapshot 
                FROM user as us
                LEFT JOIN user_status as uss ON uss.idUserStatus = us.idUserStatus
                LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                WHERE idRole = ${Constants.RoleCode.USER} `;

            let conditionSql = "";

            if (userStatus && userStatus.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < userStatus.length; i++) {
                    if (!helper.isNullOrEmpty(userStatus[i])) {
                        if (i == 0) {
                            if (userStatus.length > 1) {
                                sqlTemp += ` AND ( uss.idUserStatus = '${userStatus[i]}' `;
                            } else {
                                sqlTemp += ` AND ( uss.idUserStatus = '${userStatus[i]}' ) `;
                            }
                        } else if (i == userStatus.length - 1) {
                            sqlTemp += ` OR uss.idUserStatus = '${userStatus[i]}' ) `;
                        } else {
                            sqlTemp += ` OR uss.idUserStatus = '${userStatus[i]}' `;
                        }
                    }
                }
                conditionSql += sqlTemp;
            }

            if (faculty && faculty.length > 0) {
                let sqlTemp = "";
                for (let i = 0; i < faculty.length; i++) {
                    if (!helper.isNullOrEmpty(faculty[i])) {
                        if (i == 0) {
                            if (faculty.length > 1) {
                                sqlTemp += ` AND ( fa.idFaculty = '${faculty[i]}' `;
                            } else {
                                sqlTemp += ` AND ( fa.idFaculty = '${faculty[i]}' ) `;
                            }
                        } else if (i == faculty.length - 1) {
                            sqlTemp += ` OR fa.idFaculty = '${faculty[i]}' ) `;
                        } else {
                            sqlTemp += ` OR fa.idFaculty = '${faculty[i]}' `;
                        }
                    }
                }
                conditionSql += sqlTemp;
            }

            if (!helper.isNullOrEmpty(code)) {
                conditionSql += ` AND (us.code = '${code}') `;
            }

            if (!helper.isNullOrEmpty(fullName)) {
                conditionSql += ` AND (us.fullName  LIKE '%${fullName}%') `;
            }

            if (!helper.isNullOrEmpty(email)) {
                conditionSql += ` AND (us.email  LIKE '%${email}%') `;
            }

            if (!helper.isNullOrEmpty(phone)) {
                conditionSql += ` AND (us.phone  LIKE '%${phone}%') `;
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
                const sqlTemp = `SELECT 
                                us.idUser, us.fullName, us.code, us.email, us.phone, 
                                fa.idFaculty, fa.name as nameFaculty, 
                                uss.idUserStatus, uss.name as nameUserStatus
                            FROM user as us
                            LEFT JOIN user_status as uss ON uss.idUserStatus = us.idUserStatus
                            LEFT JOIN faculty as fa ON fa.idFaculty = us.idFaculty
                            WHERE idRole = ${Constants.RoleCode.USER} ${conditionSql}
                            ORDER BY fa.idFaculty
                           `;

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

                db.query(sql, (err, result) => {
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

// const getInfoDriver = async (req, res) => {
//     let { idDriver } = req.body;

//     let data = { ...Constants.ResultData };

//     if (req.userToken) {
//         const sql = `SELECT
//             avgRv.averageStar,
//             dr.fullName, dr.code, dr.email, dr.phone,
//             dr.driverLicenseExpirationDate, dr.address,
//             dr.createdAt, dr.updatedAt,
//             userUpdate.idUser as idUserUpdate, userUpdate.fullName as fullNameUserUpdate,
//             userUpdate.code as codeUserUpdate,
//             uss.idUserStatus, uss.name as nameUserStatus,
//             dl.idDriverLicense, dl.name as nameDriverLicense,
//             wa.idWard, wa.name as nameWard, wa.type as typeWard, wa.idDistrict as idDistrictWard,
//             ds.idDistrict, ds.name as nameDistrict, ds.type as typeDistrict, ds.idProvince as idProvinceDistrict,
//             pv.idProvince, pv.name as nameProvince, pv.type as typeProvince
//             FROM user as dr
//             LEFT JOIN user as userUpdate ON userUpdate.idUser = dr.idUserUpdate
//             LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
//             LEFT JOIN driver_license as dl ON dl.idDriverLicense = dr.idDriverLicense
//             LEFT JOIN ward as wa ON wa.idWard = dr.idWard
//             LEFT JOIN district as ds ON ds.idDistrict = wa.idDistrict
//             LEFT JOIN province as pv ON pv.idProvince = ds.idProvince
//             LEFT JOIN
//                 (SELECT sc.*, ROUND(AVG(rv.starNumber)) as averageStar
//                 FROM review as rv
//                 RIGHT JOIN
//                     (SELECT dr.idUser as idDriver, sc.idSchedule
//                     FROM user as dr
//                     LEFT JOIN schedule as sc ON sc.idDriver = dr.idUser
//                     WHERE idRole = ${Constants.RoleCode.DRIVER} AND dr.idUser = ${idDriver}
//                     AND sc.idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE}) as sc
//                 ON sc.idSchedule = rv.idSchedule
//                 GROUP BY sc.idDriver) as avgRv
//                 ON avgRv.idDriver = dr.idUser
//             WHERE dr.idUser = ${idDriver} AND dr.idRole = ${Constants.RoleCode.DRIVER}`;
//         db.query(sql, idDriver, (err, result) => {
//             if (err) {
//                 data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                 data.message = Strings.Common.ERROR;
//                 res.status(200).send(data);
//             } else {
//                 if (result.length > 0) {
//                     data.status = Constants.ApiCode.OK;
//                     data.message = Strings.Common.SUCCESS;
//                     data.data = [...result];
//                     res.status(200).send(data);
//                 } else {
//                     data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                     data.message = Strings.Common.ERROR_GET_DATA;
//                     res.status(200).send(data);
//                 }
//             }
//         });
//     } else {
//         data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//         data.message = Strings.Common.USER_NOT_EXIST;
//         res.status(200).send(data);
//     }
// };

// const getDriverToUpdate = async (req, res) => {
//     let { idDriver } = req.body;

//     let data = { ...Constants.ResultData };

//     if (req.userToken) {
//         const sql = `SELECT
//                         dr.fullName, dr.code, dr.email, dr.phone,
//                         dr.driverLicenseExpirationDate, dr.address,
//                         uss.idUserStatus, uss.name as nameUserStatus,
//                         dl.idDriverLicense, dl.name as nameDriverLicense,
//                         wa.idWard, wa.name as nameWard, wa.type as typeWard, wa.idDistrict as idDistrictWard,
//                         ds.idDistrict, ds.name as nameDistrict, ds.type as typeDistrict, ds.idProvince as idProvinceDistrict,
//                         pv.idProvince, pv.name as nameProvince, pv.type as typeProvince
//                     FROM user as dr
//                     LEFT JOIN user_status as uss ON uss.idUserStatus = dr.idUserStatus
//                     LEFT JOIN driver_license as dl ON dl.idDriverLicense = dr.idDriverLicense
//                     LEFT JOIN ward as wa ON wa.idWard = dr.idWard
//                     LEFT JOIN district as ds ON ds.idDistrict = wa.idDistrict
//                     LEFT JOIN province as pv ON pv.idProvince = ds.idProvince
//                     WHERE dr.idUser = ?`;
//         db.query(sql, idDriver, (err, result) => {
//             if (err) {
//                 data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                 data.message = Strings.Common.ERROR;
//                 res.status(200).send(data);
//             } else {
//                 if (result.length > 0) {
//                     data.status = Constants.ApiCode.OK;
//                     data.message = Strings.Common.SUCCESS;
//                     data.data = [...result];
//                     res.status(200).send(data);
//                 } else {
//                     data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                     data.message = Strings.Common.ERROR_GET_DATA;
//                     res.status(200).send(data);
//                 }
//             }
//         });
//     } else {
//         data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//         data.message = Strings.Common.USER_NOT_EXIST;
//         res.status(200).send(data);
//     }
// };

// // CREATE DRIVER
// const createDriver = async (req, res) => {
//     let {
//         idDriverLicense,
//         fullName,
//         code,
//         email,
//         pass,
//         phone,
//         driverLicenseExpirationDate,
//         address,
//         idWard,
//     } = req.body;
//     let data = { ...Constants.ResultData };

//     if (req.userToken) {
//         if (!idDriverLicense || !driverLicenseExpirationDate) {
//             data.status = Constants.ApiCode.BAD_REQUEST;
//             data.message = Strings.Common.NOT_ENOUGH_DATA;
//             res.status(200).send(data);
//         } else if (!helper.isTimeStamp(driverLicenseExpirationDate)) {
//             data.status = Constants.ApiCode.BAD_REQUEST;
//             data.message = Strings.Common.INVALID_DATA;
//             res.status(200).send(data);
//         } else {
//             const idUser = req.userToken.idUser;
//             let currentDate = helper.formatTimeStamp(new Date().getTime());
//             const sql = `INSERT INTO user(fullName, code, email, phone, address, driverLicenseExpirationDate,
//                     createdAt,  idDriverLicense, idRole, idWard, idUserStatus, idUserUpdate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

//             driverLicenseExpirationDate = helper.formatTimeStamp(
//                 driverLicenseExpirationDate
//             );
//             fullName = helper.removeVietnameseAccents(fullName);
//             db.beginTransaction(function (err) {
//                 if (err) {
//                     data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                     data.message = Strings.Common.ERROR;
//                     res.status(200).send(data);
//                 }
//                 db.query(
//                     sql,
//                     [
//                         fullName,
//                         code,
//                         email,
//                         phone,
//                         address,
//                         driverLicenseExpirationDate,
//                         currentDate,
//                         idDriverLicense,
//                         Constants.RoleCode.DRIVER,
//                         idWard,
//                         Constants.UserStatusCode.WORKING,
//                         idUser,
//                     ],
//                     function (error, results, fields) {
//                         if (error) {
//                             return db.rollback(function () {
//                                 data.status =
//                                     Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                 data.message = Strings.Common.ERROR;
//                                 res.status(200).send(data);
//                             });
//                         } else {
//                             if (results.affectedRows > 0) {
//                                 db.commit(async function (err) {
//                                     if (err) {
//                                         return db.rollback(function () {
//                                             data.status =
//                                                 Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                             data.message = Strings.Common.ERROR;
//                                             res.status(200).send(data);
//                                         });
//                                     } else {
//                                         const resultAddUserLdap =
//                                             await addDriverLdap(
//                                                 fullName,
//                                                 code,
//                                                 pass
//                                             );
//                                         if (resultAddUserLdap) {
//                                             data.status = Constants.ApiCode.OK;
//                                             data.message =
//                                                 Strings.Common.SUCCESS;
//                                             res.status(200).send(data);
//                                         } else {
//                                             return db.rollback(function () {
//                                                 data.status =
//                                                     Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                                 data.message =
//                                                     Strings.Common.ERROR;
//                                                 res.status(200).send(data);
//                                             });
//                                         }
//                                     }
//                                 });
//                             } else {
//                                 data.status =
//                                     Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                 data.message = Strings.Common.ERROR;
//                                 res.status(200).send(data);
//                             }
//                         }
//                     }
//                 );
//             });
//         }
//     } else {
//         data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//         data.message = Strings.Common.USER_NOT_EXIST;
//         res.status(200).send(data);
//     }
// };

// const addDriverLdap = async (fullName, code, password) => {
//     const DN_LDAP_ADMIN = await process.env.DN_LDAP_ADMIN;
//     const SECRET_LDAP_ADMIN = await process.env.SECRET_LDAP_ADMIN;

//     return new Promise((resolve, reject) => {
//         ldapClient.bind(DN_LDAP_ADMIN, SECRET_LDAP_ADMIN, function (err) {
//             // error authentication ldap server
//             if (err) {
//                 console.log("err addDriverLdap 1", err);
//                 return resolve(false);
//             }
//             // get data user => token
//             else {
//                 var entry = {
//                     sn: `${fullName}`,
//                     objectclass: `${process.env.OBJECT_CLASS_LDAP}`,
//                     userPassword: `${password}`,
//                 };
//                 ldapClient.add(
//                     `cn=${code},ou=users,ou=system`,
//                     entry,
//                     function (err) {
//                         if (err) {
//                             console.log("err addDriverLdap 2" + err);
//                             return resolve(false);
//                         } else {
//                             console.log("added user");
//                             return resolve(true);
//                         }
//                     }
//                 );
//             }
//         });
//     });
// };

// //CREATE MULTIPLE DRIVER FROM FILE EXCEL
// const validateDataCreateDriverFunction = async (
//     fullName,
//     code,
//     email,
//     pass,
//     phone,
//     address,
//     idWard,
//     idDriverLicense,
//     driverLicenseExpirationDate
// ) => {
//     let errorData = false;
//     if (
//         helper.isNullOrEmpty(fullName) ||
//         helper.isNullOrEmpty(code) ||
//         helper.isNullOrEmpty(email) ||
//         helper.isNullOrEmpty(pass) ||
//         helper.isNullOrEmpty(phone) ||
//         helper.isNullOrEmpty(address) ||
//         helper.isNullOrEmpty(idWard) ||
//         helper.isNullOrEmpty(idDriverLicense) ||
//         helper.isNullOrEmpty(driverLicenseExpirationDate)
//     ) {
//         return false;
//     } else {
//         // CHECK FULL NAME
//         if (
//             !helper.isValidStringBetweenMinMaxLength(
//                 fullName,
//                 Constants.Common.MIN_LENGTH_FULL_NAME,
//                 Constants.Common.MAX_LENGTH_FULL_NAME
//             )
//         ) {
//             errorData = true;
//         }

//         // CHECK CODE
//         if (
//             !helper.isValidStringBetweenMinMaxLength(
//                 code,
//                 Constants.Common.MIN_LENGTH_CODE,
//                 Constants.Common.MAX_LENGTH_CODE
//             )
//         ) {
//             errorData = true;
//         }

//         // CHECK EMAIL
//         if (!helper.isValidEmail(email)) {
//             errorData = true;
//         }

//         // CHECK PASSWORD
//         if (
//             !helper.isValidStringBetweenMinMaxLength(
//                 pass,
//                 Constants.Common.MIN_LENGTH_PASSWORD,
//                 Constants.Common.MAX_LENGTH_PASSWORD
//             )
//         ) {
//             errorData = true;
//         }

//         // CHECK PHONE
//         if (!helper.isValidPhoneNumber(phone)) {
//             errorData = true;
//         }

//         // CHECK DRIVER LICENSE EXPIRATION DATE
//         if (!helper.isTimeStamp(driverLicenseExpirationDate)) {
//             errorData = true;
//         }

//         // CHECK ERROR
//         if (errorData) {
//             return false;
//         } else {
//             return true;
//         }
//     }
// };

// const createMultipleDriver = async (req, res) => {
//     let { fileData } = req.body;
//     let data = { ...Constants.ResultData };

//     if (req.userToken) {
//         if (helper.isArray(fileData) && fileData.length > 1) {
//             let currentDate = helper.formatTimeStamp(new Date().getTime());
//             const idUser = req.userToken.idUser;
//             const sql = `INSERT INTO user(fullName, code, email, phone, address, driverLicenseExpirationDate,
//                 createdAt,  idDriverLicense, idRole, idWard, idUserStatus, idUserUpdate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

//             let errorCreate = false;
//             let indexCreateError = null;

//             for (let i = 0; i < fileData.length; i++) {
//                 // CALL FUNCTION CHECK DATA
//                 let resultCheckData = await validateDataCreateDriverFunction(
//                     fileData[i].fullName,
//                     fileData[i].code,
//                     fileData[i].email,
//                     fileData[i].pass,
//                     fileData[i].phone,
//                     fileData[i].address,
//                     fileData[i].idWard,
//                     fileData[i].idDriverLicense,
//                     fileData[i].driverLicenseExpirationDate
//                 );
//                 if (resultCheckData) {
//                     // FORMAT DATA
//                     let arr = await [
//                         helper.removeVietnameseAccents(fileData[i].fullName),
//                         fileData[i].code,
//                         fileData[i].email,
//                         fileData[i].phone,
//                         fileData[i].address,
//                         helper.formatTimeStamp(
//                             fileData[i].driverLicenseExpirationDate
//                         ),
//                         currentDate,
//                         fileData[i].idDriverLicense,
//                         Constants.RoleCode.DRIVER,
//                         fileData[i].idWard,
//                         Constants.UserStatusCode.WORKING,
//                         idUser,
//                     ];
//                     // INSERT DATABASE AND LDAP
//                     const resultInsert = await new Promise(
//                         (resolve, reject) => {
//                             db.beginTransaction(function (err) {
//                                 if (err) {
//                                     return resolve(false);
//                                 }
//                                 db.query(
//                                     sql,
//                                     arr,
//                                     function (error, results, fields) {
//                                         if (error) {
//                                             db.rollback(function () {});
//                                             return resolve(false);
//                                         } else {
//                                             if (results.affectedRows > 0) {
//                                                 db.commit(async function (err) {
//                                                     if (err) {
//                                                         db.rollback(
//                                                             function () {}
//                                                         );
//                                                         return resolve(false);
//                                                     } else {
//                                                         const resultAddUserLdap =
//                                                             await addDriverLdap(
//                                                                 helper.removeVietnameseAccents(
//                                                                     fileData[i]
//                                                                         .fullName
//                                                                 ),
//                                                                 fileData[i]
//                                                                     .code,
//                                                                 fileData[i].pass
//                                                             );
//                                                         console.log(
//                                                             "resultAddUserLdap",
//                                                             resultAddUserLdap
//                                                         );
//                                                         if (resultAddUserLdap) {
//                                                             return resolve(
//                                                                 true
//                                                             );
//                                                         } else {
//                                                             await db.rollback(
//                                                                 function () {}
//                                                             );
//                                                             return resolve(
//                                                                 false
//                                                             );
//                                                         }
//                                                     }
//                                                 });
//                                             } else {
//                                                 return resolve(false);
//                                             }
//                                         }
//                                     }
//                                 );
//                             });
//                         }
//                     );
//                     // CHECK ERROR INSERT
//                     if (!resultInsert) {
//                         errorCreate = true;
//                         indexCreateError = i + 1;
//                         break;
//                     }
//                 } else {
//                     errorCreate = true;
//                     indexCreateError = i + 1;
//                     break;
//                 }
//             }

//             // CHECK ERROR CREATE SEND CLIENT
//             if (errorCreate) {
//                 data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                 data.message = `Lỗi Tại Dòng Số: ${indexCreateError}`;
//                 res.status(200).send(data);
//             } else {
//                 data.status = Constants.ApiCode.OK;
//                 data.message = Strings.Common.SUCCESS;
//                 res.status(200).send(data);
//             }
//         } else {
//             data.status = Constants.ApiCode.BAD_REQUEST;
//             data.message = Strings.Common.INVALID_DATA;
//             res.status(200).send(data);
//         }
//     } else {
//         data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//         data.message = Strings.Common.USER_NOT_EXIST;
//         res.status(200).send(data);
//     }
// };

// //UDPATE DRIVER
// const updateDriver = async (req, res) => {
//     let {
//         idUser,
//         idDriverLicense,
//         fullName,
//         code,
//         email,
//         pass,
//         phone,
//         driverLicenseExpirationDate,
//         address,
//         idWard,
//         idUserStatus,
//     } = req.body;
//     let data = { ...Constants.ResultData };

//     if (req.userToken) {
//         if (idUser) {
//             if (
//                 driverLicenseExpirationDate &&
//                 !helper.isTimeStamp(driverLicenseExpirationDate)
//             ) {
//                 data.status = Constants.ApiCode.BAD_REQUEST;
//                 data.message = Strings.Common.INVALID_DATA;
//                 res.status(200).send(data);
//             } else {
//                 const sqlGetCodeOld = `SELECT code as codeOld FROM user WHERE idUser = ?`;
//                 const resExecuteQuery = await executeQuery(
//                     db,
//                     sqlGetCodeOld,
//                     idUser
//                 );
//                 if (!resExecuteQuery) {
//                     console.log("err !resExecuteQuery");
//                     data.status = Constants.ApiCode.BAD_REQUEST;
//                     data.message = Strings.Common.ERROR_GET_DATA;
//                     res.status(200).send(data);
//                 } else {
//                     if (resExecuteQuery.length > 0) {
//                         const idCurrentUser = req.userToken.idUser;
//                         const currentDate = helper.formatTimeStamp(
//                             new Date().getTime()
//                         );
//                         let codeOld = resExecuteQuery[0].codeOld;
//                         // UPDATE DRIVER
//                         let sql = null;
//                         let sqlData = "";
//                         if (idDriverLicense) {
//                             sqlData += ` idDriverLicense = '${idDriverLicense}',`;
//                         }
//                         if (fullName) {
//                             fullName = helper.removeVietnameseAccents(fullName);
//                             sqlData += ` fullName = '${fullName}',`;
//                         }
//                         if (code) {
//                             sqlData += ` code = '${code}',`;
//                         }
//                         if (email) {
//                             sqlData += ` email = '${email}',`;
//                         }
//                         if (phone) {
//                             sqlData += ` phone = '${phone}',`;
//                         }
//                         if (driverLicenseExpirationDate) {
//                             driverLicenseExpirationDate =
//                                 helper.formatTimeStamp(
//                                     driverLicenseExpirationDate
//                                 );
//                             sqlData += ` driverLicenseExpirationDate = '${driverLicenseExpirationDate}',`;
//                         }
//                         if (address) {
//                             sqlData += ` address = '${address}',`;
//                         }
//                         if (idWard) {
//                             sqlData += ` idWard = '${idWard}',`;
//                         }
//                         if (idUserStatus) {
//                             sqlData += ` idUserStatus = ${idUserStatus},`;
//                         }

//                         if (sqlData) {
//                             sql = `UPDATE user SET ${sqlData} updatedAt = ${currentDate}, idUserUpdate = ${idCurrentUser} WHERE idUser = ${idUser} AND idRole = ${Constants.RoleCode.DRIVER}`;
//                         }

//                         if (sql) {
//                             db.query(sql, async (err, result) => {
//                                 if (err) {
//                                     data.status =
//                                         Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                     data.message = Strings.Common.ERROR_SERVER;
//                                     res.status(200).send(data);
//                                 } else {
//                                     if (result.changedRows > 0) {
//                                         // UPDATE LDAP
//                                         let errorLdap = false;
//                                         if (code) {
//                                             const resultUpdateCNLdap =
//                                                 await updateCNLdap(
//                                                     codeOld,
//                                                     code
//                                                 );
//                                             if (!resultUpdateCNLdap) {
//                                                 errorLdap = true;
//                                             }
//                                         }
//                                         if (pass) {
//                                             const resultUpdatePasswordLdap =
//                                                 await updatePasswordLdap(
//                                                     codeOld,
//                                                     pass
//                                                 );
//                                             if (!resultUpdatePasswordLdap) {
//                                                 errorLdap = true;
//                                             }
//                                         }
//                                         if (fullName) {
//                                             fullName =
//                                                 helper.removeVietnameseAccents(
//                                                     fullName
//                                                 );
//                                             const resultUpdateSNLdap =
//                                                 await updateSNLdap(
//                                                     codeOld,
//                                                     fullName
//                                                 );
//                                             if (!resultUpdateSNLdap) {
//                                                 errorLdap = true;
//                                             }
//                                         }

//                                         // CHECK ERROR LDAP
//                                         if (errorLdap) {
//                                             data.status =
//                                                 Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                             data.message =
//                                                 Strings.Common.ERROR_SERVER;
//                                             res.status(200).send(data);
//                                         } else {
//                                             data.status = Constants.ApiCode.OK;
//                                             data.message =
//                                                 Strings.Common.SUCCESS;
//                                             res.status(200).send(data);
//                                         }
//                                     } else {
//                                         data.status =
//                                             Constants.ApiCode.INTERNAL_SERVER_ERROR;
//                                         data.message =
//                                             Strings.Common.ERROR_SERVER;
//                                         res.status(200).send(data);
//                                     }
//                                 }
//                             });
//                         } else {
//                             data.status = Constants.ApiCode.BAD_REQUEST;
//                             data.message = Strings.Common.DATA_IS_UNCHANGED;
//                             res.status(200).send(data);
//                         }
//                     } else {
//                         console.log("err else");
//                         data.status = Constants.ApiCode.BAD_REQUEST;
//                         data.message = Strings.Common.ERROR_GET_DATA;
//                         res.status(200).send(data);
//                     }
//                 }
//             }
//         } else {
//             data.status = Constants.ApiCode.BAD_REQUEST;
//             data.message = Strings.Common.NOT_ENOUGH_DATA;
//             res.status(200).send(data);
//         }
//     } else {
//         data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
//         data.message = Strings.Common.USER_NOT_EXIST;
//         res.status(200).send(data);
//     }
// };

// const updateCNLdap = async (codeOld, codeNew) => {
//     const result = await ldapClient.bind(
//         process.env.DN_LDAP_ADMIN,
//         process.env.SECRET_LDAP_ADMIN,
//         function (err) {
//             // error authentication ldap server
//             if (err) {
//                 console.log("err addDriverLdap 1", err);
//                 return false;
//             }
//             // get data user => token
//             else {
//                 ldapClient.modifyDN(
//                     `cn=${codeOld},${process.env.DN_LDAP_COMMON}`,
//                     `cn=${codeNew}`,
//                     function (err) {
//                         if (err) {
//                             console.log("err in update user " + err);
//                             return false;
//                         } else {
//                             console.log("result :");
//                             return true;
//                         }
//                     }
//                 );
//             }
//         }
//     );

//     return result;
// };

// const updatePasswordLdap = async (code, password) => {
//     const result = await ldapClient.bind(
//         process.env.DN_LDAP_ADMIN,
//         process.env.SECRET_LDAP_ADMIN,
//         function (err) {
//             // error authentication ldap server
//             if (err) {
//                 console.log("err addDriverLdap 1", err);
//                 return false;
//             }
//             // get data user => token
//             else {
//                 var change = new ldap.Change({
//                     operation: "replace", // use replace to update the existing attribute
//                     modification: {
//                         userPassword: password,
//                     },
//                 });

//                 ldapClient.modify(
//                     `cn=${code},${process.env.DN_LDAP_COMMON}`,
//                     change,
//                     function (err) {
//                         if (err) {
//                             console.log("err in update user " + err);
//                             return false;
//                         } else {
//                             console.log("add update user");
//                             return true;
//                         }
//                     }
//                 );
//             }
//         }
//     );

//     return result;
// };

// const updateSNLdap = async (code, fullName) => {
//     const result = await ldapClient.bind(
//         process.env.DN_LDAP_ADMIN,
//         process.env.SECRET_LDAP_ADMIN,
//         function (err) {
//             // error authentication ldap server
//             if (err) {
//                 console.log("err addDriverLdap 1", err);
//                 return false;
//             }
//             // get data user => token
//             else {
//                 var change = new ldap.Change({
//                     operation: "replace", // use replace to update the existing attribute
//                     modification: {
//                         sn: fullName,
//                     },
//                 });

//                 ldapClient.modify(
//                     `cn=${code},${process.env.DN_LDAP_COMMON}`,
//                     change,
//                     function (err) {
//                         if (err) {
//                             console.log("err in update user " + err);
//                             return false;
//                         } else {
//                             console.log("add update user");
//                             return true;
//                         }
//                     }
//                 );
//             }
//         }
//     );

//     return result;
// };

module.exports = {
    getUserList,
    // getInfoDriver,
    // getDriverToUpdate,
    // createDriver,
    // updateDriver,
    // createMultipleDriver,
};

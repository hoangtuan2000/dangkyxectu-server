const db = require("../../models/index");
const ldap = require("ldapjs");
const ldapClient = require("../../middlewares/ldap/ldapConfig");
const jwtConfig = require("../../middlewares/jwt/jwtConfig");
const passport = require("passport");
const passportConfig = require("../../middlewares/passport/passport");
require("dotenv").config();

const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");

const login = async (req, res) => {
    const { code, pass } = req.body;
    let data = { ...Constants.ResultData };
    ldapClient.ldapClient.bind(
        `cn=${code},${process.env.DN_LDAP_COMMON}`,
        pass,
        function (err) {
            // error authentication ldap server
            if (err) {
                // error idUser or pass incorrect
                if (err.name == new ldap.InvalidCredentialsError().name) {
                    data.status = Constants.ApiCode.UNAUTHORIZED;
                    data.message = Strings.Common.ERROR_PASSWORD_USERID;
                    res.status(200).send(data);
                }
                //error not enough attribute
                else if (err.name == new ldap.UnwillingToPerformError().name) {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.NOT_ENOUGH_DATA;
                    res.status(200).send(data);
                }
                //error other
                else {
                    data.status = Constants.ApiCode.SERVICE_UNAVAILABLE;
                    data.message = Strings.Common.SERVICE_UNAVAILABLE;
                    res.status(200).send(data);
                }
            }
            // get data user => token
            else {
                db.query(
                    "SELECT code, phone, fullName, role.name as role FROM user, role WHERE CODE = ? AND user.idRole = role.idRole",
                    [code],
                    (err, result) => {
                        //error select data
                        if (err) {
                            data.status =
                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                            data.message = Strings.Common.ERROR;
                            res.status(200).send(data);
                        } else {
                            if (result.length > 0) {
                                data.status = Constants.ApiCode.OK;
                                data.message = Strings.Common.SUCCESS;
                                data.data = {
                                    access_token: process.env.ACCESS_TOKEN,
                                    token: jwtConfig.signToken(result[0].code),
                                    fullName: result[0].fullName,
                                    code: result[0].code,
                                    phone: result[0].phone,
                                    role: result[0].role,
                                };
                                res.status(200).send(data);
                            }
                            // error result data user empty
                            else {
                                data.status =
                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                data.message = Strings.Common.ERROR_GET_DATA;
                                res.status(200).send(data);
                            }
                        }
                    }
                );
            }
        }
    );
};

const authentication = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    passport.authenticate("jwt", function (err, user, info) {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else if (info && info.name == "TokenExpiredError") {
            data.status = Constants.ApiCode.UNAUTHORIZED;
            data.message = Strings.Common.YOUR_LOGIN_SESSION_EXPIRED;
            res.status(200).send(data);
        } else if (info && info.name == "JsonWebTokenError") {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.UNAUTHENTICATED;
            res.status(200).send(data);
        } else if (!user) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.USER_NOT_EXIST;
            res.status(200).send(data);
        } else {
            data.status = Constants.ApiCode.OK;
            data.message = Strings.Common.SUCCESS;
            res.status(200).send(data);
        }
    })(req, res, next);
};

const getUserToken = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    passport.authenticate("jwt", function (err, user, info) {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else if (info && info.name == "TokenExpiredError") {
            data.status = Constants.ApiCode.UNAUTHORIZED;
            data.message = Strings.Common.YOUR_LOGIN_SESSION_EXPIRED;
            res.status(200).send(data);
        } else if (info && info.name == "JsonWebTokenError") {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.UNAUTHENTICATED;
            res.status(200).send(data);
        } else if (!user) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.USER_NOT_EXIST;
            res.status(200).send(data);
        } else {
            const userID = user.sub;
            const sql = "SELECT idUser, email FROM user WHERE code = ?";
            db.query(sql, [userID], (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.length > 0) {
                        req.userToken = result[0];
                        next();
                    } else {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    }
                }
            });
        }
    })(req, res, next);
};

const authenticationAdmin = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    passport.authenticate("jwt", function (err, user, info) {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else if (info && info.name == "TokenExpiredError") {
            data.status = Constants.ApiCode.UNAUTHORIZED;
            data.message = Strings.Common.YOUR_LOGIN_SESSION_EXPIRED;
            res.status(200).send(data);
        } else if (info && info.name == "JsonWebTokenError") {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.UNAUTHENTICATED;
            res.status(200).send(data);
        } else if (!user) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.USER_NOT_EXIST;
            res.status(200).send(data);
        } else {
            const userID = user.sub;
            const sql = `SELECT idUser FROM user WHERE code = ? AND idRole IN (${Constants.RoleCode.ADMIN}, ${Constants.RoleCode.ADMIN_SYSTEM})`;
            db.query(sql, [userID], (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.length > 0) {
                        req.userToken = result[0];
                        next();
                    } else {
                        data.status = Constants.ApiCode.FORBIDDEN;
                        data.message = Strings.Common.NOT_PERMISSION_ACCESS;
                        res.status(200).send(data);
                    }
                }
            });
        }
    })(req, res, next);
};

const authenticationAdminSystem = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    passport.authenticate("jwt", function (err, user, info) {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else if (info && info.name == "TokenExpiredError") {
            data.status = Constants.ApiCode.UNAUTHORIZED;
            data.message = Strings.Common.YOUR_LOGIN_SESSION_EXPIRED;
            res.status(200).send(data);
        } else if (info && info.name == "JsonWebTokenError") {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.UNAUTHENTICATED;
            res.status(200).send(data);
        } else if (!user) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.USER_NOT_EXIST;
            res.status(200).send(data);
        } else {
            const userID = user.sub;
            const sql = `SELECT idUser FROM user WHERE code = ? AND idRole = ${Constants.RoleCode.ADMIN_SYSTEM}`;
            db.query(sql, [userID], (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.length > 0) {
                        req.userToken = result[0];
                        next();
                    } else {
                        data.status = Constants.ApiCode.FORBIDDEN;
                        data.message = Strings.Common.NOT_PERMISSION_ACCESS;
                        res.status(200).send(data);
                    }
                }
            });
        }
    })(req, res, next);
};

const authenticationDriver = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    passport.authenticate("jwt", function (err, user, info) {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else if (info && info.name == "TokenExpiredError") {
            data.status = Constants.ApiCode.UNAUTHORIZED;
            data.message = Strings.Common.YOUR_LOGIN_SESSION_EXPIRED;
            res.status(200).send(data);
        } else if (info && info.name == "JsonWebTokenError") {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.UNAUTHENTICATED;
            res.status(200).send(data);
        } else if (!user) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.USER_NOT_EXIST;
            res.status(200).send(data);
        } else {
            const userID = user.sub;
            const sql = `SELECT idUser FROM user WHERE code = ? AND idRole = ${Constants.RoleCode.DRIVER}`;
            db.query(sql, [userID], (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.length > 0) {
                        req.userToken = result[0];
                        next();
                    } else {
                        data.status = Constants.ApiCode.FORBIDDEN;
                        data.message = Strings.Common.NOT_PERMISSION_ACCESS;
                        res.status(200).send(data);
                    }
                }
            });
        }
    })(req, res, next);
};

const authenticationUser = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    passport.authenticate("jwt", function (err, user, info) {
        if (err) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR;
            res.status(200).send(data);
        } else if (info && info.name == "TokenExpiredError") {
            data.status = Constants.ApiCode.UNAUTHORIZED;
            data.message = Strings.Common.YOUR_LOGIN_SESSION_EXPIRED;
            res.status(200).send(data);
        } else if (info && info.name == "JsonWebTokenError") {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.UNAUTHENTICATED;
            res.status(200).send(data);
        } else if (!user) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.USER_NOT_EXIST;
            res.status(200).send(data);
        } else {
            const userID = user.sub;
            const sql = `SELECT idUser FROM user WHERE code = ? AND idRole = ${Constants.RoleCode.USER}`;
            db.query(sql, [userID], (err, result) => {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                } else {
                    if (result.length > 0) {
                        req.userToken = result[0];
                        next();
                    } else {
                        data.status = Constants.ApiCode.FORBIDDEN;
                        data.message = Strings.Common.NOT_PERMISSION_ACCESS;
                        res.status(200).send(data);
                    }
                }
            });
        }
    })(req, res, next);
};

module.exports = {
    login,
    authentication,
    getUserToken,
    authenticationAdmin,
    authenticationAdminSystem,
    authenticationDriver,
    authenticationUser,
};

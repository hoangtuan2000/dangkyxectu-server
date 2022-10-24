const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");

const checkCodeUserExist = async (req, res, next) => {
    let { code } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT * FROM user WHERE code = ?`;
        db.query(sql, code, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.CODE_USER_ALREADY_EXISTS;
                    res.status(200).send(data);
                } else {
                    next();
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const checkEmailUserExist = async (req, res, next) => {
    let { email } = req.body;
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT * FROM user WHERE email = ?`;
        db.query(sql, email, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.EMAIL_USER_ALREADY_EXISTS;
                    res.status(200).send(data);
                } else {
                    next();
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const validateDataCreateUser = async (req, res, next) => {
    let { fullName, code, email, pass, phone, address, idWard } = req.body;
    let data = { ...Constants.ResultData };

    let errorData = false;
    let message = null;

    if (
        helper.isNullOrEmpty(fullName) ||
        helper.isNullOrEmpty(code) ||
        helper.isNullOrEmpty(email) ||
        helper.isNullOrEmpty(pass) ||
        helper.isNullOrEmpty(phone) ||
        helper.isNullOrEmpty(address) ||
        helper.isNullOrEmpty(idWard)
    ) {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    } else {
        // CHECK FULL NAME
        if (
            !helper.isValidStringBetweenMinMaxLength(
                fullName,
                Constants.Common.MIN_LENGTH_FULL_NAME,
                Constants.Common.MAX_LENGTH_FULL_NAME
            )
        ) {
            errorData = true;
            message = Strings.Common.SUPPORT_FULL_NAME;
        }

        // CHECK CODE
        if (
            !helper.isValidStringBetweenMinMaxLength(
                code,
                Constants.Common.MIN_LENGTH_CODE,
                Constants.Common.MAX_LENGTH_CODE
            )
        ) {
            errorData = true;
            message = Strings.Common.SUPPORT_CODE;
        }

        // CHECK EMAIL
        if (!helper.isValidEmail(email)) {
            errorData = true;
            message = Strings.Common.SUPPORT_EMAIL;
        }

        // CHECK PASSWORD
        if (
            !helper.isValidStringBetweenMinMaxLength(
                pass,
                Constants.Common.MIN_LENGTH_PASSWORD,
                Constants.Common.MAX_LENGTH_PASSWORD
            )
        ) {
            errorData = true;
            message = Strings.Common.SUPPORT_PASSWORD;
        }

        // CHECK PHONE
        if (!helper.isValidPhoneNumber(phone)) {
            errorData = true;
            message = Strings.Common.SUPPORT_PHONE;
        }

        // CHECK ERROR
        if (errorData) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = message;
            res.status(200).send(data);
        } else {
            next();
        }
    }
};

module.exports = {
    checkCodeUserExist,
    checkEmailUserExist,
    validateDataCreateUser,
};

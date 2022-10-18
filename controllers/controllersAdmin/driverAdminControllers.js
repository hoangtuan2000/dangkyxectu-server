const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getDriverList = async (req, res) => {
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT idUser as idDriver, fullName as fullNameDriver, code as codeDriver FROM user WHERE idRole = ${Constants.RoleCode.DRIVER}`;
        db.query(sql, (err, result) => {
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
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

module.exports = {
    getDriverList,
};

const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");

const getCommon = async (req, res) => {
    const { common } = req.body;
    let data = { ...Constants.ResultData };
    db.query(`SELECT * FROM ${common} WHERE 1`, (err, result) => {
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

module.exports = {
    getCommon,
};

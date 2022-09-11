const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { executeQuery } = require("../../function");

const getCommon = async (req, res) => {
    const { group } = req.body;

    let data = { ...Constants.ResultData };

    if (group) {
        const arrNameTables = group.split(",") || group;

        for (let i = 0; i < arrNameTables.length; i++) {
            const nameTable = arrNameTables[i].replace(/\s+|\s+/gm, ""); //remove space
            const result = await executeQuery(db, `select * from ${nameTable}`);
            if (!result) {
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.ERROR_GET_DATA;
                data.data = [];
                break;
            } else {
                const tempObject = {};
                tempObject[`${nameTable}`] = [...result];
                data.data = { ...data.data, ...tempObject };
                data.status = Constants.ApiCode.OK;
                data.message = Strings.Common.SUCCESS;
            }
        }
        res.status(200).send(data);
    } else {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    }
};

module.exports = {
    getCommon,
};

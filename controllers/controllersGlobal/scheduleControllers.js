const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");

const getScheduleList = async (req, res) => {
    const { idCar } = req.body;
    let data = { ...Constants.ResultData };
    let sql = `SELECT * FROM schedule WHERE idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDay)`;
    if (idCar) {
        sql = `SELECT * FROM schedule WHERE idCar = ${idCar} AND idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDay)`;
    }
    db.query(sql, (err, result) => {
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
    getScheduleList,
};

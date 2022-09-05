const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");

const getCarList = async (req, res) => {
    let data = { ...Constants.ResultData };
    db.query(
        `SELECT 
            car.idCar, car.licensePlates, car.image, 
            car.idCarStatus, car.idCarType, sc3.idSchedule, 
            sc3.startDay, sc3.endDay, sc3.reason 
        FROM car 
        LEFT JOIN 
            (SELECT * 
            FROM schedule as sc2
            WHERE 
                FROM_UNIXTIME(sc2.startDay) = 
                (SELECT MAX(FROM_UNIXTIME(sc1.startDay)) as maxDate 
                FROM schedule as sc1
                WHERE sc1.idScheduleStatus = 2
                GROUP BY sc1.idCar)
            ) as sc3 
        ON car.idCar = sc3.idCar WHERE car.idCarStatus = 1`,
        (err, result) => {
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
        }
    );
};

module.exports = {
    getCarList,
};

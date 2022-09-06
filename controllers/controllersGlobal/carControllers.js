const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");

const getCar = async (req, res) => {
    const { idCar } = req.body;
    let data = { ...Constants.ResultData };
    // const sql = `SELECT 
    //                 c.idCar, c.licensePlates, c.image,
    //                 cs.name as status, ct.name as type, ct.seatNumber, 
    //                 cc.name as color, cb.name as brand
    //             FROM 
    //                 car as c, car_type as ct, car_status as cs,
    //                 car_color as cc, car_brand as cb
    //             WHERE 
    //                 c.idCar = ?
    //                 AND c.idCarStatus = cs.idCarStatus 
    //                 AND c.idCarType = ct.idCarType
    //                 AND c.idCarColor = cc.idCarColor
    //                 AND c.idCarBrand = cb.idCarBrand`;

    const sql = `SELECT * FROM car WHERE idCar = ?`
    db.query(sql, [idCar], (err, result) => {
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
        ON car.idCar = sc3.idCar WHERE car.idCarStatus = 1 ORDER BY sc3.idSchedule`,
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
    getCar,
};

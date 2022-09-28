const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getCarListForAdmin = async (req, res) => {
    let { page, limitEntry } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        const idUser = req.userToken.idUser;
        let sqlExecuteQuery = `SELECT COUNT(idCar) as sizeQuerySnapshot FROM car `;

        // EXECUTE SQL
        const resultExecuteQuery = await executeQuery(db, sqlExecuteQuery);

        if (!resultExecuteQuery) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_GET_DATA;
            res.status(200).send(data);
        } else {
            const sql = `SELECT 
                            ca.idCar, ca.licensePlates, ca.image,
                            IFNULL(carSchedule.numberOfTrips, 0) as numberOfTrips,
                            IFNULL(licenseExpired.licenseNumberExpired , 0) as licenseNumberExpired,
                            cbd.numberOfFailures,
                            cb.idCarBrand, cb.name as nameCarBrand,
                            ct.idCarType, ct.name as nameCarType, ct.seatNumber,
                            cs.idCarStatus, cs.name as nameCarStatus
                        FROM car as ca
                        LEFT JOIN car_brand as cb ON cb.idCarBrand = ca.idCarBrand
                        LEFT JOIN car_type as ct ON ct.idCarType = ca.idCarType
                        LEFT JOIN car_status as cs ON cs.idCarStatus = ca.idCarStatus
                        LEFT JOIN 
                            (SELECT COUNT(schedule.idCar) as numberOfTrips, car.idCar
                            FROM car 
                            RIGHT JOIN schedule ON car.idCar = schedule.idCar
                            GROUP BY schedule.idCar) as carSchedule ON carSchedule.idCar = ca.idCar
                        LEFT JOIN 
                            (SELECT COUNT(idCar) as numberOfFailures, idCar
                            FROM car_breakdown
                            GROUP BY idCar) as cbd ON cbd.idCar = ca.idCar
                        LEFT JOIN
                            (SELECT COUNT(cld.idCar) as licenseNumberExpired, cld.idCar
                            FROM car as ca
                            RIGHT JOIN car_license_detail as cld 
                            ON ca.idCar = cld.idCar 
                            AND DATE(FROM_UNIXTIME(cld.carLicenseExpirationDate)) <= CURRENT_DATE()
                            GROUP BY cld.idCar) as licenseExpired ON licenseExpired.idCar = ca.idCar        
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
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

module.exports = {
    getCarListForAdmin,
};

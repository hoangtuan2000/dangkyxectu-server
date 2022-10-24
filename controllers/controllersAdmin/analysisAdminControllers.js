const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getAnalysisTotalCommon = async (req, res) => {
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        let sql = "";
        let sqlTotalCar = `SELECT COUNT(idCar) as totalCar FROM car;`;
        let sqlTotalDriver = `SELECT COUNT(idUser) as totalDriver FROM user WHERE idRole = ${Constants.RoleCode.DRIVER};`;
        let sqlTotalScheduleComplete = `SELECT COUNT(idSchedule) as totalScheduleComplete 
                FROM schedule WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.COMPLETE};`;
        let sqlTotalSchedulePending = `SELECT COUNT(idSchedule) as totalSchedulePending 
                FROM schedule WHERE idScheduleStatus = ${Constants.ScheduleStatusCode.PENDING} 
                AND DATE(FROM_UNIXTIME(startDate)) > CURRENT_DATE();`;
        let sqlTotalLicenseCarExpires = `SELECT COUNT(idCar) as totalLicenseCarExpires
                FROM car_license_detail 
                WHERE DATE(FROM_UNIXTIME(carLicenseExpirationDate)) <= CURRENT_DATE() AND noExpireDate = 0;`;
        sql +=
            sqlTotalCar +
            sqlTotalDriver +
            sqlTotalScheduleComplete +
            sqlTotalSchedulePending +
            sqlTotalLicenseCarExpires;
        db.query(sql, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                    data.data = {
                        totalCar: result[0][0].totalCar,
                        totalDriver: result[1][0].totalDriver,
                        totalScheduleComplete:
                            result[2][0].totalScheduleComplete,
                        totalSchedulePending: result[3][0].totalSchedulePending,
                        totalLicenseCarExpires:
                            result[4][0].totalLicenseCarExpires,
                    };
                    res.status(200).send(data);
                } else {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR_GET_DATA;
                    res.status(200).send(data);
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

const getTotalNumberOfTripsOverTime = async (req, res) => {
    let data = { ...Constants.ResultData };

    if (req.userToken) {
        const sql = `SELECT COUNT(sc.idSchedule) as totalSchedule, UNIX_TIMESTAMP(dateRange.date) as date
            FROM 
                (SELECT * FROM schedule 
                WHERE idScheduleStatus IN (${Constants.ScheduleStatusCode.MOVING}, 
                    ${Constants.ScheduleStatusCode.COMPLETE}, ${Constants.ScheduleStatusCode.RECEIVED})) as sc
            RIGHT JOIN (SELECT CURRENT_DATE() - INTERVAL seq DAY as date FROM seq_0_to_7) as dateRange
            ON DATE(FROM_UNIXTIME(sc.startDate)) = dateRange.date
            GROUP BY dateRange.date`;
        db.query(sql, (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.OK;
                    data.message = Strings.Common.SUCCESS;
                    data.data = [...result];
                    res.status(200).send(data);
                } else {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR_GET_DATA;
                    res.status(200).send(data);
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

module.exports = {
    getAnalysisTotalCommon,
    getTotalNumberOfTripsOverTime,
};

const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getDriverScheduleList = async (req, res) => {
    let { page, limitEntry } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        const idUser = req.userToken.idUser;
        const resultExecuteQuery = await executeQuery(
            db,
            `SELECT COUNT(idSchedule) as sizeQuerySnapshot FROM schedule WHERE idDriver = ${idUser} AND idScheduleStatus != 1 `
        );
        if (!resultExecuteQuery) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_GET_DATA;
            res.status(200).send(data);
        } else {
            if (resultExecuteQuery.length > 0) {
                let sql = `SELECT
                                sc.idSchedule, sc.reason, sc.startDate, sc.endDate, sc.endLocation, sc.startLocation,
                                ca.idCar, ca.image, ca.licensePlates, ca.idCarType,
                                ct.name as carType, ct.seatNumber,
                                ss.name as scheduleStatus,
                                ws.name as wardStart, ds.name as districtStart, ps.name as provinceStart,
                                we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN car_type as ct ON ca.idCarType = ct.idCarType
                            LEFT JOIN schedule_status as ss ON ss.idScheduleStatus = sc.idScheduleStatus
                            LEFT JOIN ward as ws ON ws.idWard = sc.idWardEndLocation
                            LEFT JOIN district as ds ON ds.idDistrict = ws.idDistrict
                            LEFT JOIN province as ps ON ps.idProvince = ds.idProvince
                            LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                            LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                            LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                            WHERE sc.idDriver = ? AND sc.idScheduleStatus != 1
                            ORDER BY FROM_UNIXTIME(sc.startDate) DESC
                            LIMIT ${
                                limitEntry * page - limitEntry
                            }, ${limitEntry}`;
                db.query(sql, [idUser], (err, result) => {
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
            } else {
                dataList.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                dataList.message = Strings.Common.ERROR_GET_DATA;
                dataList.limitEntry = limitEntry;
                dataList.page = page;
                dataList.sizeQuerySnapshot =
                    resultExecuteQuery[0].sizeQuerySnapshot;
                res.status(200).send(dataList);
            }
        }
    } else {
        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
        data.message = Strings.Common.USER_NOT_EXIST;
        res.status(200).send(data);
    }
};

module.exports = {
    getDriverScheduleList
};

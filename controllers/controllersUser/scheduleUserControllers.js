const { executeQuery } = require("../../common/function");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");

const getUserRegisteredScheduleList = async (req, res) => {
    let { page, limitEntry } = req.body;
    page = parseInt(page) || Constants.Common.PAGE;
    limitEntry = parseInt(limitEntry) || Constants.Common.LIMIT_ENTRY;
    let data = { ...Constants.ResultData };
    let dataList = { ...Constants.ResultDataList };

    if (req.userToken) {
        const idUser = req.userToken.idUser;
        const resultExecuteQuery = await executeQuery(
            db,
            `SELECT COUNT(idSchedule) as sizeQuerySnapshot FROM schedule WHERE idUser = ${idUser}`
        );
        if (!resultExecuteQuery) {
            data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
            data.message = Strings.Common.ERROR_GET_DATA;
            res.status(200).send(data);
        } else {
            if (resultExecuteQuery.length > 0) {
                let sql = `SELECT
                                sc.idSchedule, sc.reason, sc.startDate, sc.endDate, sc.endLocation,
                                ca.idCar, ca.image, ca.licensePlates, ca.idCarType,
                                we.name as wardEnd, de.name as districtEnd, pe.name as provinceEnd
                            FROM schedule as sc
                            LEFT JOIN car as ca ON ca.idCar = sc.idCar
                            LEFT JOIN ward as we ON we.idWard = sc.idWardEndLocation
                            LEFT JOIN district as de ON de.idDistrict = we.idDistrict
                            LEFT JOIN province as pe ON pe.idProvince = de.idProvince
                            WHERE sc.idUser = ?
                            ORDER BY sc.idScheduleStatus
                            LIMIT ${limitEntry * page - limitEntry}, ${limitEntry}`;
                db.query(sql, [idUser], (err, result) => {
                    if (err) {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR;
                        res.status(200).send(data);
                    } else {
                        dataList.status = Constants.ApiCode.OK;
                        dataList.message = Strings.Common.SUCCESS;
                        dataList.limitEntry = limitEntry
                        dataList.page = page
                        dataList.sizeQuerySnapshot = resultExecuteQuery[0].sizeQuerySnapshot
                        dataList.data = [...result]
                        res.status(200).send(dataList);
                    }
                });
            } else {
                dataList.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                dataList.message = Strings.Common.ERROR_GET_DATA;
                dataList.limitEntry = limitEntry
                dataList.page = page
                dataList.sizeQuerySnapshot = resultExecuteQuery[0].sizeQuerySnapshot
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
    getUserRegisteredScheduleList,
};

const db = require("../../models/index");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const { helper } = require("../../common/helper");
const { sendMail } = require("../../middlewares/nodeMailer/nodeMailer");

const getScheduleList = async (req, res) => {
    const { idCar } = req.body;
    let data = { ...Constants.ResultData };
    let sql = `SELECT * FROM schedule WHERE idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDate)`;
    if (idCar) {
        sql = `SELECT * FROM schedule WHERE idCar = ${idCar} AND idScheduleStatus = 2 ORDER BY FROM_UNIXTIME(startDate)`;
    }
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
};

const checkScheduleDuplication = async (req, res, next) => {
    const { startDate, endDate } = req.body;
    let data = { ...Constants.ResultData };
    if (!helper.isNullOrEmpty(startDate) && !helper.isNullOrEmpty(endDate)) {
        const startTimeStamp = helper.formatTimeStamp(startDate);
        const endTimeStamp = helper.formatTimeStamp(endDate);
        const sql = `SELECT 
                        idSchedule, startDate, endDate, idScheduleStatus,
                        DATE(FROM_UNIXTIME(startDate)) as dateStart, 
                        DATE(FROM_UNIXTIME(endDate)) as dateEnd,
                        DATE(FROM_UNIXTIME(${startTimeStamp})) as StartSend,
                        DATE(FROM_UNIXTIME(${endTimeStamp})) as EndSend
                    FROM schedule 
                    WHERE 
                        idScheduleStatus = 2 AND (( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR ( DATE(FROM_UNIXTIME(?)) BETWEEN DATE(FROM_UNIXTIME(startDate)) AND DATE(FROM_UNIXTIME(endDate))) 
                        OR (DATE(FROM_UNIXTIME(startDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))) 
                        OR (DATE(FROM_UNIXTIME(endDate)) BETWEEN DATE(FROM_UNIXTIME(${startTimeStamp})) AND DATE(FROM_UNIXTIME(${endTimeStamp}))))`;
        db.query(sql, [startDate, endDate], (err, result) => {
            if (err) {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR;
                res.status(200).send(data);
            } else {
                if (result.length > 0) {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.DUPLICATE_SCHEDULE;
                    res.status(200).send(data);
                } else {
                    next();
                }
            }
        });
    } else {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    }
};

const createSchedule = async (req, res) => {
    const {
        startDate,
        endDate,
        startLocation,
        endLocation,
        reason,
        note,
        idCar,
        idWardStartLocation,
        idWardEndLocation,
    } = req.body;
    let data = { ...Constants.ResultData };

    if (
        req.userToken &&
        !helper.isNullOrEmpty(startDate) &&
        !helper.isNullOrEmpty(endDate) &&
        !helper.isNullOrEmpty(startLocation) &&
        !helper.isNullOrEmpty(endLocation) &&
        !helper.isNullOrEmpty(reason) &&
        !helper.isNullOrEmpty(idCar) &&
        !helper.isNullOrEmpty(idWardStartLocation) &&
        !helper.isNullOrEmpty(idWardEndLocation)
    ) {
        const startTimeStamp = helper.formatTimeStamp(startDate);
        const endTimeStamp = helper.formatTimeStamp(endDate);

        if (helper.compareBiggerDateTimeStamp(startTimeStamp, endTimeStamp)) {
            const idUser = req.userToken.idUser;
            const email = req.userToken.email;
            const sql = `INSERT INTO schedule
                        (startDate, endDate, startLocation, endLocation, reason, note, createdAt, 
                         idUser, idWardStartLocation, idWardEndLocation, idCar, idScheduleStatus) 
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

            const createdAt = helper.formatTimeStamp(new Date().getTime());

            db.beginTransaction(function (err) {
                if (err) {
                    data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                    data.message = Strings.Common.ERROR;
                    res.status(200).send(data);
                }
                db.query(
                    sql,
                    [
                        startTimeStamp,
                        endTimeStamp,
                        startLocation,
                        endLocation,
                        reason,
                        note,
                        createdAt,
                        idUser,
                        idWardStartLocation,
                        idWardEndLocation,
                        idCar,
                        1,
                    ],
                    function (error, results, fields) {
                        if (error) {
                            return db.rollback(function () {
                                data.status =
                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                data.message = Strings.Common.ERROR;
                                res.status(200).send(data);
                            });
                        } else {
                            if (results.affectedRows > 0) {
                                db.commit(function (err) {
                                    if (err) {
                                        return db.rollback(function () {
                                            data.status =
                                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                            data.message = Strings.Common.ERROR;
                                            res.status(200).send(data);
                                        });
                                    } else {
                                        data.status = Constants.ApiCode.OK;
                                        data.message = Strings.Common.SUCCESS;
                                        res.status(200).send(data);
                                    }
                                });
                            } else {
                                data.status =
                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                data.message = Strings.Common.ERROR;
                                res.status(200).send(data);
                            }
                        }
                    }
                );
            });
        } else {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.INVALID_DATE;
            res.status(200).send(data);
        }
    } else {
        data.status = Constants.ApiCode.BAD_REQUEST;
        data.message = Strings.Common.NOT_ENOUGH_DATA;
        res.status(200).send(data);
    }
};

const sendEmail = (req, res) => {
    const { email } = req.body;
    const html = `<!DOCTYPE html>
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8" />
                            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                            <title>Document</title>
                    
                            <style>
                                .container {
                                    display: flex;
                                    justify-content: center;
                                    padding: 10px;
                                }
                                .wapper {
                                    border: 1px solid gray;
                                    border-radius: 10px;
                                    width: fit-content;
                                    text-align: center;
                                    padding: 10px;
                                }
                                .imageAvatar {
                                    max-width: 500px;
                                    object-fit: cover;
                                    border-radius: 10px;
                                }
                                .divContent {
                                    text-align: left;
                                    font-size: 14px;
                                }
                                .textHeader {
                                    font-size: 16px;
                                    font-weight: bold;
                                    color: blue;
                                }
                                .textContent {
                                    font-style: italic;
                                    text-decoration: underline;
                                }
                                .textDate {
                                    font-size: 16px;
                                    font-weight: bold;
                                }
                                .textStatusSchedule {
                                    font-size: 17px;
                                    font-weight: bold;
                                    color: green;
                                }
                                .buttonShowDetail {
                                    background-color: #3b8cff;
                                    padding: 5px;
                                    border-radius: 4px;
                                    border-width: 0px;
                                }
                                .textLink {
                                    color: white;
                                    text-decoration: none;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="wapper">
                                    <img
                                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_2t7Pp8BRna5qfuUGHcR5zAbCtvhacY6tYw&usqp=CAU"
                                        alt="image-car"
                                        class="imageAvatar"
                                    />
                                    <div class="divContent">
                                        <p class="textHeader">Xe 35 Chổ</p>
                                        <p>
                                            <span class="textContent">Biển Số:</span>
                                            65A-12345
                                        </p>
                                        <p>
                                            <span class="textContent">Trạng Thái Lịch Trình:</span>
                                            <span class="textStatusSchedule">Chờ Xác Nhận</span>
                                        </p>
                                        <p>
                                            <span class="textContent">Thời Gian:</span>
                                            <span class="textDate">20/09/2022 - 21/09/2022</span>
                                        </p>
                                        <p>
                                            <span class="textContent">Vị trí bắt đầu:</span>
                                            Đường 3/2 Khu II Đại Học Cần Thơ - Phường An Khánh -
                                            Quận Ninh Kiều - TP.Cần Thơ
                                        </p>
                                        <p>
                                            <span class="textContent">Vị trí kết thúc:</span>
                                            Khu Hòa An Đại Học Cần Thơ - Phường An Khánh - Thị Xã
                                            Ngã Bảy - TP.Hậu Giang
                                        </p>
                                        <p style="margin-bottom: 5px">
                                            <span class="textContent"
                                                >Thông Tin Người Đăng Ký Xe:</span
                                            >
                                        </p>
                                        <ul style="list-style-type: circle; margin-top: 0px">
                                            <li>Họ Tên: Nguyễn Trung Kiên</li>
                                            <li>Số Điện Thoại: 0123456789</li>
                                        </ul>
                                        <p style="margin-bottom: 5px">
                                            <span class="textContent">Thông Tin Tài Xế:</span>
                                        </p>
                                        <ul style="list-style-type: circle; margin-top: 0px">
                                            <li>Họ Tên: Nguyễn Văn Anh</li>
                                            <li>Số Điện Thoại: 0231546879</li>
                                        </ul>
                                    </div>
                                    <button class="buttonShowDetail">
                                        <a href="" class="textLink"> Xem Thông Tin Chi Tiết </a>
                                    </button>
                                </div>
                            </div>
                        </body>
                    </html>`;
    sendMail(email, null, null, html);
    res.send("ok");
};

module.exports = {
    getScheduleList,
    createSchedule,
    checkScheduleDuplication,
    sendEmail,
};

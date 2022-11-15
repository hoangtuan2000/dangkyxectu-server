const { Constants } = require("../constants/Constants");
const { sendMail } = require("../middlewares/nodeMailer/nodeMailer");

const executeQuery = async (connect, query, params) => {
    return new Promise((resolve, reject) => {
        connect.query(query, params, (err, result) => {
            if (err) {
                return resolve(false);
            }

            return resolve(result);
        });
    });
};

const sendEmailCreateOrUpdateSchedule = (
    email,
    subject,
    text,
    srcImageCar,
    title,
    colorTitle,
    typeCar,
    seatNumber,
    licensePlates,
    scheduleStatus,
    titleReasonCancel,
    reasonCancel,
    colorScheduleStatus,
    dateRange,
    reason,
    note,
    startLocation,
    endLocation,
    fullNameUser,
    phoneUser,
    fullNameDriver,
    phoneDriver,
    createdAt,
    updatedAt,
    linkScheduleWeb,
    linkScheduleApp
) => {
    const infoDriver =
        fullNameDriver && phoneDriver
            ? `<ul style="list-style-type: circle; margin-top: 0px">
                    <li>Họ Tên: ${fullNameDriver}</li>
                    <li>Số Điện Thoại: ${phoneDriver}</li>
                </ul>`
            : `<ul style="list-style-type: circle; margin-top: 0px">
                    <li>Họ Tên: Đang Cập Nhật</li>
                    <li>Số Điện Thoại: Đang Cập Nhật</li>
                </ul>`;

    const existUpdatedAt = updatedAt
        ? `<p>
                <span class="textContent">Ngày Cập Nhật:</span>
                <span>${updatedAt}</span>
            </p>`
        : `<span></span>`;

    const reasonCancelSchedule = reasonCancel
        ? `<p>
        <span class="textContent">${titleReasonCancel}:</span>
        <span class="textReasonCancel">${reasonCancel}</span>
    </p>`
        : `<span></span>`;

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
                                .textTitle {
                                    font-size: 16px;
                                    font-weight: bold;
                                    color: ${
                                        colorTitle
                                            ? colorTitle
                                            : Constants.Styles.COLOR_PRIMARY
                                    }
                                }
                                .textHeader {
                                    font-size: 15px;
                                    font-weight: bold;
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
                                    color: ${
                                        colorScheduleStatus
                                            ? colorScheduleStatus
                                            : Constants.Styles.COLOR_SECONDARY
                                    }
                                }
                                .textReasonCancel {
                                    color: red
                                }
                                .buttonShowDetail {
                                    background-color: #3b8cff;
                                    padding: 5px;
                                    border-radius: 4px;
                                    border-width: 0px;
                                    margin-bottom: 5px;
                                }
                                .buttonOpenApp {
                                    background-color: #ff982a;
                                    padding: 5px;
                                    border-radius: 4px;
                                    border-width: 0px;
                                }
                                .textLink {
                                    color: white !important;
                                    text-decoration: none;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="wapper">
                                    <img
                                        src="${srcImageCar}"
                                        alt="image-car"
                                        class="imageAvatar"
                                    />
                                    <div class="divContent">
                                        <p class="textTitle">${title}</p>
                                        <p class="textHeader">${typeCar} ${seatNumber} Chổ</p>
                                        <p>
                                            <span class="textContent">Biển Số:</span>
                                            ${licensePlates}
                                        </p>
                                        <p>
                                            <span class="textContent">Trạng Thái Lịch Trình:</span>
                                            <span class="textStatusSchedule">${scheduleStatus}</span>
                                        </p>
                                        ${reasonCancelSchedule}
                                        <p>
                                            <span class="textContent">Thời Gian:</span>
                                            <span class="textDate">${dateRange}</span>
                                        </p>
                                        <p>
                                            <span class="textContent">Mục đích sử dụng xe:</span>
                                            ${reason}
                                        </p>
                                        <p>
                                            <span class="textContent">Ghi Chú:</span>
                                            ${note}
                                        </p>
                                        <p>
                                            <span class="textContent">Vị trí bắt đầu:</span>
                                            ${startLocation}
                                        </p>
                                        <p>
                                            <span class="textContent">Vị trí kết thúc:</span>
                                            ${endLocation}
                                        </p>
                                        <p style="margin-bottom: 5px">
                                            <span class="textContent"
                                                >Thông Tin Người Đăng Ký Xe:</span
                                            >
                                        </p>
                                        <ul style="list-style-type: circle; margin-top: 0px">
                                            <li>Họ Tên: ${fullNameUser}</li>
                                            <li>Số Điện Thoại: ${phoneUser}</li>
                                        </ul>
                                        <p style="margin-bottom: 5px">
                                            <span class="textContent">Thông Tin Tài Xế:</span>
                                        </p>
                                        ${infoDriver}

                                        <p>
                                            <span class="textContent">Ngày Đăng Ký:</span>
                                            <span>${createdAt}</span>
                                        </p>
                                        ${existUpdatedAt}
                                    </div>
                                    <button class="buttonShowDetail">
                                        <a href="${linkScheduleWeb}" class="textLink"> Xem Thông Tin Chi Tiết </a>
                                    </button>
                                    <button class="buttonOpenApp">
                                    <a href="${linkScheduleApp}" class="textLink"> Mở Ứng Dụng </a>
                                    </button>
                                </div>
                            </div>
                        </body>
                    </html>`;
    sendMail(email, subject, text, html);
};

module.exports = { executeQuery, sendEmailCreateOrUpdateSchedule };

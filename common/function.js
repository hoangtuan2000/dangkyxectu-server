const { Constants } = require("../constants/Constants");
const ldap = require("ldapjs");
const { ldapClient } = require("../middlewares/ldap/ldapConfig");
const { sendMail } = require("../middlewares/nodeMailer/nodeMailer");
require("dotenv").config();

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

const addUserLdap = async (fullName, code, password) => {
    const DN_LDAP_ADMIN = await process.env.DN_LDAP_ADMIN;
    const SECRET_LDAP_ADMIN = await process.env.SECRET_LDAP_ADMIN;

    return new Promise((resolve, reject) => {
        ldapClient.bind(DN_LDAP_ADMIN, SECRET_LDAP_ADMIN, function (err) {
            // error authentication ldap server
            if (err) {
                console.log("err addDriverLdap 1", err);
                return resolve(false);
            }
            // get data user => token
            else {
                var entry = {
                    sn: `${fullName}`,
                    objectclass: `${process.env.OBJECT_CLASS_LDAP}`,
                    userPassword: `${password}`,
                };
                ldapClient.add(
                    `cn=${code},ou=users,ou=system`,
                    entry,
                    function (err) {
                        if (err) {
                            console.log("err addDriverLdap 2" + err);
                            return resolve(false);
                        } else {
                            console.log("added user");
                            return resolve(true);
                        }
                    }
                );
            }
        });
    });
};

const updateCNLdap = async (codeOld, codeNew) => {
    return new Promise((resolve, reject) => {
        ldapClient.bind(
            process.env.DN_LDAP_ADMIN,
            process.env.SECRET_LDAP_ADMIN,
            function (err) {
                // error authentication ldap server
                if (err) {
                    console.log("err updateCNLdap", err);
                    return resolve(false);
                } else {
                    ldapClient.modifyDN(
                        `cn=${codeOld},${process.env.DN_LDAP_COMMON}`,
                        `cn=${codeNew}`,
                        function (err) {
                            if (err) {
                                console.log("err in updateCNLdap " + err);
                                return resolve(false);
                            } else {
                                console.log("updateCNLdap success");
                                return resolve(true);
                            }
                        }
                    );
                }
            }
        );
    });
};

const updatePasswordLdap = async (code, password) => {
    return new Promise((resolve, reject) => {
        ldapClient.bind(
            process.env.DN_LDAP_ADMIN,
            process.env.SECRET_LDAP_ADMIN,
            function (err) {
                // error authentication ldap server
                if (err) {
                    console.log("err updatePasswordLdap", err);
                    return resolve(false);
                } else {
                    var change = new ldap.Change({
                        operation: "replace", // use replace to update the existing attribute
                        modification: {
                            userPassword: password,
                        },
                    });

                    ldapClient.modify(
                        `cn=${code},${process.env.DN_LDAP_COMMON}`,
                        change,
                        function (err) {
                            if (err) {
                                console.log("err in updatePasswordLdap " + err);
                                return resolve(false);
                            } else {
                                console.log("updatePasswordLdap success");
                                return resolve(true);
                            }
                        }
                    );
                }
            }
        );
    });
};

const updateSNLdap = async (code, fullName) => {
    return new Promise((resolve, reject) => {
        ldapClient.bind(
            process.env.DN_LDAP_ADMIN,
            process.env.SECRET_LDAP_ADMIN,
            function (err) {
                // error authentication ldap server
                if (err) {
                    console.log("err updateSNLdap", err);
                    return resolve(false);
                }
                // get data user => token
                else {
                    var change = new ldap.Change({
                        operation: "replace", // use replace to update the existing attribute
                        modification: {
                            sn: fullName,
                        },
                    });

                    ldapClient.modify(
                        `cn=${code},${process.env.DN_LDAP_COMMON}`,
                        change,
                        function (err) {
                            if (err) {
                                console.log("err in updateSNLdap " + err);
                                return resolve(false);
                            } else {
                                console.log("updateSNLdap success");
                                return resolve(true);
                            }
                        }
                    );
                }
            }
        );
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
                                    
                                </div>
                            </div>
                        </body>
                    </html>`;
    sendMail(email, subject, text, html);
};

module.exports = {
    executeQuery,
    sendEmailCreateOrUpdateSchedule,
    addUserLdap,
    updateCNLdap,
    updatePasswordLdap,
    updateSNLdap,
};

const nodemailer = require("nodemailer");
require('dotenv').config();

let emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_SERVER,
        pass: process.env.PASS_EMAIL_SERVER,
    },
});

const sendMail = (email, subject, text, html) => {
    emailTransporter.sendMail({
        from: process.env.EMAIL_SERVER,
        to: `${email}`,
        subject: subject || "Hệ Thống Đăng Ký Xe",
        text: text || "Phiên Bản Email Của Bạn Không Hỗ Trợ HTML",
        html: html || "<span>Không Có Nội Dung</span>",
    });
};

module.exports = {sendMail};

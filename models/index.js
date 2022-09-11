const mysql = require("mysql");
require("dotenv").config();

var db = mysql.createConnection({
    host: process.env.HOST_MYSQL,
    user: process.env.USER_MYSQL,
    password: process.env.PASSWORD_MYSQL,
    database: process.env.DATABASE_MYSQL,
    multipleStatements: true,
});

db.connect(function (err) {
    if (err) {
        console.log("connect database failure ", err);
    } else {
        console.log("Connected Database Successfully!");
    }
});

module.exports = db;

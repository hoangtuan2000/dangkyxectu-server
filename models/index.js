const mysql = require("mysql");

var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "he_thong_dang_ky_xe_ctu",
});

db.connect(function (err) {
    // if (err) throw err;
    // console.log("Connected Database Successfully!");
    if (err) {
        console.log("connect database failure ", err);
    } else {
        console.log("Connected Database Successfully!");
    }
});

module.exports = db;

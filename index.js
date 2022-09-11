const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        // origin: ["http://localhost:3000", "http://localhost:3006"], // port of web client front-end 'http://localhost:3000' and web admin front-end 'http://localhost:3006'
        methods: ["GET", "POST"],
        // credentials: true, //pass header
    })
);

const PathsGlobal = require("./paths/pathsGlobal/PathsGlobal");
const PathsAdmin = require("./paths/pathsAdmin/PathsAdmin");
const PathsUser = require("./paths/pathsUser/PathsUser");
const PathsDriver = require("./paths/pathsDriver/PathsDriver");
const db = require("./models");
const { Constants } = require("./constants/Constants");
const { Strings } = require("./constants/Strings");

PathsGlobal.setupPaths(app);
PathsAdmin.setupPaths(app);
PathsUser.setupPaths(app);
PathsDriver.setupPaths(app);

// const executeQuery = async (connect, query, params) => {
//     return new Promise((resolve, reject) => {
//         connect.query(query, params, (err, result) => {
//             if (err) {
//                 return resolve(false);
//             }

//             return resolve(result);
//         });
//     });
// };

// app.use("/test", async (req, res) => {
//     const { group } = req.body;

//     let data = { ...Constants.ResultData };

//     const nameTables = group.split(",");
//     for (let i = 0; i < nameTables.length; i++) {
//         const name = nameTables[i].replace(/\s+|\s+/gm, ""); //remove space
//         const result = await executeQuery(db, `select * from ${name}`);
//         if (!result) {
//             data.status = Constants.ApiCode.BAD_REQUEST;
//             data.message = Strings.Common.ERROR_GET_DATA;
//             data.data = [];
//             break;
//         } else {
//             const result2 = {};
//             result2[`${name}`] = [...result];
//             data.data = { ...data.data, ...result2 };
//         }
//     }
//     res.send(data);
// });

app.listen(3001, () => {
    console.log("server is running on port 3001");
});

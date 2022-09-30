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


PathsGlobal.setupPaths(app);
PathsAdmin.setupPaths(app);
PathsUser.setupPaths(app);
PathsDriver.setupPaths(app);

app.listen(3001, () => {
    console.log("server is running on port 3001");
});

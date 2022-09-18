const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const scheduleDriverControllers = require("../../controllers/controllersDriver/scheduleDriverControllers");
const router = require("express").Router();

router.post("/getDriverScheduleList", authenticationControllers.getUserToken, scheduleDriverControllers.getDriverScheduleList);

module.exports = router;

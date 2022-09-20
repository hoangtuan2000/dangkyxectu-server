const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const scheduleAdminControllers = require("../../controllers/controllersAdmin/scheduleAdminControllers");
const router = require("express").Router();

router.post(
    "/getAdminScheduleList",
    authenticationControllers.getUserToken,
    scheduleAdminControllers.getAdminScheduleList
);

module.exports = router;

const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const scheduleAdminControllers = require("../../controllers/controllersAdmin/scheduleAdminControllers");
const carAdminControllers = require("../../controllers/controllersAdmin/carAdminControllers");
const router = require("express").Router();

router.post(
    "/getAdminScheduleStatusListToUpdate",
    authenticationControllers.getUserToken,
    scheduleAdminControllers.getAdminScheduleStatusListToUpdate
);

router.post(
    "/getAdminScheduleList",
    authenticationControllers.getUserToken,
    scheduleAdminControllers.getAdminScheduleList
);

router.post(
    "/getDriverListForSchedule",
    authenticationControllers.getUserToken,
    scheduleAdminControllers.getDriverListForSchedule
);

router.post(
    "/updateSchedule",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.updateSchedule
);

router.post(
    "/getCarListForAdmin",
    authenticationControllers.authenticationAdmin,
    carAdminControllers.getCarListForAdmin
);

module.exports = router;

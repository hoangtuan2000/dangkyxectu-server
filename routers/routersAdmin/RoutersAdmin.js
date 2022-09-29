const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const scheduleAdminControllers = require("../../controllers/controllersAdmin/scheduleAdminControllers");
const carAdminControllers = require("../../controllers/controllersAdmin/carAdminControllers");
const imageAdminControllers = require("../../controllers/controllersAdmin/imageAdminControllers");
const router = require("express").Router();

// SHCEDULE ADMIN
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

// CAR ADMIN
router.post(
    "/getCarListForAdmin",
    authenticationControllers.authenticationAdmin,
    carAdminControllers.getCarListForAdmin
);

router.post(
    "/createCar",
    authenticationControllers.authenticationAdmin,
    imageAdminControllers.uploadImage,
    carAdminControllers.createCar
);

module.exports = router;

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
    "/getCarLicense",
    authenticationControllers.authenticationAdmin,
    carAdminControllers.getCarLicense
);

router.post(
    "/getCarToUpdate",
    authenticationControllers.authenticationAdmin,
    carAdminControllers.getCarToUpdate
);

router.post(
    "/createCar",
    authenticationControllers.authenticationAdmin,
    imageAdminControllers.validateUploadImageWhenCreateCar,
    carAdminControllers.validateDataCreateCar,
    carAdminControllers.checkLicensePlatesExist,
    imageAdminControllers.uploadImageToFirebase,
    carAdminControllers.createCar,
    carAdminControllers.createCarLicense
);

router.post(
    "/updateCar",
    authenticationControllers.authenticationAdmin,
    imageAdminControllers.validateUploadImageWhenUpdateCar,
    carAdminControllers.validateDataUpdateCar,
    carAdminControllers.checkLicensePlatesExist,
    carAdminControllers.getImageCar,
    imageAdminControllers.uploadImageToFirebase,
    carAdminControllers.updateCar,
    carAdminControllers.updateCarLicense,
    imageAdminControllers.deleteImageFromFirebase,
);

module.exports = router;

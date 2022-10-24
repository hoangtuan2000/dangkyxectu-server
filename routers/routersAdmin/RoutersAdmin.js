const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const userControllers = require("../../controllers/controllersGlobal/userControllers");
const scheduleAdminControllers = require("../../controllers/controllersAdmin/scheduleAdminControllers");
const analysisAdminControllers = require("../../controllers/controllersAdmin/analysisAdminControllers");
const scheduleControllers = require("../../controllers/controllersGlobal/scheduleControllers");
const carAdminControllers = require("../../controllers/controllersAdmin/carAdminControllers");
const driverAdminControllers = require("../../controllers/controllersAdmin/driverAdminControllers");
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
    "/updateSchedulePending",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.updateSchedulePending,
    scheduleAdminControllers.sendNotificationEmailUpdateSchedulePeding
);

router.post(
    "/updateScheduleApproved",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.updateScheduleApproved
);

router.post(
    "/getCarListToChangeCar",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.getCarListToChangeCar
);

router.post(
    "/changeCarSchedule",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.changeCarSchedule,
    scheduleAdminControllers.sendNotificationEmailChangeCarSchedule
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
    imageAdminControllers.deleteImageFromFirebase
);

// TRIP
router.post(
    "/getCarStatusListOfTrips",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.getCarStatusListOfTrips
);

router.post(
    "/getScheduleBrokenCarParts",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.getScheduleBrokenCarParts
);

router.post(
    "/getDriverListForFilter",
    authenticationControllers.authenticationAdmin,
    scheduleAdminControllers.getDriverListForFilter
);

// DRIVER
router.post(
    "/getDriverList",
    authenticationControllers.authenticationAdmin,
    driverAdminControllers.getDriverList
);

router.post(
    "/getDriverToUpdate",
    authenticationControllers.authenticationAdmin,
    driverAdminControllers.getDriverToUpdate
);

router.post(
    "/createDriver",
    authenticationControllers.authenticationAdmin,
    userControllers.validateDataCreateUser,
    userControllers.checkCodeUserExist,
    userControllers.checkEmailUserExist,
    driverAdminControllers.createDriver
);

router.post(
    "/updateDriver",
    authenticationControllers.authenticationAdmin,
    userControllers.validateDataUpdateUser,
    userControllers.checkCodeUserUpdateExist,
    userControllers.checkEmailUserUpdateExist,
    driverAdminControllers.updateDriver
);

// ANALYSIS
router.post(
    "/getAnalysisTotalCommon",
    authenticationControllers.authenticationAdmin,
    analysisAdminControllers.getAnalysisTotalCommon
);

router.post(
    "/getTotalNumberOfTripsOverTime",
    authenticationControllers.authenticationAdmin,
    analysisAdminControllers.getTotalNumberOfTripsOverTime
);

module.exports = router;

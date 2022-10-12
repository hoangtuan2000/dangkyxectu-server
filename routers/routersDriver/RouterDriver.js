const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const scheduleDriverControllers = require("../../controllers/controllersDriver/scheduleDriverControllers");
const imageDriverControllers = require("../../controllers/controllersDriver/imageDriverControllers");
const router = require("express").Router();

router.post(
    "/getDriverScheduleList",
    authenticationControllers.authenticationDriver,
    scheduleDriverControllers.getDriverScheduleList
);

router.post(
    "/confirmReceivedOrCompleteOfSchedule",
    authenticationControllers.authenticationDriver,
    imageDriverControllers.validateUploadImagesBrokenCarParts,
    scheduleDriverControllers.checkBrokenCarPartsHasBeenConfirmed,
    scheduleDriverControllers.validateDataToConfirmReceivedOrCompleteOfSchedule,
    imageDriverControllers.uploadMultipleImagesBrokenCarPartsToFirebase,
    scheduleDriverControllers.confirmReceivedOrCompleteOfSchedule,
    scheduleDriverControllers.createBrokenCarParts,
);

router.post(
    "/confirmMoving",
    authenticationControllers.authenticationDriver,
    scheduleDriverControllers.confirmMoving,
);

module.exports = router;

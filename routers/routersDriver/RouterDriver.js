const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const scheduleDriverControllers = require("../../controllers/controllersDriver/scheduleDriverControllers");
const imageDriverControllers = require("../../controllers/controllersDriver/imageDriverControllers");
const router = require("express").Router();

router.post(
    "/getDriverScheduleList",
    authenticationControllers.getUserToken,
    scheduleDriverControllers.getDriverScheduleList
);

router.post(
    "/carBrokenPartsConfirmation",
    authenticationControllers.getUserToken,
    imageDriverControllers.validateUploadImagesBrokenCarParts,
    scheduleDriverControllers.checkBrokenCarPartsHasBeenConfirmed,
    scheduleDriverControllers.validateDataToConfirmReceivedOrCompleteOfSchedule,
    imageDriverControllers.uploadMultipleImagesBrokenCarPartsToFirebase,
    scheduleDriverControllers.confirmReceivedOrCompleteOfSchedule,
    scheduleDriverControllers.createBrokenCarParts,
);

module.exports = router;

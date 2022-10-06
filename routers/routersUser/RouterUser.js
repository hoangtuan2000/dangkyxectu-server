const authenticationControllers = require("../../controllers/controllersGlobal/authenticationControllers");
const scheduleUserControllers = require("../../controllers/controllersUser/scheduleUserControllers");
const scheduleControllers = require("../../controllers/controllersGlobal/scheduleControllers");
const router = require("express").Router();

router.post(
    "/getUserRegisteredScheduleList",
    authenticationControllers.getUserToken,
    scheduleUserControllers.getUserRegisteredScheduleList
);
router.post(
    "/createOrUpdateReview",
    authenticationControllers.getUserToken,
    scheduleUserControllers.createOrUpdateReview
);
router.post(
    "/updatePhoneNumberUserInSchedule",
    authenticationControllers.getUserToken,
    scheduleUserControllers.updatePhoneNumberUserInSchedule
);
router.post(
    "/cancelSchedule",
    authenticationControllers.getUserToken,
    scheduleUserControllers.cancelSchedule
);
router.post(
    "/updateSchedulePending",
    authenticationControllers.getUserToken,
    scheduleControllers.checkScheduleDuplication,
    scheduleUserControllers.updateSchedulePending
);

module.exports = router;

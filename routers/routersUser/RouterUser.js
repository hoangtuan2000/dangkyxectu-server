const authenticationControllers = require('../../controllers/controllersGlobal/authenticationControllers')
const scheduleUserControllers = require('../../controllers/controllersUser/scheduleUserControllers')
const router = require('express').Router()

router.post('/getUserRegisteredScheduleList', authenticationControllers.getUserToken, scheduleUserControllers.getUserRegisteredScheduleList)
router.post('/createOrUpdateReview', authenticationControllers.getUserToken, scheduleUserControllers.createOrUpdateReview)
router.post('/updateScheduleApproved', authenticationControllers.getUserToken, scheduleUserControllers.updateScheduleApproved)
router.post('/cancelSchedule', authenticationControllers.getUserToken, scheduleUserControllers.cancelSchedule)

module.exports = router
const authenticationControllers = require('../../controllers/controllersGlobal/authenticationControllers')
const scheduleUserControllers = require('../../controllers/controllersUser/scheduleUserControllers')
const router = require('express').Router()

router.post('/getUserRegisteredScheduleList', authenticationControllers.getUserToken, scheduleUserControllers.getUserRegisteredScheduleList)

module.exports = router
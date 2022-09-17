const authenticationControllers = require('../../controllers/controllersGlobal/authenticationControllers')
const commonControllers = require('../../controllers/controllersGlobal/commonControllers')
const carControllers = require('../../controllers/controllersGlobal/carControllers')
const scheduleControllers = require('../../controllers/controllersGlobal/scheduleControllers')
const router = require('express').Router()

router.post('/login', authenticationControllers.login)
router.post('/authentication', authenticationControllers.authentication)
router.post('/getUserToken', authenticationControllers.getUserToken)
router.post('/authenticationAdmin', authenticationControllers.authenticationAdmin)
router.post('/getCommon', authenticationControllers.getUserToken, commonControllers.getCommon)
router.post('/getCarList', authenticationControllers.getUserToken, carControllers.getCarList)
router.post('/getCar', authenticationControllers.getUserToken, carControllers.getCar)
router.post('/getScheduleList', authenticationControllers.getUserToken, scheduleControllers.getScheduleList)
router.post('/getSchedule', authenticationControllers.getUserToken, scheduleControllers.getSchedule)
router.post('/getScheduledDateForCar', authenticationControllers.getUserToken, scheduleControllers.getScheduledDateForCar)
router.post('/createSchedule', authenticationControllers.getUserToken, scheduleControllers.checkScheduleDuplication, scheduleControllers.createSchedule, scheduleControllers.getScheduleToSendEmail)

module.exports = router
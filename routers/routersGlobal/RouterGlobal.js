const authenticationControllers = require('../../controllers/controllersGlobal/authenticationControllers')
const commonControllers = require('../../controllers/controllersGlobal/commonControllers')
const carControllers = require('../../controllers/controllersGlobal/carControllers')
const scheduleControllers = require('../../controllers/controllersGlobal/scheduleControllers')
const router = require('express').Router()

router.post('/login', authenticationControllers.login)
router.post('/getCommon', commonControllers.getCommon)
router.post('/getCarList', carControllers.getCarList)
router.post('/getCar', carControllers.getCar)
router.post('/getScheduleList', scheduleControllers.getScheduleList)

module.exports = router
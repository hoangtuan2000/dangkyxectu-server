const authenticationControllers = require('../../controllers/controllersGlobal/authenticationControllers')
const commonControllers = require('../../controllers/controllersGlobal/commonControllers')
const carControllers = require('../../controllers/controllersGlobal/carControllers')
const router = require('express').Router()

router.post('/login', authenticationControllers.login)
router.post('/getCommon', commonControllers.getCommon)
router.post('/getCarList', carControllers.getCarList)

module.exports = router
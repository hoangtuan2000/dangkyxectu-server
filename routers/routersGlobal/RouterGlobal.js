const authenticationControllers = require('../../controllers/controllersGlobal/authenticationControllers')
const router = require('express').Router()

router.post('/login', authenticationControllers.login)
router.post('/login2', authenticationControllers.login2)

module.exports = router
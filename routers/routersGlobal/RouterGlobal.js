const authenticationControllers = require('../../controllers/controllersGlobal/authenticationControllers')
const router = require('express').Router()

router.post('/login', authenticationControllers.login)

module.exports = router
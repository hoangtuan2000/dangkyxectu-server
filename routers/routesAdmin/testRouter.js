const testControllers = require('../../controllers/controllersAdmin/testControllers')
const router = require('express').Router()

router.post('/addSmartphone', testControllers.addSmartphone)
router.post('/addSmartphone2', testControllers.addSmartphone2)

module.exports = router
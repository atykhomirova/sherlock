const router = require('express').Router();
const path = require('path');
global.appRoot = path.resolve(__dirname + '/../../../');

const confirmController = require(appRoot + '/controller/ConfirmController.js');

router.get('/', confirmController.checkConfirmEmail);

router.get('/send_email', confirmController.sendConfirmEmail);

router.get('/send_phone', confirmController.sendConfirmPhone);

module.exports = router;
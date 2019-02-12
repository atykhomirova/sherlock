const router = require('express').Router();
const confirmController = require(`${appRoot}/controller/ConfirmController`);

router.get('/', confirmController.checkConfirmEmail);

router.get('/send_email', confirmController.sendConfirmEmail);

router.get('/send_phone', confirmController.sendConfirmPhone);

module.exports = router;
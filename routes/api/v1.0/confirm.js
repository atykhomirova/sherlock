const router = require('express').Router();

const ConfirmController = require('../../../controller/ConfirmController.js');

const confirmController = new ConfirmController();

router.get('/', confirmController.checkConfirmEmail);

router.get('/send', confirmController.sendConfirmEmail);

module.exports = router;
const mongoose = require('mongoose');
const router = require('express').Router();

const ConfirmController = require('../../../controller/ConfirmController.js');

const confirmController = new ConfirmController();
mongoose.set('useFindAndModify', false);

router.get('/', confirmController.checkConfirmEmail);

router.get('/send', confirmController.sendConfirmEmail);

module.exports = router;
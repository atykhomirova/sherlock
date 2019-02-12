const router = require('express').Router();
const path = require('path');
global.appRoot = path.resolve(__dirname + '/../../../');
const auth = require(appRoot + '/lib/auth');

const authController = require(appRoot + '/controller/AuthController.js');

router.post('/login', auth.optional, authController.loginUser);

module.exports = router;
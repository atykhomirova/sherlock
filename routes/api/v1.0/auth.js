const router = require('express').Router();
const auth = require(`${appRoot}/lib/auth`);

const authController = require(`${appRoot}/controller/AuthController`);

router.post('/login', auth.optional, authController.loginUser);

module.exports = router;
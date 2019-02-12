const router = require('express').Router();
const auth = require('./auth');

const UserController = require('../../../controller/UserController.js');

const userController = new UserController();

router.post('/', auth.optional, userController.createUser);

router.post('/login', auth.optional, userController.loginUser);

router.get('/current', auth.required, userController.getCurrentUser);

module.exports = router;


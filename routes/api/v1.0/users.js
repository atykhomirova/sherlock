const router = require('express').Router();
const auth = require(`${appRoot}/lib/auth`);

const userController = require(appRoot + '/controller/UserController.js');

router.post('/', auth.optional, userController.createUser);

router.put('/update', auth.required, userController.updateUser);

module.exports = router;


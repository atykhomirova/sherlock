const UserService = require('../service/UserService.js');

const userService = new UserService();

function UserController() {
}

UserController.prototype.createUser = async function(req, res, next){
    return userService.saveUser(req, res, next);
};

UserController.prototype.loginUser = async function(req, res, next){
    return userService.loginUser(req, res, next);
};

UserController.prototype.getCurrentUser = async function(req, res, next){
    userService.getCurrentUser(req, res, next);
};

module.exports = UserController;
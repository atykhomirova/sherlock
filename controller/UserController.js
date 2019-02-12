const path = require('path');
global.appRoot = path.resolve(__dirname + '/../');
const userService = require(appRoot + '/service/UserService.js');

async function createUser(req, res, next){
    return userService.saveUser(req, res, next);
};

async function updateUser(req, res, next){
    return userService.updateUser(req, res, next);
};

module.exports = {
    createUser: createUser,
    updateUser: updateUser
};
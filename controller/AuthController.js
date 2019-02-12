const path = require('path');
global.appRoot = path.resolve(__dirname + '/../');
const authService = require(appRoot + '/service/AuthService.js');

async function loginUser(req, res, next){
    return authService.loginUser(req, res, next);
};

module.exports = {
    loginUser: loginUser
};
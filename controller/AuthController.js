const authService = require(`${appRoot}/service/AuthService`);

async function loginUser(req, res, next){
    return authService.loginUser(req, res, next);
};

module.exports = {
    loginUser: loginUser
};
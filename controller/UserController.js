const userService = require(`${appRoot}/service/UserService`);

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
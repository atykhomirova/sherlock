const path = require('path');
global.appRoot = path.resolve(__dirname + '/../');
const confirmService = require(appRoot + '/service/ConfirmService.js');

function sendConfirmEmail(req, res, next){
    return confirmService.sendConfirmEmail(req, res, next);
};

async function checkConfirmEmail(req, res, next){
    return confirmService.checkConfirmEmail(req, res, next);
};

function sendConfirmPhone(req, res, next){
    return confirmService.sendConfirmPhone(req, res, next);
};

module.exports = {
    sendConfirmEmail: sendConfirmEmail,
    checkConfirmEmail: checkConfirmEmail,
    sendConfirmPhone: sendConfirmPhone
};
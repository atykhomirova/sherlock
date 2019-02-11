const ConfirmService = require('../service/ConfirmService.js');

const confirmService = new ConfirmService();

function ConfirmController() {
}

ConfirmController.prototype.sendConfirmEmail = function(req, res, next){
    confirmService.sendConfirmEmail(req, res, next);
};

ConfirmController.prototype.checkConfirmEmail = async function(req, res, next){
    return confirmService.checkConfirmEmail(req, res, next);
};

module.exports = ConfirmController;
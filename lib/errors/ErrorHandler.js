const UserError = require('./UserError');
const AdminError = require('./AdminError');
const utils = require(appRoot + '/lib/utils');
const config = require(appRoot + '/config.json');

module.exports = class ErrorHandler {
    constructor(error) {
        this.message = 'Error';
        if(error instanceof AdminError) {
            if (config.app.errors.sendAdmin) {
                utils.sendToService({
                    id:"user_service",
                    method: "email_send_to",
                    params: [
                        id,
                        config.app.admin.email,
                        error.message
                    ]
                })
                    .then(resp => {
                        utils.log('Error sent to ' + config.app.admin.email);
                    })
                    .catch(err => {
                        utils.log('Error doesn\'t sent to ' + config.app.admin.email, 0);
                    });
            }
        }
        if(error instanceof UserError) {
            this.message = error.message;
        }
        this.code = error.code || 32000;
        utils.log(new Date() + ' Error ' + error.message
            + ' Code: ' + this.code, 0);
    }
};
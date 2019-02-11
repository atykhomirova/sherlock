module.exports = class UserError extends require('./ServiceError') {
    constructor(message, code = 32002) {
        super(message ? `${message}`: 'Service Error', code);
        this.code = code;
    }
};
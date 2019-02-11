module.exports = class AdminError extends require('./ServiceError') {
    constructor(message, code = 32003, location = 'application/default_method') {
        super(message ? `${message}`: 'Error', code);
        this.code = code;
        this.location = location;
    }
};
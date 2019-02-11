module.exports = class ServiceError extends Error {
    constructor(message, code = 32001) {
        super(message);
        this.name = this.constructor.name;
        if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
        this.code = code;
    }
};
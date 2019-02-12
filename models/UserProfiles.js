const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {Schema} = mongoose;

const UserProfilesSchema = new Schema({
    name: {type: String, default: ''},
    created: {type: Date, index: true, default: Date.now()},
    status: {type: Number, index: true, enum: [0, 1, 2], default: 0},
    avatar: {type: Object},
    emails: [{
        email: {type: String, index: true},
        primary: {type: Boolean, default: false},
        status: {type: Boolean, default: false},
        code: {type: String, default: '000000'},
        created: {type: Date, index: true, default: Date.now()}
    }],
    rating: {type: Number, default: 0},
    phones: [{
        phone: {type: String, index: true},
        primary: {type: Boolean, default: false},
        status: {type: Boolean, default: false},
        code: {type: String, default: '000000'},
        created: {type: Date, index: true, default: Date.now()}
    }],
    ips: [{
        ip: {type: String},
        signingDate: {type: Date},
        location: {
            lat: {type: String},
            lng: {type: String}
        }
    }],
    role: {type: String},
    born: {type: Date},
    gender: {type: String},
    hash: String,
    salt: String,
    token: String
});

UserProfilesSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserProfilesSchema.methods.setEmail = function (email) {
    this.emails = [{email: email}];
};

UserProfilesSchema.methods.setEmailAndCode = function (email, code) {
    this.emails = [{email: email, code: code}];
};

UserProfilesSchema.methods.setPhone = function (phone) {
    this.phones = [{phone: phone}];
};

UserProfilesSchema.methods.setToken = function (token) {
    this.token = token;
};


UserProfilesSchema.methods.validatePassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UserProfilesSchema.methods.generateJWT = function () {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        email: this.email,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10)
    }, 'secret');
};

UserProfilesSchema.methods.toAuthJSON = function () {
    return {
        _id: this._id,
        token: this.generateJWT()
    };
};

UserProfilesSchema.methods.getUserProfile = function () {
    return {
        _id: this._id,
        token: this.generateJWT()
    };
};

mongoose.model('UserProfiles', UserProfilesSchema);
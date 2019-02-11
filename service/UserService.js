const mongoose = require('mongoose');
const UserProfiles = mongoose.model('UserProfiles');
const validator = require('validator');
const passport = require('passport');
const randomSTR = require('randomstring');

const ConfirmService = require('../service/ConfirmService.js');

const confirmService = new ConfirmService();

function UserService() {
}

UserService.prototype.checkExistUser = async function (email, phone, password, res) {
    var userProfiles = await UserProfiles.find({$or: [{emails: {$elemMatch: {email: email}}}, {phones: {$elemMatch: {phone: phone}}}]}).exec();
    var isExistUser = await userProfiles.filter(function (userProfile) {
        return userProfile.validatePassword(password);
    });
    if (isExistUser.length > 0) {
        return res.status(409).json({
            errors: {
                code: 409,
                message: 'User already exists!'
            }
        });
    }
};

UserService.prototype.saveUser = async function(req, res, next){
    const {body: {userProfile}} = req;

    var checkEmailPhonePassword = await this.checkEmailPhonePassword(userProfile.email, userProfile.phone, userProfile.password, res);
    if (checkEmailPhonePassword) {
        return checkEmailPhonePassword;
    }

    var checkExistUser = await this.checkExistUser(userProfile.email, userProfile.phone, userProfile.password, res);
    if (checkExistUser){
        return checkExistUser;
    }

    const finalUser = new UserProfiles(userProfile);
    finalUser.setPassword(userProfile.password);
    var code =  randomSTR.generate(6);
    if (userProfile.email) {
        finalUser.setEmail(userProfile.email, code);
    }

    if (userProfile.phone) {
        finalUser.setPhone(userProfile.phone);
    }

    return finalUser.save()
        .then((finalUser) => {
            if (userProfile.email) {
                confirmService.sendEmail(finalUser._id, userProfile.email, code, res);
            }
        }).then(() => res.json({userProfile: finalUser.toAuthJSON()}))
        .catch(err => next(err));
};

UserService.prototype.checkEmailPhonePassword = async function (email, phone, password, res) {
    if (!email && !phone) {
        return res.status(401).json({
            errors: {
                code: 1402,
                message: 'Enter correct param'
            }
        });
    }
    if (email && !validator.isEmail(email)) {
        return res.status(401).json({
            errors: {
                code: 1405,
                message: 'Enter correct param'
            }
        });
    }

    if (phone && !validator.isMobilePhone(phone, 'any')) {
        return res.status(401).json({
            errors: {
                code: 1406,
                message: 'Enter correct param'
            }
        });
    }
    if (!password) {
        return res.status(401).json({
            errors: {
                code: 1407,
                message: 'Enter correct param'
            }
        });
    }

};

UserService.prototype.loginUser = function(req, res, next){
    const {body: {userProfile}} = req;

    if (!userProfile.login) {
        return res.status(408).json({
            errors: {
                code: 408,
                message: 'Login is empty'
            }
        });
    }

    if (!userProfile.password) {
        return res.status(407).json({
            errors: {
                code: 407,
                message: 'Password is empty'
            }
        });
    }

    return passport.authenticate('local', {session: false}, (err, passportUser, info) => {
        if (passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();
            return res.json({userProfile: user.toAuthJSON()});
        }

        return res.status(403).json({
            errors: {
                code: 403,
                message: 'Password and login did not match',
            },
        });
    })(req, res, next);
};

UserService.prototype.getCurrentUser = function(req, res, next){
    const {payload: {id}} = req;

    return UserProfiles.findById(id)
        .then((userProfile) => {
            if (!userProfile) {
                return res.status(404).json({
                    errors: {
                        code: 404,
                        message: 'User not found'
                    }
                });
            }
            return res.json({userProfiles: userProfile.toAuthJSON()});
        }).catch(err => next(err));
};

module.exports = UserService;

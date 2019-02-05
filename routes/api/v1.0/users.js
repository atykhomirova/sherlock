const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../../auth');
const crypto = require('crypto');
const UserProfiles = mongoose.model('UserProfiles');

const UserService = require('./service/userService.js');
const SendService = require('./service/sendService.js');

const userService = new UserService();
const sendService = new SendService();
mongoose.set('useFindAndModify', false);

var rand;

router.post('/', auth.optional, async (req, res, next) => {
    const {body: {userProfile}} = req;

    var isNotValidParams = await userService.checkEmailPhonePassword(userProfile.email, userProfile.phone, userProfile.password);
    if (isNotValidParams) {
        return res.status(isNotValidParams).json({
            errors: {
                code: isNotValidParams,
                message: 'Enter correct param'
            }
        });
    }

    var isExistUser = await userService.checkExistUser(userProfile.email, userProfile.phone, userProfile.password);
    if (isExistUser.length > 0) {
        return res.status(409).json({
            errors: {
                code: 409,
                message: 'User already exists!'
            }
        });
    }

    const finalUser = new UserProfiles(userProfile);
    finalUser.setPassword(userProfile.password);
    if (userProfile.email) {
        finalUser.setEmail(userProfile.email);
        rand = crypto.randomBytes(64).toString('hex');
        finalUser.setToken(rand);
    }

    if (userProfile.phone) {
        finalUser.setPhone(userProfile.phone);
    }

    return finalUser.save()
        .then((finalUser) => {
            if (userProfile.email) {
                sendService.sendConfirmEmail(finalUser._id, userProfile.email, finalUser.token);
            }
        }).then(() => res.json({userProfile: finalUser.toAuthJSON()}));
});

router.post('/login', auth.optional, (req, res, next) => {
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
});

router.get('/current', auth.required, (req, res, next) => {
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
        });
});

router.get('/confirm', async function (req, res) {
    const id = req.query.id;
    const email = req.query.email;
    const token = req.query.token;

    var isEmailConfirm = await userService.checkEmailForConfirm(email);
    if (isEmailConfirm){
        return res.status(401).json({
            errors: {
                code: 401,
                message: 'Email was confirm another user'
            }
        });
    }
    UserProfiles.findById(id)
        .then((userProfile) => {
            var user = JSON.parse(JSON.stringify(userProfile));
            if (user.token === token) {
                for (var i = 0; i < user.emails.length; i++) {
                    var userEmail = user.emails[i];
                    if (userEmail.email === email) {
                        userEmail.primary = true;
                        userEmail.status = true;
                        user.token = null;
                    }
                }
                UserProfiles.update({_id: id}, user, function (err, result) {
                    if (err) {
                        return res.status(400).json({
                            errors: {
                                message: 'User not updated'
                            }
                        });
                    } else {
                        return res.json({userProfiles: userProfile.toAuthJSON()});
                    }
                });
            }
        });
});

router.get('/send_confirm', async function (req, res) {
    const id = req.query.id;
    const email = req.query.email;

    var isConfirmEmail = await userService.checkEmailForConfirm(email);
    if (isConfirmEmail) {
        return res.status(401).json({
            errors: {
                code: 401,
                message: 'Email was confirm another user'
            }
        });
    }

    UserProfiles.findById(id).then((userProfile) => {
        var user = JSON.parse(JSON.stringify(userProfile));
        var rand = crypto.randomBytes(64).toString('hex');
        user.token = rand;
        UserProfiles.update({_id: id}, user, function (err, result) {
            if (err) {
                return res.status(400).json({
                    errors: {
                        message: 'User not updated'
                    }
                });
            } else {
                sendService.sendConfirmEmail(id, email, rand);
                return res.json({userProfiles: userProfile.toAuthJSON()});
            }
        });

    });

});

module.exports = router;


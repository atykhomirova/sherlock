const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const validator = require('validator');
const crypto = require('crypto');
const UserProfiles = mongoose.model('UserProfiles');
const nodemailer = require("nodemailer");
mongoose.set('useFindAndModify', false);

const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "sherlockapi@gmail.com",
        pass: "CyberSherlock#19"
    }
});

var rand, mailOptions, link;

router.post('/', auth.optional, (req, res, next) => {
    const {body: {userProfile}} = req;

    var email, phone;

    if (!userProfile.login) {
        return res.status(422).json({
            errors: {
                message: 'enter phone or email'
            }
        });
    }

    if (validator.isEmail(userProfile.login)) {
        email = userProfile.login;
    }

    if (validator.isMobilePhone(userProfile.login, 'any')) {
        phone = userProfile.login;
    }

    if (!userProfile.password) {
        return res.status(422).json({
            errors: {
                password: 'is required'
            }
        });
    }

    UserProfiles.count({$or: [{emails: {$elemMatch: {email: userProfile.login}}}, {phones: {$elemMatch: {phone: userProfile.login}}}]})
        .then((userProfile) => {
            if (userProfile) {
                return res.status(422).json({
                    errors: {
                        message: 'user already exists'
                    }
                });
            } else {
                const finalUser = new UserProfiles(userProfile);

                finalUser.setPassword(userProfile.password);

                if (email) {
                    finalUser.setEmail(userProfile.login);
                    rand = crypto.randomBytes(64).toString('hex');
                    finalUser.setToken(rand);
                }

                if (phone) {
                    finalUser.setPhone(userProfile.login);
                }

                return finalUser.save()
                    .then((finalUser) => {
                        if (email) {
                            link = "http://localhost:8000/api/users/verify?id=" + finalUser._id + "&email=" + email + '&token=' + finalUser.token;
                            mailOptions = {
                                to: email,
                                subject: "Please confirm your Email account",
                                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
                            };
                            smtpTransport.sendMail(mailOptions, function (error, response) {
                                if (error) {
                                    console.log(error);
                                    res.end("error");
                                } else {
                                    console.log("Message sent: " + response.message);
                                    res.end("sent");
                                }
                            });
                        }
                    }).then(() => res.json({userProfile: finalUser.toAuthJSON()}));
            }
        });
});

router.post('/login', auth.optional, (req, res, next) => {
    const {body: {userProfile}} = req;

    if (!userProfile.login) {
        return res.status(422).json({
            errors: {
                message: 'login is not present'
            }
        });
    }

    if (!userProfile.password) {
        return res.status(422).json({
            errors: {
                password: 'is required'
            }
        });
    }

    return passport.authenticate('local', {session: false}, (err, passportUser, info) => {
        if (err) {
            return res.status(400).json({
                errors: {
                    message: 'password or login did not match',
                },
            });
        }

        if (passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();

            return res.json({userProfile: user.toAuthJSON()});
        }

        return res.status(400).json({
            errors: {
                message: 'password or login did not match',
            },
        });
    })(req, res, next);
});

router.get('/current', auth.required, (req, res, next) => {
    const {payload: {id}} = req;

    return UserProfiles.findById(id)
        .then((userProfile) => {
            if (!userProfile) {
                return res.status(400).json({
                    errors: {
                        message: 'User not found'
                    }
                });
            }

            return res.json({userProfiles: userProfile.toAuthJSON()});
        });
});

router.get('/verify', function (req, res) {
    const id = req.query.id;
    const email = req.query.email;
    const token = req.query.token;

    UserProfiles.findById(id)
        .then((userProfile) => {
            var user = JSON.parse(JSON.stringify(userProfile));
            if (user.token === token) {
                for (var i = 0; i < user.emails.length; i++) {
                    var userEmail = user.emails[i];
                    if (userEmail.email === email) {
                        userEmail.primary = true;
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

module.exports = router;


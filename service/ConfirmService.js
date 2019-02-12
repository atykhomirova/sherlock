const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
const UserProfiles = mongoose.model('UserProfiles');
const config = require( '../config.json');
const randomSTR = require('randomstring');

function ConfirmService() {}

ConfirmService.prototype.sendEmail = function (id, email, code, res) {
    var mailOptions, link;

    var smtpTransport = nodemailer.createTransport({
        service: config.smtp.service,
        auth: {
            user: config.smtp.auth.user,
            pass: config.smtp.auth.pass
        }
    });

    link = config.email.confirmUrl + "?id=" + id + "&email=" + email + '&token=' + code;
    mailOptions = {
        to: email,
        subject: "Please confirm your Email account",
        html: "Hello,<br> Please Click on the link to confirm your email.<br><a href=" + link + ">Click here to verify</a>"
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
};

ConfirmService.prototype.checkEmailForConfirm = async function (email, res) {
    var userProfiles = await UserProfiles.find({emails: {$elemMatch: {email: email}}}).exec();
    if (userProfiles.length > 0) {
        for (var i = 0; i < userProfiles.length; i++) {
            if (userProfiles[0].emails.length > 0){
                for (var j = 0; j < userProfiles[i].emails.length; j++) {
                    if (userProfiles[i].emails[j].primary && userProfiles[i].emails[j].status) {
                        return res.status(401).json({
                            errors: {
                                code: 401,
                                message: 'Email was confirm another user'
                            }
                        });
                    }
                }
            }
        }
    }
};

ConfirmService.prototype.checkConfirmEmail = async function(req, res, next){
    const id = req.query.id;
    const email = req.query.email;
    const token = req.query.token;

    var checkEmailForConfirm = await this.checkEmailForConfirm(email, res);
    if (checkEmailForConfirm){
        return checkEmailForConfirm;
    }

    UserProfiles.findById(id)
        .then((userProfile) => {
            for (var i = 0; i < userProfile.emails.length; i++) {
                var userEmail = userProfile.emails[i];
                if (userEmail.email === email && userEmail.code === token) {
                    userEmail.primary = true;
                    userEmail.status = true;
                    userEmail.code = "000000";
                }
            }
            UserProfiles.update({_id: id}, userProfile, function (err, result) {
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
        }).catch(err => next(err));
};

ConfirmService.prototype.sendConfirmEmail = async function(req, res, next){
    const id = req.query.id;
    const email = req.query.email;

    var checkEmailForConfirm = await this.checkEmailForConfirm(email, res);
    if (checkEmailForConfirm){
        return checkEmailForConfirm;
    }

    UserProfiles.findById(id).then((userProfile) => {
        var code = randomSTR.generate(6);
        for (var i = 0; i < userProfile.emails.length; i++) {
            var userEmail = userProfile.emails[i];
            if (userEmail.email === email) {
                userEmail.code = code;
            }
        }
        UserProfiles.update({_id: id}, userProfile, function (err, result) {
            if (err) {
                return res.status(400).json({
                    errors: {
                        message: 'User not updated'
                    }
                });
            } else {
                this.sendEmail(id, email, code, res);
                return res.json({userProfiles: userProfile.toAuthJSON()});
            }
        });

    }).catch(err => next(err));
};

module.exports = ConfirmService;
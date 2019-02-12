const mongoose = require('mongoose');
const UserProfiles = mongoose.model('UserProfiles');
const nodemailer = require("nodemailer");
const path = require('path');
global.appRoot = path.resolve(__dirname + '/../');
const config = require( appRoot + '/config.json');
const randomSTR = require('randomstring');

function sendEmail(id, email, code, res) {
    let mailOptions, link;

    let smtpTransport = nodemailer.createTransport({
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

async function checkEmailForConfirm(email, res) {
    let userProfiles = await UserProfiles.find({emails: {$elemMatch: {email: email}}}).exec();
    if (userProfiles.length > 0) {
        for (let i = 0; i < userProfiles.length; i++) {
            if (userProfiles[0].emails.length > 0){
                for (let j = 0; j < userProfiles[i].emails.length; j++) {
                    if (userProfiles[i].emails[j].primary && userProfiles[i].emails[j].status) {
                        throw new Error({code: 1401, message:'Email was confirm another user'});
                    }
                }
            }
        }
    }
};

async function checkConfirmEmail(req, res, next){
    const id = req.query.id;
    const email = req.query.email;
    const token = req.query.token;

    try {
        await this.checkEmailForConfirm(email, res);

        UserProfiles.findById(id)
            .then((userProfile) => {
                for (let i = 0; i < userProfile.emails.length; i++) {
                    let userEmail = userProfile.emails[i];
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
    }catch (err) {
        return err => {res.status(401).json(err.error)};
    }

};

async function sendConfirmEmail(req, res, next){
    const id = req.query.id;
    const email = req.query.email;

    try {
        await this.checkEmailForConfirm(email, res);

        UserProfiles.findById(id).then((userProfile) => {
            let code = randomSTR.generate(6);
            for (let i = 0; i < userProfile.emails.length; i++) {
                let userEmail = userProfile.emails[i];
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
    }catch (err) {
        return err => {res.status(401).json(err.error)};
    }

};

async function sendConfirmPhone(req, res, next){
    return res.status(400).json({
        errors: {
            message: 'Not implemented'
        }
    });
}

module.exports = {
    sendEmail: sendEmail,
    checkEmailForConfirm: checkEmailForConfirm,
    checkConfirmEmail: checkConfirmEmail,
    sendConfirmEmail: sendConfirmEmail,
    sendConfirmPhone: sendConfirmPhone
};
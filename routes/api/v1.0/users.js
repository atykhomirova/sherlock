const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../../auth');
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

router.post('/', auth.optional, async (req, res, next) => {
    const {body: {userProfile}} = req;

    var isNotValidParams = await checkEmailPhonePassword(userProfile.email, userProfile.phone, userProfile.password);
    if (isNotValidParams) {
        return res.status(isNotValidParams).json({
            errors: {
                code: isNotValidParams,
                message: 'Enter correct param'
            }
        });
    }

    var isExistUser = await checkExistUser(userProfile.email, userProfile.phone, userProfile.password);
    if (isExistUser) {
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
                sendConfirmEmail(finalUser._id, userProfile.email, finalUser.token);
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

    var isEmailConfirm = await checkEmailForConfirm(email);
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

    var isConfirmEmail = await checkEmailForConfirm(email);
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
                sendConfirmEmail(id, email, rand);
                return res.json({userProfiles: userProfile.toAuthJSON()});
            }
        });

    });

});

const checkExistUser = async (email, phone, password) => {
    var userProfiles = await UserProfiles.find({$or: [{emails: {$elemMatch: {email: email}}}, {phones: {$elemMatch: {phone: phone}}}]}).exec();
    for (var i = 0; i < userProfiles.length; i++) {
        if (userProfiles[i].validatePassword(password)) {
            return true;
        }
    }
};

const checkEmailPhonePassword = async (email, phone, password) => {
    if (!email && !phone) {
        return 402;
    }
    if (email && !validator.isEmail(email)) {
        return 405;
    }

    if (phone && !validator.isMobilePhone(phone, 'any')) {
        return 406;
    }
    if (!password) {
        return 407;
    }

};

const sendConfirmEmail = (id, email, token) => {
    link = "http://localhost:8000/api/v1.0/users/confirm?id=" + id + "&email=" + email + '&token=' + token;
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

const checkEmailForConfirm = async (email) => {
    var userProfiles = await UserProfiles.find({emails: {$elemMatch: {email: email}}}).exec();
    var users = JSON.parse(JSON.stringify(userProfiles));
    if (users.length > 0){
        for (var i = 0; i < users.length; i++){
            if (users[0].emails.length > 0)
            for (var j = 0; j < users[i].emails.length; j++){
                if (users[i].emails[j].primary && users[i].emails[j].status){
                    return true;
                }
            }
        }
    }
};

module.exports = router;


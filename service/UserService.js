const mongoose = require('mongoose');
const UserProfiles = mongoose.model('UserProfiles');
const validator = require('validator');

async function checkExistUser(email, phone, password, res) {
    let userProfiles = await UserProfiles.find({$or: [{emails: {$elemMatch: {email: email}}}, {phones: {$elemMatch: {phone: phone}}}]}).exec();
    let isExistUser = await userProfiles.filter(function (userProfile) {
        return userProfile.validatePassword(password);
    });
    if (isExistUser.length > 0) {
        throw new Error(1409);
    }
};

async function saveUser(req, res, next) {
    const {body: {userProfile}} = req;

    try {
        await this.checkEmailPhonePassword(userProfile.email, userProfile.phone, userProfile.password, res);

        await this.checkExistUser(userProfile.email, userProfile.phone, userProfile.password, res);

        const finalUser = new UserProfiles(userProfile);
        finalUser.setPassword(userProfile.password);

        if (userProfile.email) {
            finalUser.setEmail(userProfile.email);
        }

        if (userProfile.phone) {
            finalUser.setPhone(userProfile.phone);
        }

        return finalUser.save()
            .then(() => res.json({userProfile: finalUser.toAuthJSON()}))
            .catch(err => next(err));

    } catch (err) {
        return res.status(401).json({
            errors: {
                code: err.message
            }
        });
    }
};

async function checkEmailPhonePassword(email, phone, password, res) {
    if (!email && !phone) {
        throw new Error(1402);
    }
    if (email && !validator.isEmail(email)) {
        throw new Error(1405);
    }

    if (phone && !validator.isMobilePhone(phone, 'any')) {
        throw new Error(1406);
    }
    if (!password) {
        throw new Error(1407);
    }

};

function updateUser(req, res, next) {
    const {body: {userProfile}} = req;
    if (userProfile.id) {
        UserProfiles.findById(userProfile.id)
            .then((user) => {
                UserProfiles.update({_id: userProfile.id}, userProfile, function (err, result) {
                    if (err) {
                        return res.status(400).json({
                            errors: {
                                message: 'User not updated'
                            }
                        });
                    } else {
                        return res.json({userProfiles: user.toAuthJSON()});
                    }
                });
            }).catch(err => next(err));
    }
};

module.exports = {
    checkExistUser: checkExistUser,
    saveUser: saveUser,
    checkEmailPhonePassword: checkEmailPhonePassword,
    updateUser: updateUser
};

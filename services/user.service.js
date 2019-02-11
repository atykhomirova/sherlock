const mongoose = require('mongoose');
const UserProfiles = mongoose.model('UserProfiles');
const validator = require('validator');

class UserService {
    async checkExistUser(email, phone, password){
        var userProfiles = await UserProfiles.find({$or: [{emails: {$elemMatch: {email: email}}}, {phones: {$elemMatch: {phone: phone}}}]}).exec();
        return userProfiles.filter(function (userProfile) {
            return userProfile.validatePassword(password);
        });
    };

    async checkEmailPhonePassword(email, phone, password){
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

    async checkEmailForConfirm(email){
        var userProfiles = await UserProfiles.find({emails: {$elemMatch: {email: email}}}).exec();
        if (userProfiles.length > 0){
            for (var i = 0; i < userProfiles.length; i++){
                if (userProfiles[0].emails.length > 0)
                    for (var j = 0; j < userProfiles[i].emails.length; j++){
                        if (userProfiles[i].emails[j].primary && userProfiles[i].emails[j].status){
                            return true;
                        }
                    }
            }
        }
    };

    async updateUserEmail(id, code, email, res){
        var userProfile = await UserProfiles.findById(id).exec();
        for (var i = 0; i < userProfile.emails.length; i++) {
            var userEmail = userProfile.emails[i];
            if (userEmail.email === email && userEmail.code === code) {
                userEmail.primary = true;
                userEmail.status = true;
                userEmail.code = null;
            }
        }

        UserProfiles.update({_id: id}, userProfile, function (err, result){
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
};

module.exports = UserService;

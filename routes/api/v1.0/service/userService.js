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
};

module.exports = UserService;

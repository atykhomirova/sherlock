const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const UserProfiles = mongoose.model('UserProfiles');

passport.use(new LocalStrategy({
    usernameField: 'userProfile[login]',
    passwordField: 'userProfile[password]',
}, (login, password, done) => {
    if (login.includes('@')) {
        UserProfiles.findOne({emails: {$elemMatch: {email: login}}})
            .then((userProfile) => {
                if (!userProfile || !userProfile.validatePassword(password)) {
                    return done(null, false, {errors: {'email or password': 'is invalid'}});
                }

                return done(null, userProfile);
            }).catch(done);
    } else {
        UserProfiles.findOne({phones: {$elemMatch: {phone: login}}})
            .then((userProfile) => {
                if (!userProfile || !userProfile.validatePassword(password)) {
                    return done(null, false, {errors: {'phone or password': 'is invalid'}});
                }

                return done(null, userProfile);
            }).catch(done);
    }

}));
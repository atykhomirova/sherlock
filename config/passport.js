const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const UserProfiles = mongoose.model('UserProfiles');

passport.use(new LocalStrategy({
  usernameField: 'userProfile[email]',
  passwordField: 'userProfile[password]',
}, (email, password, done) => {
  UserProfiles.findOne({ emails: {$elemMatch: { email: email}}})
    .then((userProfile) => {
      if(!userProfile || !userProfile.validatePassword(password)) {
        return done(null, false, { errors: { 'email or password': 'is invalid' } });
      }

      return done(null, userProfile);
    }).catch(done);
}));
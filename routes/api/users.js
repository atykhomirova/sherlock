const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const UserProfiles = mongoose.model('UserProfiles');

//POST new user route (optional, everyone has access)
router.post('/', auth.optional, (req, res, next) => {
  const { body: { userProfile } } = req;

  if(!userProfile.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!userProfile.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  const finalUser = new UserProfiles(userProfile);

  finalUser.setPassword(userProfile.password);
  finalUser.setEmail(userProfile.email);

  return finalUser.save()
    .then(() => res.json({ userProfile: finalUser.toAuthJSON() }));
});

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
  const { body: { userProfile } } = req;

  if(!userProfile.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!userProfile.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return next(err);
    }

    if(passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();

      return res.json({ userProfile: user.toAuthJSON() });
    }

    return status(400).info;
  })(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return UserProfiles.findById(id)
    .then((userProfile) => {
      if(!userProfile) {
        return res.sendStatus(400);
      }

      return res.json({ userProfiles: userProfile.toAuthJSON() });
    });
});

module.exports = router;
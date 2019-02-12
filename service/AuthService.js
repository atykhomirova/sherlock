const passport = require('passport');

function loginUser(req, res, next){
    const {body: {userProfile}} = req;

    if (!userProfile.login) {
        return res.status(401).json({
            errors: {
                code: 1408,
                message: 'Login is empty'
            }
        });
    }

    if (!userProfile.password) {
        return res.status(401).json({
            errors: {
                code: 1407,
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

        return res.status(401).json({
            errors: {
                code: 1403,
                message: 'Password and login did not match',
            },
        });
    })(req, res, next);
};

module.exports = {
    loginUser: loginUser
};
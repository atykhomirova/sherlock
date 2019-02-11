function SendService (appRoot) {
    this._init(appRoot);
}

SendService.prototype._init = function (appRoot) {
    this.name = 'sendService';
    this.nodemailer = require("nodemailer");
    this.config = require('../config.json');
    require('../lib/service.js').init(this, {
        config: this.config,
        models: ['UserProfiles'],
        libs: ['log', 'db', 'utils']
    });
    this.smtpTransport = this.nodemailer.createTransport({
        service: this.config.smtp.service,
        auth: {
            user:  this.config.smtp.auth.user,
            pass:  this.config.smtp.auth.pass
        }
    });
};

SendService.prototype.sendConfirmEmail = function (id, email, token) {
    var mailOptions, link;
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

module.exports = SendService;
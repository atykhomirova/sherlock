const nodemailer = require("nodemailer");

const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "sherlockapi@gmail.com",
        pass: "CyberSherlock#19"
    }
});

var mailOptions, link;

class SendService {
    sendConfirmEmail(id, email, token){
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
}

module.exports = SendService;
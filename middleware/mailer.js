const nodemailer = require('nodemailer');

const mailer = (email, verificationLink) => {
    const SENDER_MAIL = 'alihaiderawan1245@gmail.com';
    const MAIL_PASSWORD = 'tdptrezrgyijosbk';
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: SENDER_MAIL,
            pass: MAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: SENDER_MAIL,
        to: email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationLink}`,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                reject(new Error('Failed to send verification email. Please try again.'));
            } else {
                console.log('Email sent: ' + info.response);
                resolve('Verification email sent successfully.');
            }
        });
    });
};

module.exports = mailer;

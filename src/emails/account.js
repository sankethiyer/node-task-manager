const sgMail = require('@sendgrid/mail');
const sendGridAPIKey = '';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sankethsendgrid@yopmail.com',
        subject: 'Thank you for signing up',
        html: `Welcome <b> ${name} </b> to the Task App`
    });
}

const sendCancellationEmail = (email, name) => {    
    sgMail.send({
        to: email,
        from: 'sankethsendgrid@yopmail.com',
        subject: 'Sorry to see you go',
        html: `Goodbye <b> ${name} </b>`
    });
}
module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}
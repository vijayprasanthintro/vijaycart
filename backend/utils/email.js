const nodemailer = require('nodemailer')

// NOTE (Gmail SMTP): if SMTP_HOST is smtp.gmail.com, the account MUST have
// 2-Step Verification enabled and SMTP_USER/SMTP_PASS must be a 16-character
// Gmail "App Password" generated at https://myaccount.google.com/apppasswords
// — the regular Google account password will NOT work and fails with EAUTH.
// Port 465 needs secure:true; port 587 uses STARTTLS (secure defaults to
// false, which is correct for 587).
const sendEmail = async options => {
    const transport = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    const transporter = nodemailer.createTransport(transport);

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    }

   await transporter.sendMail(message)
}

module.exports = sendEmail
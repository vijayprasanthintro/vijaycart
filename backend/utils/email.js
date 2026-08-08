const axios = require('axios')
const logger = require('./logger')

// OTP email delivery via Brevo's transactional email HTTP API.
// Railway blocks outbound SMTP (ETIMEDOUT on 587/2525), but HTTPS (443)
// works, so we POST to https://api.brevo.com/v3/smtp/email instead of
// using an SMTP/nodemailer transporter.
//
// Authentication uses the env var BREVO_API_KEY sent as the "api-key"
// header. Paste the COMPLETE key from Brevo (Settings → SMTP & API →
// API keys) — it starts with "xkeysib-..." — verbatim, including that
// prefix.
const sendEmail = async options => {
    const url = 'https://api.brevo.com/v3/smtp/email';

    const payload = {
        sender: {
            name: process.env.SMTP_FROM_NAME,
            email: process.env.SMTP_FROM_EMAIL
        },
        to: [{ email: options.email }],
        subject: options.subject,
        textContent: options.message
    };

    try {
        await axios.post(url, payload, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        // axios errors expose .code (ECONNREFUSED / ETIMEDOUT / network) and
        // error.response.status/.data (Brevo's HTTP error such as 401 invalid
        // API key or 422 rejected recipient). Log all of it so the Railway
        // logs show the real cause, then rethrow so the caller responds 500.
        logger.error('Brevo email API request failed', {
            error: {
                message: error?.message,
                code: error?.code,
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                stack: error?.stack
            },
            brevo: {
                from: process.env.SMTP_FROM_EMAIL,
                apiKeySet: Boolean(process.env.BREVO_API_KEY)
            },
            to: options.email
        });
        throw error;
    }
}

module.exports = sendEmail

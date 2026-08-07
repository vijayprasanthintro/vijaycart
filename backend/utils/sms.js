// Provider-agnostic SMS transport.
//
// Select the provider with the SMS_PROVIDER env var and enable sending with
// SMS_ENABLED=true. Switching providers is purely a config change:
//
//   SMS_PROVIDER=twilio   -> Twilio REST API (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)
//   SMS_PROVIDER=msg91    -> MSG91 sendhttp API (MSG91_AUTH_KEY, MSG91_SENDER_ID, ...)
//   SMS_PROVIDER=fast2sms -> Fast2SMS bulkV2 API (FAST2SMS_API_KEY, FAST2SMS_SENDER_ID, ...)
//   SMS_PROVIDER=generic  -> any HTTP POST gateway (SMS_GENERIC_URL + field mapping)
//   SMS_PROVIDER=log      -> no provider; logs to stdout (default, safe for dev)
//
// sendSms() never throws — failures are returned as { success: false, reason }
// so a broken SMS setup can never take down an order.

//Normalizes a phone number into E.164 (+CC + national number). A bare 10-digit
//Indian number gets the SMS_DEFAULT_COUNTRY_CODE prefix (default 91).
function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return null;
    const cc = process.env.SMS_DEFAULT_COUNTRY_CODE || '91';
    if (digits.length === 10) return `+${cc}${digits}`;
    if (digits.length === 11 && digits.startsWith('0')) return `+${cc}${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith(cc)) return `+${digits}`;
    if (digits.length <= 15) return `+${digits}`;
    return null;
}

const log = (level, ...args) => {
    if (process.env.NODE_ENV !== 'production' || level === 'error') {
        console[level === 'error' ? 'error' : 'log']('[SMS]', ...args);
    }
};

async function postJson(url, payload, headers = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload)
    });
    return { status: res.status, body: await res.text() };
}

async function postForm(url, params, headers = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
        body: new URLSearchParams(params).toString()
    });
    return { status: res.status, body: await res.text() };
}

//Twilio REST API — https://www.twilio.com/docs/usage/api/message
async function sendViaTwilio(to, message) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (!accountSid || !authToken || !from) {
        return { success: false, reason: 'twilio-not-configured' };
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await postForm(url, { To: to, From: from, Body: message }, {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    });
    if (res.status >= 200 && res.status < 300) {
        let sid = null;
        try { sid = JSON.parse(res.body).sid; } catch { /* ignore */ }
        return { success: true, provider: 'twilio', sid };
    }
    return { success: false, reason: `twilio-http-${res.status}`, response: res.body };
}

//MSG91 (transactional route) — https://control.msg91.com/app/
async function sendViaMsg91(to, message) {
    const authkey = process.env.MSG91_AUTH_KEY;
    const sender = process.env.MSG91_SENDER_ID;
    if (!authkey || !sender) {
        return { success: false, reason: 'msg91-not-configured' };
    }
    const params = {
        authkey,
        mobiles: to,
        sender,
        route: process.env.MSG91_ROUTE || '4',
        message,
        country: process.env.SMS_DEFAULT_COUNTRY_CODE || '91'
    };
    if (process.env.MSG91_TEMPLATE_ID) params.template_id = process.env.MSG91_TEMPLATE_ID;
    if (process.env.MSG91_ENTITY_ID) params.entity_id = process.env.MSG91_ENTITY_ID;

    const res = await postForm('https://api.msg91.com/api/sendhttp.php', params);
    if (res.status >= 200 && res.status < 300 && !/error/i.test(res.body.slice(0, 120))) {
        return { success: true, provider: 'msg91', response: res.body };
    }
    return { success: false, reason: `msg91-http-${res.status}`, response: res.body };
}

//Fast2SMS — https://docs.fast2sms.com
async function sendViaFast2Sms(to, message) {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
        return { success: false, reason: 'fast2sms-not-configured' };
    }
    const res = await postJson(
        'https://www.fast2sms.com/dev/bulkV2',
        {
            route: process.env.FAST2SMS_ROUTE || 'qt',
            sender_id: process.env.FAST2SMS_SENDER_ID || '',
            message,
            language: 'english',
            numbers: to.replace(/\+/g, '')
        },
        { authorization: apiKey }
    );
    if (res.status >= 200 && res.status < 300) {
        try {
            const data = JSON.parse(res.body);
            if (data && data.return !== false) {
                return { success: true, provider: 'fast2sms', response: res.body };
            }
            return { success: false, reason: 'fast2sms-rejected', response: res.body };
        } catch { /* fallthrough */ }
        return { success: true, provider: 'fast2sms', response: res.body };
    }
    return { success: false, reason: `fast2sms-http-${res.status}`, response: res.body };
}

//Generic HTTP gateway — anything that accepts a JSON POST. Map your provider's
//field names with SMS_GENERIC_PHONE_FIELD / SMS_GENERIC_MESSAGE_FIELD and pass
//an auth header via SMS_GENERIC_API_KEY_HEADER / SMS_GENERIC_API_KEY.
async function sendViaGeneric(to, message) {
    const url = process.env.SMS_GENERIC_URL;
    if (!url) {
        return { success: false, reason: 'generic-not-configured' };
    }
    const payload = {
        [process.env.SMS_GENERIC_PHONE_FIELD || 'mobile']: to,
        [process.env.SMS_GENERIC_MESSAGE_FIELD || 'message']: message
    };
    if (process.env.SMS_GENERIC_SENDER_FIELD) {
        payload[process.env.SMS_GENERIC_SENDER_FIELD] = process.env.SMS_GENERIC_SENDER_ID || 'VIJAYCART';
    }
    try {
        const extra = JSON.parse(process.env.SMS_GENERIC_EXTRA_FIELDS || '{}');
        Object.assign(payload, extra);
    } catch (e) {
        log('error', 'Invalid SMS_GENERIC_EXTRA_FIELDS JSON, ignored.');
    }

    const headers = {};
    if (process.env.SMS_GENERIC_API_KEY_HEADER && process.env.SMS_GENERIC_API_KEY) {
        headers[process.env.SMS_GENERIC_API_KEY_HEADER] = process.env.SMS_GENERIC_API_KEY;
    }

    const res = await postJson(url, payload, headers);
    if (res.status >= 200 && res.status < 300) {
        return { success: true, provider: 'generic', response: res.body };
    }
    return { success: false, reason: `generic-http-${res.status}`, response: res.body };
}

async function sendSms({ to, message }) {
    const phone = normalizePhone(to);
    if (!phone) {
        log('warn', 'No valid phone number, skipping SMS.');
        return { success: false, reason: 'no-phone' };
    }

    if (process.env.SMS_ENABLED !== 'true') {
        //SMS is not enabled — log in development, stay silent in production.
        if (process.env.NODE_ENV !== 'production') {
            log('warn', `SMS_ENABLED=false, message not sent to ${phone}`);
            log('log', `\n${message}\n`);
        }
        return { success: true, skipped: true };
    }

    const provider = String(process.env.SMS_PROVIDER || 'log').toLowerCase();
    try {
        let result;
        switch (provider) {
            case 'twilio': result = await sendViaTwilio(phone, message); break;
            case 'msg91': result = await sendViaMsg91(phone, message); break;
            case 'fast2sms': result = await sendViaFast2Sms(phone, message); break;
            case 'generic': result = await sendViaGeneric(phone, message); break;
            case 'log':
                log('log', `\n[${provider}] to ${phone}\n${message}\n`);
                result = { success: true, provider: 'log', skipped: true };
                break;
            default:
                return { success: false, reason: `unknown-provider:${provider}` };
        }
        if (!result.success) {
            log('error', `${provider} send failed:`, result.reason, result.response || '');
        }
        return result;
    } catch (error) {
        log('error', `${provider} send threw:`, error.message);
        return { success: false, reason: 'exception', error: error.message };
    }
}

module.exports = sendSms;
module.exports.normalizePhone = normalizePhone;

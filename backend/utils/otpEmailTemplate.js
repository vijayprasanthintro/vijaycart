// Builds the transactional OTP verification email used by /api/v1/otp/request.
// Pure inline CSS + tables (no external templates or CDNs) so it renders
// consistently in Gmail / Outlook / Apple Mail and stays responsive on mobile.

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const buildOtpEmail = ({ name = '', otp = '', minutes = 10, year = new Date().getFullYear() }) => {
    const digits = String(otp).split('');
    const digitBoxes = digits
        .map(
            (digit) =>
                `<td align="center" style="padding:5px;">` +
                `<span style="display:inline-block;min-width:42px;min-height:46px;line-height:46px;text-align:center;background:#ffffff;border:1px solid #cfe0f6;border-radius:10px;font-size:26px;font-weight:700;color:#12263f;">${digit}</span>` +
                `</td>`
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>VijayCart — Verify Your Login</title>
<style type="text/css">
  @media only screen and (max-width: 600px) {
    .vc-email-pad { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f2f6fc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f6fc;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- ============ CARD ============ -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e4ecf7;border-radius:18px;">
          <tr><td height="4" bgcolor="#e9b41d" style="font-size:0;line-height:0;">&nbsp;</td></tr>
          <!-- Header: brand -->
          <tr>
            <td align="center" style="padding:30px 24px 6px;" class="vc-email-pad">
              <span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;letter-spacing:0.5px;color:#12263f;">Vijay<span style="color:#2874f0;">Cart</span></span>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7c8ba0;margin:6px 0 0;">Super-fast local delivery</p>
            </td>
          </tr>
          <!-- Heading -->
          <tr>
            <td align="center" style="padding:20px 24px 0;" class="vc-email-pad">
              <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:#12263f;margin:0;letter-spacing:-0.2px;">Verify Your Login</h1>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5b6b7f;margin:8px 0 0;line-height:1.6;">Hi ${escapeHtml(name) || 'there'},<br />Use the code below to securely continue signing in to your VijayCart account.</p>
            </td>
          </tr>
          <!-- OTP boxes -->
          <tr>
            <td align="center" style="padding:22px 24px 6px;" class="vc-email-pad">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>${digitBoxes}</tr>
              </table>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7c8ba0;margin:12px 0 0;">This code is valid for <strong style="color:#2874f0;">${minutes} minutes</strong>.</p>
            </td>
          </tr>
          <!-- Security note -->
          <tr>
            <td align="center" style="padding:16px 24px 4px;" class="vc-email-pad">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;background:#eef4fd;border:1px solid #dbe7f7;border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#12263f;margin:0 0 4px;">&#128274; Keep this code private</p>
                    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5b6b7f;margin:0;line-height:1.55;">Do not share this code with anyone. If you did not request this code, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Sign off -->
          <tr>
            <td align="center" style="padding:18px 24px 26px;" class="vc-email-pad">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#12263f;margin:0;">Happy Shopping!</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#2874f0;margin:2px 0 0;">Team VijayCart</p>
            </td>
          </tr>
        </table>
        <!-- ============ FOOTER ============ -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:640px;">
          <tr>
            <td align="center" style="padding:18px 24px 6px;">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a97a8;margin:0;">Fast Delivery &nbsp;&#8226;&nbsp; Secure Payments &nbsp;&#8226;&nbsp; Trusted Shopping</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a97a8;margin:8px 0 0;">&copy; ${year} VijayCart. All rights reserved.</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a3afbf;margin:8px 0 0;">This is an automated email. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = buildOtpEmail;
const sendToken = (user, statusCode, res) => {

    //Creating JWT Token
    const token = user.getJwtToken();

    // Cookie is the session credential. The flags must match the deployment:
    //   - dev (same-origin via the CRA proxy)  -> Lax, no Secure needed
    //   - prod (frontend & API on different origins, e.g. Vercel -> Railway)
    //     -> SameSite=None + Secure so the browser stores & resends it
    // Without SameSite=None the cookie is dropped on cross-site XHR calls,
    // which makes /myprofile fail with 401 and the app logs the user out
    // on every page refresh.
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDays = parseInt(process.env.COOKIE_EXPIRES_TIME, 10);
    const cookieMaxAge = (Number.isFinite(cookieDays) && cookieDays > 0 ? cookieDays : 7) * 24 * 60 * 60 * 1000;
    const options = {
        maxAge: cookieMaxAge,
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        path: '/'
    }

    console.log('COOKIE OPTIONS:', JSON.stringify(options));
    res.status(statusCode)
    .cookie('token', token, options)
    .json({
        success: true,
        token,
        user: user.password ? {...user.toObject(), password: undefined} : user
    })


}

module.exports = sendToken;
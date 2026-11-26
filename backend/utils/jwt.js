const sendToken = (user, statusCode, res) => {

    //Creating JWT Token
    const token = user.getJwtToken();

    // Cross-site deployments need SameSite=None + Secure or the cookie is dropped.
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

    res.status(statusCode)
    .cookie('token', token, options)
    .json({
        success: true,
        token,
        user: user.password ? {...user.toObject(), password: undefined} : user
    })


}

module.exports = sendToken;
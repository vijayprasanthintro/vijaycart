const logger = require('../utils/logger');

module.exports = (err, req, res, next) =>{
    err.statusCode  = err.statusCode || 500;

    const context = {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        user: req.user ? req.user.id : undefined
    };

    if (err.statusCode >= 500) {
        logger.error(err.message, { ...context, stack: err.stack, name: err.name, code: err.code });
    } else {
        logger.warn(err.message, context);
    }

    // CORS rejection from the cors middleware -> clean 403 JSON instead of a
    // bare 500 so the frontend can distinguish "origin not allowed" from a
    // genuine server failure.
    if (err.message === 'Not allowed by CORS') {
        err.statusCode = 403;
        err.message = 'Origin not allowed by CORS';
    }

    // Stale/invalid JWT -> 401 in every environment (jsonwebtoken names are
    // case-sensitive: JsonWebTokenError, TokenExpiredError, NotBeforeError).
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
        err.statusCode = 401;
    }

    if(process.env.NODE_ENV == 'development'){
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            stack: err.stack,
            error: err
        })
    }

    if(process.env.NODE_ENV == 'production'){
        let message = err.message;
        let error = new Error(message);

        if(err.name == "ValidationError") {
            message = Object.values(err.errors).map(value => value.message)
            error = new Error(message)
            err.statusCode = 400
        }

        if(err.name == 'CastError'){
            message = `Resource not found`;
            error = new Error(message)
            err.statusCode = 404
        }

        if(err.code == 11000) {
            let message = `Duplicate ${Object.keys(err.keyValue)} error`;
            error = new Error(message)
            err.statusCode = 400
        }

        // jsonwebtoken error names are case-sensitive: JsonWebTokenError,
        // TokenExpiredError, NotBeforeError. A stale cookie (e.g. after a
        // JWT_SECRET rotation on deploy) must produce a 401 the frontend can
        // treat as "logged out", NOT a 500 it would treat as a network error.
        if(err.name == 'JsonWebTokenError' || err.name == 'NotBeforeError') {
            let message = `JSON Web Token is invalid. Please login again`;
            error = new Error(message)
            err.statusCode = 401
        }

        if(err.name == 'TokenExpiredError') {
            let message = `JSON Web Token is expired. Please login again`;
            error = new Error(message)
            err.statusCode = 401
        }

        return res.status(err.statusCode).json({
            success: false,
            message: error.message || 'Internal Server Error',
        })
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
    })
}

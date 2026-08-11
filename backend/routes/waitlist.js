const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middlewares/authenticate');
const {
    validate,
    objectIdParam,
    waitlistRules,
    productIdParam
} = require('../middlewares/validate');
const {
    joinWaitlist,
    leaveWaitlist,
    waitlistStatus,
    myWaitlist
} = require('../controllers/waitlistController');

// Status/product routes must be declared before /:productId so the static
// paths are never swallowed by the param matcher.
router.route('/waitlist/mine').get(isAuthenticatedUser, myWaitlist);
router.route('/waitlist/status/:productId').get(isAuthenticatedUser, objectIdParam('productId'), validate, waitlistStatus);
router.route('/waitlist').post(isAuthenticatedUser, waitlistRules(), validate, joinWaitlist);
router.route('/waitlist/:productId').delete(isAuthenticatedUser, productIdParam(), validate, leaveWaitlist);

module.exports = router;

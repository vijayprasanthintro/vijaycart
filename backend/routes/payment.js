const express = require('express');
const { processPayment, sendStripeApi, getWallet, payWithWallet } = require('../controllers/paymentController');
const { isAuthenticatedUser } = require('../middlewares/authenticate');
const router = express.Router();

router.route('/payment/process').post( isAuthenticatedUser, processPayment);
router.route('/payment/wallet').post( isAuthenticatedUser, payWithWallet);
router.route('/stripeapi').get( isAuthenticatedUser, sendStripeApi);
router.route('/wallet').get( isAuthenticatedUser, getWallet);


module.exports = router;
const express = require('express');
const { lookupPincode, checkCodAvailability } = require('../controllers/pincodeController');
const router = express.Router();

router.route('/pincode/:code/cod').get(checkCodAvailability);
router.route('/pincode/:code').get(lookupPincode);

module.exports = router;

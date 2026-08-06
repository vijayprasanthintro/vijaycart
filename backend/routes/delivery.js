const express = require('express');
const { myDeliveryOrders, todayDeliveryOrders, updateDeliveryStatus, deliveryHistory, getDeliveryBoys, assignOrder, createDeliveryBoy } = require('../controllers/deliveryController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

//Delivery Boy Routes
router.route('/delivery/orders').get(isAuthenticatedUser, authorizeRoles('deliveryboy'), myDeliveryOrders);
router.route('/delivery/orders/today').get(isAuthenticatedUser, authorizeRoles('deliveryboy'), todayDeliveryOrders);
router.route('/delivery/order/:id/status').put(isAuthenticatedUser, authorizeRoles('deliveryboy'), updateDeliveryStatus);
router.route('/delivery/history').get(isAuthenticatedUser, authorizeRoles('deliveryboy'), deliveryHistory);

//Admin Routes
router.route('/admin/deliveryboys').get(isAuthenticatedUser, authorizeRoles('admin'), getDeliveryBoys);
router.route('/admin/order/:id/assign').put(isAuthenticatedUser, authorizeRoles('admin'), assignOrder);

module.exports = router;

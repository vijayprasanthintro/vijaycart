const express = require('express');
const { myDeliveryOrders, todayDeliveryOrders, updateDeliveryStatus, deliveryHistory, getDeliveryBoys, createDeliveryBoy, toggleAvailability, assignOrder } = require('../controllers/deliveryController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const {
    validate,
    objectIdParam,
    deliveryBoyRules,
    assignOrderRules,
    deliveryStatusRules
} = require('../middlewares/validate');

//Delivery Boy Routes
router.route('/delivery/orders').get(isAuthenticatedUser, authorizeRoles('deliveryboy'), myDeliveryOrders);
router.route('/delivery/orders/today').get(isAuthenticatedUser, authorizeRoles('deliveryboy'), todayDeliveryOrders);
router.route('/delivery/order/:id/status').put(isAuthenticatedUser, authorizeRoles('deliveryboy'), objectIdParam('id'), deliveryStatusRules(), validate, updateDeliveryStatus);
router.route('/delivery/history').get(isAuthenticatedUser, authorizeRoles('deliveryboy'), deliveryHistory);

//Admin Routes
router.route('/admin/deliveryboys').get(isAuthenticatedUser, authorizeRoles('admin'), getDeliveryBoys);
router.route('/admin/deliveryboy').post(isAuthenticatedUser, authorizeRoles('admin'), deliveryBoyRules(), validate, createDeliveryBoy);
router.route('/admin/deliveryboy/:id/availability').put(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), validate, toggleAvailability);
router.route('/admin/order/:id/assign').put(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), assignOrderRules(), validate, assignOrder);

module.exports = router;

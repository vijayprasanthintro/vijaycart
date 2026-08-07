const express = require('express');
const { newOrder, getSingleOrder, myOrders, orders, updateOrder, deleteOrder, cancelOrder, returnOrder } = require('../controllers/orderController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');
const { validate, objectIdParam, orderRules, updateOrderStatusRules, returnOrderRules } = require('../middlewares/validate');

router.route('/order/new').post(isAuthenticatedUser, orderRules(), validate, newOrder);
router.route('/order/cancel/:id').put(isAuthenticatedUser, objectIdParam('id'), validate, cancelOrder);
router.route('/order/return/:id').put(isAuthenticatedUser, objectIdParam('id'), returnOrderRules(), validate, returnOrder);
router.route('/order/:id').get(isAuthenticatedUser, objectIdParam('id'), validate, getSingleOrder);
router.route('/myorders').get(isAuthenticatedUser,myOrders);

//Admin Routes
router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin'), orders)
router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), updateOrderStatusRules(), validate, updateOrder)
                        .delete(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), validate, deleteOrder)

module.exports = router;
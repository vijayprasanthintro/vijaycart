const express = require('express');
const { getProducts, newProduct, getSingleProduct, updateProduct, deleteProduct, createReview, getReviews, deleteReview, getAdminProducts, productsHealth } = require('../controllers/productController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const multer = require('multer');
const path = require('path')
const {
    validate,
    objectIdParam,
    productRules,
    reviewRules,
    reviewsQueryRules,
    deleteReviewRules
} = require('../middlewares/validate');

const upload = multer({storage: multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join( __dirname,'..' , 'uploads/product' ) )
    },
    filename: function(req, file, cb ) {
        cb(null, file.originalname)
    }
}) })


router.route('/products').get( getProducts);
router.route('/products/health').get(productsHealth);
router.route('/product/:id')
                            .get(objectIdParam('id'), validate, getSingleProduct);
            
        
router.route('/review').put(isAuthenticatedUser, reviewRules(), validate, createReview)
                      


//Admin routes
router.route('/admin/product/new').post(isAuthenticatedUser, authorizeRoles('admin'), upload.array('images'), productRules(), validate, newProduct);
router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.route('/admin/product/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), validate, deleteProduct);
router.route('/admin/product/:id').put(isAuthenticatedUser, authorizeRoles('admin'),upload.array('images'), productRules(), validate, updateProduct);
router.route('/admin/reviews').get(isAuthenticatedUser, authorizeRoles('admin'), reviewsQueryRules(), validate, getReviews)
router.route('/admin/review').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteReviewRules(), validate, deleteReview)
module.exports = router;
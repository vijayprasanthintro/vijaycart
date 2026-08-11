const express = require('express');
const { getProducts, newProduct, getSingleProduct, updateProduct, deleteProduct, createReview, getReviews, getAllReviews, deleteReview, getAdminProducts, productsHealth, bulkDeleteProducts, bulkUpdateStock } = require('../controllers/productController');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const multer = require('multer');
const fs = require('fs');
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

//Review photos are stored under /uploads/review so customer content is never
//mixed with admin product images. The folder is created on demand so a fresh
//checkout never crashes the first upload.
const reviewUploadDir = path.join(__dirname, '..', 'uploads', 'review');
fs.mkdirSync(reviewUploadDir, { recursive: true });

//Random, collision-proof names so two customers uploading "photo.jpg" never
//overwrite each other, and only image types are accepted.
const REVIEW_IMAGE_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const reviewUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, reviewUploadDir)
        },
        filename: function(req, file, cb) {
            const ext = REVIEW_IMAGE_EXT[file.mimetype] || '.jpg';
            cb(null, `review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`)
        },
        limits: { fileSize: 5 * 1024 * 1024 }
    }),
    fileFilter: function(req, file, cb) {
        if (REVIEW_IMAGE_EXT[file.mimetype]) return cb(null, true);
        cb(new Error('Only JPG, PNG or WebP images are allowed for reviews'));
    }
})


router.route('/products').get( getProducts);
router.route('/products/health').get(productsHealth);
router.route('/product/:id')
                            .get(objectIdParam('id'), validate, getSingleProduct);
            
        
router.route('/review').put(isAuthenticatedUser, reviewUpload.array('reviewImages', 5), reviewRules(), validate, createReview)
                      


//Admin routes
router.route('/admin/product/new').post(isAuthenticatedUser, authorizeRoles('admin'), upload.array('images'), productRules(), validate, newProduct);
router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.route('/admin/products/bulk-delete').post(isAuthenticatedUser, authorizeRoles('admin'), bulkDeleteProducts);
router.route('/admin/products/bulk-stock').put(isAuthenticatedUser, authorizeRoles('admin'), bulkUpdateStock);
router.route('/admin/product/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), validate, deleteProduct);
router.route('/admin/product/:id').put(isAuthenticatedUser, authorizeRoles('admin'),upload.array('images'), productRules(), validate, updateProduct);
router.route('/admin/reviews').get(isAuthenticatedUser, authorizeRoles('admin'), reviewsQueryRules(), validate, getReviews)
router.route('/admin/reviews/all').get(isAuthenticatedUser, authorizeRoles('admin'), getAllReviews)
router.route('/admin/review').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteReviewRules(), validate, deleteReview)
module.exports = router;
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures = require('../utils/apiFeatures');
const cache = require('../utils/cache');

// Fields the listing cards actually render. Excluding `description` and
// `reviews` shrinks the payload a lot for list responses.
const LIST_FIELDS = 'name price mrp discount brand images ratings stock seller numOfReviews category createdAt warranty';

const MAX_LIMIT = 200;

//Multipart forms send array-of-object fields (specifications, features) as
//JSON strings. Restore them to real arrays before they reach the schema.
function parseJsonField(value) {
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return Array.isArray(value) ? value : [];
}

// Diagnostic health check - /api/v1/products/health
// Verifies the backend is up, MongoDB is reachable and the product query runs.
// Returns counts only — no sensitive database information.
exports.productsHealth = catchAsyncError(async (req, res, next) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const state = states[mongoose.connection.readyState] || 'unknown';
    let productCount = null;
    let inStockCount = null;
    if (mongoose.connection.readyState === 1) {
        productCount = await Product.countDocuments();
        inStockCount = await Product.countDocuments({ stock: { $gt: 0 } });
    }
    res.status(200).json({
        success: true,
        message: 'Products service is running',
        mongo: state,
        productCount,
        inStockCount,
        time: new Date().toISOString()
    });
});

//Get Products - /api/v1/products
exports.getProducts = catchAsyncError(async (req, res, next)=>{
    const cacheKey = `products:${req.originalUrl}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.status(200).json(cached);
    }

    const resPerPage = 8;
    const limit = Math.min(Number(req.query.limit) || resPerPage, MAX_LIMIT);
    const page = Number(req.query.page) || 1;
    const skip = limit * (page - 1);

    const buildQuery = () => new APIFeatures(
        Product.find().select(LIST_FIELDS).lean(),
        req.query
    ).search().filter();

    const filteredProductsCount = await buildQuery().query.clone().countDocuments();
    const products = await buildQuery().query.limit(limit).skip(skip);

    const body = {
        success : true,
        count: filteredProductsCount,
        resPerPage,
        products
    };

    cache.set(cacheKey, body, 30 * 1000);
    res.status(200).json(body);
})

//Create Product - /api/v1/product/new
exports.newProduct = catchAsyncError(async (req, res, next)=>{
    let images = []
    let BASE_URL = process.env.BACKEND_URL;
    if(process.env.NODE_ENV === "production"){
        BASE_URL = `${req.protocol}://${req.get('host')}`
    }
    
    if(req.files.length > 0) {
        req.files.forEach( file => {
            let url = `${BASE_URL}/uploads/product/${file.originalname}`;
            images.push({ image: url })
        })
    }

    req.body.images = images;

    if (req.body.specifications !== undefined) {
        req.body.specifications = parseJsonField(req.body.specifications);
    }
    if (req.body.features !== undefined) {
        req.body.features = parseJsonField(req.body.features);
    }
    if (req.body.highlights !== undefined) {
        req.body.highlights = parseJsonField(req.body.highlights);
    }

    req.body.user = req.user.id;
    const product = await Product.create(req.body);
    cache.flush();
    res.status(201).json({
        success: true,
        product
    })
});

//Get Single Product - api/v1/product/:id
exports.getSingleProduct = catchAsyncError(async(req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new ErrorHandler('Product not found', 404));
    }
    const cacheKey = `product:${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.status(200).json({ success: true, product: cached });
    }

    const product = await Product.findById(req.params.id)
        .populate('reviews.user','name email')
        .lean();

    if(!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    cache.set(cacheKey, product, 60 * 1000);

    res.status(200).json({
        success: true,
        product
    })
})

//Update Product - api/v1/product/:id
exports.updateProduct = catchAsyncError(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    //uploading images
    let images = []

    //if images not cleared we keep existing images
    if(req.body.imagesCleared === 'false' ) {
        images = product.images;
    }
    let BASE_URL = process.env.BACKEND_URL;
    if(process.env.NODE_ENV === "production"){
        BASE_URL = `${req.protocol}://${req.get('host')}`
    }

    if(req.files.length > 0) {
        req.files.forEach( file => {
            let url = `${BASE_URL}/uploads/product/${file.originalname}`;
            images.push({ image: url })
        })
    }


    req.body.images = images;

    if (req.body.specifications !== undefined) {
        req.body.specifications = parseJsonField(req.body.specifications);
    }
    if (req.body.features !== undefined) {
        req.body.features = parseJsonField(req.body.features);
    }
    if (req.body.highlights !== undefined) {
        req.body.highlights = parseJsonField(req.body.highlights);
    }
    
    if(!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    cache.flush();

    res.status(200).json({
        success: true,
        product
    })

})

//Delete Product - api/v1/product/:id
exports.deleteProduct = catchAsyncError(async (req, res, next) =>{
    const product = await Product.findById(req.params.id);

    if(!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    await product.deleteOne();
    cache.flush();

    res.status(200).json({
        success: true,
        message: "Product Deleted!"
    })

})

//Create Review - api/v1/review
//A review can only be posted after the customer has received the product
//(exact 'Delivered' status, never 'Out for Delivery'). This gate is enforced
//server-side so the UI can not be bypassed, and it also links each review to a
//real purchase.
exports.createReview = catchAsyncError(async (req, res, next) =>{
    const { productId, rating, comment, title } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler(`Product not found with id: ${productId}`, 404))
    }

    //Only a customer who actually received this product can review it.
    const deliveredOrder = await Order.findOne({
        user: req.user.id,
        orderStatus: 'Delivered',
        'orderItems.product': productId
    });
    if (!deliveredOrder) {
        return next(new ErrorHandler('You can review this product only after it has been delivered to you.', 403))
    }

    //Uploaded review photos -> absolute URLs under /uploads/review/.
    //file.filename matches the collision-proof name stored by multer.
    let reviewImages = [];
    if (req.files && req.files.length) {
        let BASE_URL = process.env.BACKEND_URL;
        if (process.env.NODE_ENV === "production") {
            BASE_URL = `${req.protocol}://${req.get('host')}`
        }
        reviewImages = req.files.map(file => ({ image: `${BASE_URL}/uploads/review/${file.filename}` }));
    }

    const review = {
        user: req.user.id,
        userName: req.user.name,
        rating: Number(rating),
        title: title ? String(title).trim() : undefined,
        comment,
        images: reviewImages
    }

    //finding user review exists
    const isReviewed = product.reviews.find(review => {
       return review.user.toString() == req.user.id.toString()
    })

    if(isReviewed){
        //updating the  review
        product.reviews.forEach(review => {
            if(review.user.toString() == req.user.id.toString()){
                review.comment = comment
                review.rating = rating
                if (typeof title === 'string') review.title = String(title).trim()
                if (reviewImages.length) review.images = reviewImages
            }

        })

    }else{
        //creating the review
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }
    //find the average of the product reviews
    product.ratings = product.reviews.reduce((acc, review) => {
        return Number(review.rating) + acc;
    }, 0) / product.reviews.length;
    product.ratings = isNaN(product.ratings)?0:product.ratings;

    await product.save({validateBeforeSave: false});
    cache.flush();

    res.status(200).json({
        success: true
    })


})

//Get Reviews - api/v1/reviews?id={productId}
exports.getReviews = catchAsyncError(async (req, res, next) =>{
    const product = await Product.findById(req.query.id).populate('reviews.user','name email');

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

//Admin: Get all reviews across every product - /api/v1/admin/reviews/all
//Returns each review with its product (name + image) so the admin panel can
//render a single, complete reviews table.
exports.getAllReviews = catchAsyncError(async (req, res, next) => {
    const products = await Product.find({}).select('name images ratings numOfReviews reviews');
    const reviews = [];

    products.forEach(product => {
        (product.reviews || []).forEach(review => {
            reviews.push({
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
                user: review.user,
                userName: review.userName,
                createdAt: review.createdAt,
                product: {
                    _id: product._id,
                    name: product.name,
                    image: (product.images && product.images[0]) ? product.images[0].image : ''
                }
            });
        });
    });

    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.status(200).json({
        success: true,
        total: reviews.length,
        reviews
    });
})

//Delete Review - api/v1/review
exports.deleteReview = catchAsyncError(async (req, res, next) =>{
    const product = await Product.findById(req.query.productId);
    
    //filtering the reviews which does match the deleting review id
    const reviews = product.reviews.filter(review => {
       return review._id.toString() !== req.query.id.toString()
    });
    //number of reviews 
    const numOfReviews = reviews.length;

    //finding the average with the filtered reviews
    let ratings = reviews.reduce((acc, review) => {
        return Number(review.rating) + acc;
    }, 0) / reviews.length;
    ratings = isNaN(ratings)?0:ratings;

    //save the product document
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        numOfReviews,
        ratings
    })
    cache.flush();
    res.status(200).json({
        success: true
    })


});

// get admin products  - api/v1/admin/products
exports.getAdminProducts = catchAsyncError(async (req, res, next) =>{
    const products = await Product.find();
    res.status(200).send({
        success: true,
        products
    })
});

//Admin: Bulk delete products - POST /api/v1/admin/products/bulk-delete
//Removes every product id in the payload. Invalid/missing ids are ignored so
//a stale row can never take the whole batch down.
exports.bulkDeleteProducts = catchAsyncError(async (req, res, next) => {
    const raw = Array.isArray(req.body.ids) ? req.body.ids : [];
    const ids = raw
        .map(id => String(id).trim())
        .filter(id => mongoose.isValidObjectId(id));

    if (ids.length === 0) {
        return next(new ErrorHandler('Select at least one product to delete', 400));
    }

    const result = await Product.deleteMany({ _id: { $in: ids } });
    cache.flush();

    res.status(200).json({
        success: true,
        deleted: result.deletedCount,
        requested: ids.length
    });
});

//Admin: Bulk update stock - PUT /api/v1/admin/products/bulk-stock
//Payload: { updates: [{ id, stock }] }. Lets the admin set stock levels for
//many products in one request (used by the bulk bar on the products table).
exports.bulkUpdateStock = catchAsyncError(async (req, res, next) => {
    const raw = Array.isArray(req.body.updates) ? req.body.updates : [];
    const updates = raw
        .filter(u => u && mongoose.isValidObjectId(String(u.id).trim()))
        .map(u => ({ id: String(u.id).trim(), stock: Math.max(0, Math.floor(Number(u.stock) || 0)) }));

    if (updates.length === 0) {
        return next(new ErrorHandler('Provide at least one product with a stock value', 400));
    }

    await Promise.all(updates.map(u => Product.updateOne({ _id: u.id }, { $set: { stock: u.stock } })));
    cache.flush();

    res.status(200).json({
        success: true,
        updated: updates.length
    });
});
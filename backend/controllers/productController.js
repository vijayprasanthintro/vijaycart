const mongoose = require('mongoose');
const Product = require('../models/productModel');
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

    await product.remove();
    cache.flush();

    res.status(200).json({
        success: true,
        message: "Product Deleted!"
    })

})

//Create Review - api/v1/review
exports.createReview = catchAsyncError(async (req, res, next) =>{
    const  { productId, rating, comment } = req.body;

    const review = {
        user : req.user.id,
        rating,
        comment
    }

    const product = await Product.findById(productId);
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
            }

        })

    }else{
        //creating the review
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }
    //find the average of the product reviews
    product.ratings = product.reviews.reduce((acc, review) => {
        return review.rating + acc;
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
        return review.rating + acc;
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
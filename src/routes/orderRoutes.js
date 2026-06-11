const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/images/returns');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ cho phép tải lên hình ảnh.'));
    }
});

// Public route: Lấy danh sách đánh giá của sản phẩm (Ai cũng xem được)
router.get('/reviews/:productId', orderController.getReviews);

// Yêu cầu đăng nhập cho tất cả các route bên dưới
router.use(authMiddleware.isLoggedIn);

router.get('/checkout', orderController.showCheckout);
router.post('/checkout', orderController.placeOrder);
router.post('/apply-coupon', orderController.applyCoupon);
router.get('/my-orders', orderController.myOrders);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/retry-payment', orderController.retryPayment);
router.post('/review', orderController.submitReview);

router.post('/:id/return', upload.array('images', 5), orderController.returnOrder);

// Payment callbacks (không cần đăng nhập)
router.get('/vnpay-return', (req, res, next) => next(), orderController.vnpayReturn);
router.get('/momo-return', (req, res, next) => next(), orderController.momoReturn);

router.get('/:id', orderController.orderDetail);

module.exports = router;

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ cho phép tải lên hình ảnh.'));
    }
});

const sharp = require('sharp');
const ImageStore = require('../models/ImageStore');

const processReturnImages = async (req, res, next) => {
    try {
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
                const buffer = await sharp(file.buffer)
                    .resize({ width: 800, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();
                
                await ImageStore.findOneAndUpdate(
                    { filename }, 
                    { data: buffer, contentType: 'image/webp' }, 
                    { upsert: true }
                ).catch(err => console.error('Lỗi lưu ảnh trả hàng DB:', err));
                
                const dir = path.join(__dirname, '../../public/images/returns');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                await fs.promises.writeFile(path.join(dir, filename), buffer).catch(() => {});
                
                file.filename = filename;
            }
        }
        next();
    } catch (err) {
        next(err);
    }
};

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

router.post('/:id/return', upload.array('images', 5), processReturnImages, orderController.returnOrder);

// Payment callbacks (không cần đăng nhập)
router.get('/vnpay-return', (req, res, next) => next(), orderController.vnpayReturn);
router.get('/momo-return', (req, res, next) => next(), orderController.momoReturn);

router.get('/:id', orderController.orderDetail);

module.exports = router;

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.isLoggedIn);

router.get('/checkout', orderController.showCheckout);
router.post('/checkout', orderController.placeOrder);
router.post('/apply-coupon', orderController.applyCoupon);
router.get('/my-orders', orderController.myOrders);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/retry-payment', orderController.retryPayment);
router.post('/review', orderController.submitReview);
router.get('/reviews/:productId', orderController.getReviews);

// Payment callbacks (không cần đăng nhập)
router.get('/vnpay-return', (req, res, next) => next(), orderController.vnpayReturn);
router.get('/momo-return', (req, res, next) => next(), orderController.momoReturn);

router.get('/:id', orderController.orderDetail);

module.exports = router;

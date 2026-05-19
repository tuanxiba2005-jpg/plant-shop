const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.isLoggedIn);

router.get('/checkout', orderController.showCheckout);
router.post('/checkout', orderController.placeOrder);
router.get('/my-orders', orderController.myOrders);
router.post('/:id/cancel', orderController.cancelOrder);
router.get('/:id', orderController.orderDetail);

module.exports = router;
const express = require('express');
const router = express.Router();

router.get('/return-policy', (req, res) => {
    res.render('pages/support/return-policy', { title: 'Chính sách đổi trả - Tuan\'s Green' });
});

router.get('/order-guide', (req, res) => {
    res.render('pages/support/order-guide', { title: 'Hướng dẫn đặt hàng - Tuan\'s Green' });
});

router.get('/shipping-policy', (req, res) => {
    res.render('pages/support/shipping-policy', { title: 'Chính sách vận chuyển - Tuan\'s Green' });
});

router.get('/faq', (req, res) => {
    res.render('pages/support/faq', { title: 'Câu hỏi thường gặp - Tuan\'s Green' });
});

router.get('/contact', (req, res) => {
    res.render('pages/support/contact', { title: 'Liên hệ - Tuan\'s Green' });
});

module.exports = router;

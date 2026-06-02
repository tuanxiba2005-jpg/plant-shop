const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');
const auth = require('../middlewares/authMiddleware');

const wishlistModel = new Wishlist();

router.use(auth.isLoggedIn);

// GET /wishlist — trang wishlist
router.get('/', async (req, res) => {
    try {
        const items = await wishlistModel.getByUser(req.session.user.id);
        res.render('user/wishlist', { title: 'Yêu thích', items });
    } catch (err) {
        res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
    }
});

// POST /wishlist/toggle — toggle sản phẩm
router.post('/toggle', async (req, res) => {
    try {
        const { product_id } = req.body;
        const result = await wishlistModel.toggle(req.session.user.id, product_id);
        res.json({ success: true, action: result.action });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// GET /wishlist/check/:productId — kiểm tra đã wishlist chưa
router.get('/check/:productId', async (req, res) => {
    try {
        const wishlisted = await wishlistModel.isWishlisted(req.session.user.id, req.params.productId);
        res.json({ wishlisted });
    } catch (err) {
        res.json({ wishlisted: false });
    }
});

module.exports = router;

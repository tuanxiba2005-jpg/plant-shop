const Cart = require('../models/Cart');

class CartController {
    constructor() {
        this.cartModel = new Cart();
        // Bind tất cả methods để giữ context
        this.index = this.index.bind(this);
        this.add = this.add.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    async index(req, res) {
        try {
            const items = await this.cartModel.getCartItems(req.session.user.id);
            const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
            res.render('cart/index', { title: 'Giỏ hàng', items, total });
        } catch (err) {
            console.error('Cart error:', err.message);
            res.status(500).render('error', {
                title: 'Lỗi',
                status: 500,
                message: err.message
            });
        }
    }

    async add(req, res) {
        try {
            const { productId, quantity } = req.body;
            await this.cartModel.addItem(req.session.user.id, productId, parseInt(quantity) || 1);
            const count = await this.cartModel.getCartCount(req.session.user.id);
            req.session.cartCount = count;
            res.json({ success: true, cartCount: count });
        } catch (err) {
            console.error('Cart add error:', err.message);
            res.json({ success: false, message: err.message });
        }
    }

    async update(req, res) {
        try {
            const { productId, quantity } = req.body;
            await this.cartModel.updateItem(req.session.user.id, productId, parseInt(quantity));
            const count = await this.cartModel.getCartCount(req.session.user.id);
            req.session.cartCount = count;
            res.json({ success: true, cartCount: count });
        } catch (err) {
            console.error('Cart update error:', err.message);
            res.json({ success: false, message: err.message });
        }
    }

    async remove(req, res) {
        try {
            await this.cartModel.removeItem(req.session.user.id, req.params.productId);
            const count = await this.cartModel.getCartCount(req.session.user.id);
            req.session.cartCount = count;
            res.json({ success: true, cartCount: count });
        } catch (err) {
            console.error('Cart remove error:', err.message);
            res.json({ success: false, message: err.message });
        }
    }
}

module.exports = new CartController();
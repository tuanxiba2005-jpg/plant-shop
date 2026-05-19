const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

class OrderController {
    constructor() {
        this.orderModel = new Order();
        this.cartModel = new Cart();
        this.userModel = new User();
        this.showCheckout = this.showCheckout.bind(this);
        this.placeOrder = this.placeOrder.bind(this);
        this.myOrders = this.myOrders.bind(this);
        this.orderDetail = this.orderDetail.bind(this);
        this.cancelOrder = this.cancelOrder.bind(this);
    }

    async showCheckout(req, res) {
        try {
            const items = await this.cartModel.getCartItems(req.session.user.id);
            if (items.length === 0) return res.redirect('/cart');
            const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
            const user = await this.userModel.findById(req.session.user.id);
            res.render('orders/checkout', { title: 'Đặt hàng', items, total, user });
        } catch (err) {
            console.error('Checkout error:', err);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async placeOrder(req, res) {
        try {
            const { address, phone, note, payment_method } = req.body;

            if (!address || !phone) {
                const items = await this.cartModel.getCartItems(req.session.user.id);
                const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
                const user = await this.userModel.findById(req.session.user.id);
                return res.render('orders/checkout', {
                    title: 'Đặt hàng', items, total, user,
                    error: 'Vui lòng điền đầy đủ địa chỉ và số điện thoại'
                });
            }

            const items = await this.cartModel.getCartItems(req.session.user.id);
            if (items.length === 0) return res.redirect('/cart');

            const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
            const orderId = await this.orderModel.createOrder(
                req.session.user.id, address, phone, note,
                payment_method || 'cod', items, total
            );
            await this.cartModel.clearCart(req.session.user.id);
            req.session.cartCount = 0;
            res.redirect(`/orders/${orderId}?success=1`);
        } catch (err) {
            console.error('Place order error:', err);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async myOrders(req, res) {
        try {
            const orders = await this.orderModel.getOrdersByUser(req.session.user.id);
            res.render('orders/list', { title: 'Đơn hàng của tôi', orders });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async orderDetail(req, res) {
        try {
            const order = await this.orderModel.getOrderDetail(req.params.id);
            if (!order || order.user_id.toString() !== req.session.user.id.toString()) {
                return res.status(403).render('error', {
                    title: 'Lỗi', status: 403, message: 'Không có quyền truy cập'
                });
            }
            res.render('orders/detail', {
                title: `Đơn hàng #${order._id}`,
                order,
                success: req.query.success || null
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async cancelOrder(req, res) {
        try {
            const result = await this.orderModel.cancelOrder(
                req.params.id, req.session.user.id
            );
            res.json(result);
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }
}

module.exports = new OrderController();
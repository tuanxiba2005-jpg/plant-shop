const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { createVNPayUrl, verifyVNPay, createMoMoUrl, verifyMoMo } = require('../services/paymentService');
const { sendOrderConfirmation } = require('../services/emailService');

class OrderController {
    constructor() {
        this.orderModel = new Order();
        this.cartModel = new Cart();
        this.userModel = new User();
        this.couponModel = new Coupon();
        this.reviewModel = new Review();

        this.showCheckout = this.showCheckout.bind(this);
        this.placeOrder = this.placeOrder.bind(this);
        this.myOrders = this.myOrders.bind(this);
        this.orderDetail = this.orderDetail.bind(this);
        this.cancelOrder = this.cancelOrder.bind(this);
        this.applyCoupon = this.applyCoupon.bind(this);
        this.vnpayReturn = this.vnpayReturn.bind(this);
        this.momoReturn = this.momoReturn.bind(this);
        this.myOrders = this.myOrders.bind(this);
        this.returnOrder = this.returnOrder.bind(this);
        this.submitReview = this.submitReview.bind(this);
        this.retryPayment = this.retryPayment.bind(this);
        this.getReviews = this.getReviews.bind(this);
    }

    async showCheckout(req, res) {
        try {
            const items = await this.cartModel.getCartItems(req.session.user.id);
            if (items.length === 0) return res.redirect('/cart');
            const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
            const user = await this.userModel.findById(req.session.user.id);
            
            const errorType = req.query.error;
            let errorMsg = null;
            if (errorType === 'payment_not_configured') errorMsg = 'Hệ thống đang bảo trì cổng thanh toán. Vui lòng chọn Thanh toán khi nhận hàng (COD)!';
            else if (errorType === 'momo_failed') errorMsg = 'Thanh toán MoMo thất bại hoặc bị hủy.';

            res.render('orders/checkout', { title: 'Đặt hàng', items, total, user, error: errorMsg });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    // API: kiểm tra coupon
    async applyCoupon(req, res) {
        try {
            const { code, total } = req.body;
            const result = await this.couponModel.apply(code, parseFloat(total));
            res.json(result);
        } catch (err) {
            res.json({ valid: false, message: 'Lỗi server' });
        }
    }

    async placeOrder(req, res) {
        try {
            const { address, phone, note, payment_method, coupon_code } = req.body;
            console.log('========== PLACE ORDER DEBUG ==========');
            console.log('req.body:', JSON.stringify(req.body));
            console.log('payment_method:', JSON.stringify(payment_method));
            console.log('typeof payment_method:', typeof payment_method);
            console.log('=======================================');

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

            let total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
            let discount = 0;
            let couponUsed = null;

            // Áp dụng coupon
            if (coupon_code && coupon_code.trim()) {
                const couponResult = await this.couponModel.apply(coupon_code.trim(), total);
                if (couponResult.valid) {
                    discount = couponResult.discount;
                    couponUsed = coupon_code.trim().toUpperCase();
                }
            }

            const finalTotal = total - discount;

            const orderId = await this.orderModel.createOrder(
                req.session.user.id, address, phone, note,
                payment_method || 'cod', items, finalTotal,
                { discount, couponCode: couponUsed }
            );

            if (couponUsed) await this.couponModel.markUsed(couponUsed);

            await this.cartModel.clearCart(req.session.user.id);
            req.session.cartCount = 0;

            // Gửi email xác nhận
            try {
                const user = await this.userModel.findById(req.session.user.id);
                const order = await this.orderModel.getOrderDetail(orderId);
                await sendOrderConfirmation(user.email, {
                    _id: orderId,
                    userName: user.name,
                    items: items.map(i => ({
                        product_name: i.name,
                        quantity: i.quantity,
                        subtotal: i.subtotal
                    })),
                    total: finalTotal,
                    address, phone,
                    payment_method: payment_method || 'cod'
                });
            } catch (emailErr) {
                console.error('Email error (non-fatal):', emailErr.message);
            }

            // Create Notification & emit real-time event
            try {
                const staffUsers = await this.userModel.model.find({ role: { $in: ['admin', 'staff'] } });
                const notifications = staffUsers.map(u => ({
                    user_id: u._id,
                    title: 'Đơn hàng mới',
                    message: `Khách hàng ${req.session.user.fullname || req.session.user.name} vừa đặt đơn hàng #${orderId.toString().slice(-6).toUpperCase()}.`,
                    link: `/admin/orders`,
                    type: 'order_new'
                }));
                await Notification.insertMany(notifications);

                if (req.app.get('io')) {
                    req.app.get('io').to('staff_room').emit('new_order', {
                        message: `Khách hàng ${req.session.user.fullname || req.session.user.name} vừa đặt đơn hàng #${orderId.toString().slice(-6).toUpperCase()}.`,
                        orderId: orderId
                    });
                }
            } catch (notifErr) {
                console.error('Notification error (non-fatal):', notifErr.message);
            }

            // Redirect đến cổng thanh toán nếu không phải COD / bank_transfer
            console.log('>>> CHECKING PAYMENT REDIRECT, payment_method =', JSON.stringify(payment_method));
            const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

            if (payment_method === 'vnpay') {
                if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_HASH_SECRET) {
                    return res.redirect('/orders/checkout?error=payment_not_configured');
                }
                console.log('>>> REDIRECTING TO VNPAY...');
                const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
                const url = createVNPayUrl(
                    orderId, finalTotal, ip,
                    `${appUrl}/orders/vnpay-return`
                );
                return res.redirect(url);
            }

            if (payment_method === 'momo') {
                if (!process.env.MOMO_PARTNER_CODE || !process.env.MOMO_ACCESS_KEY) {
                    return res.redirect('/orders/checkout?error=payment_not_configured');
                }
                try {
                    const url = await createMoMoUrl(
                        orderId, finalTotal,
                        `${appUrl}/orders/momo-return`,
                        `${appUrl}/orders/momo-notify`
                    );
                    return res.redirect(url);
                } catch (err) {
                    console.error('Lỗi tạo thanh toán MoMo:', err);
                    return res.redirect('/orders/checkout?error=momo_failed');
                }
            }

            res.redirect(`/orders/${orderId}?success=1`);
        } catch (err) {
            console.error('Place order error:', err);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    // VNPay callback
    async vnpayReturn(req, res) {
        try {
            const isSuccess = verifyVNPay(req.query);
            const orderId = req.query.vnp_TxnRef;
            if (isSuccess) {
                await this.orderModel.model.findByIdAndUpdate(orderId, { payment_status: 'paid' });
                return res.redirect(`/orders/${orderId}?success=1`);
            }
            res.redirect(`/orders/${orderId}?error=payment_failed`);
        } catch (err) {
            res.redirect('/orders/my-orders?error=payment_failed');
        }
    }

    // MoMo callback
    async momoReturn(req, res) {
        try {
            const isSuccess = verifyMoMo(req.query);
            const orderId = req.query.orderId;
            if (isSuccess) {
                await this.orderModel.model.findByIdAndUpdate(orderId, { payment_status: 'paid' });
                return res.redirect(`/orders/${orderId}?success=1`);
            }
            res.redirect(`/orders/${orderId}?error=payment_failed`);
        } catch (err) {
            res.redirect('/orders/my-orders?error=payment_failed');
        }
    }

    async myOrders(req, res) {
        try {
            const orders = await this.orderModel.getOrdersByUser(req.session.user.id);
            const reviewStatus = {};
            for (const order of orders) {
                if (order.status === 'delivered') {
                    for (const item of order.items) {
                        if (!item.product_id) continue;
                        const pid = item.product_id._id ? item.product_id._id.toString() : item.product_id.toString();
                        reviewStatus[`${order._id}_${pid}`] = await this.reviewModel.hasReviewed(
                            req.session.user.id, pid, order._id
                        );
                    }
                }
            }
            res.render('orders/list', { title: 'Đơn hàng của tôi', orders, reviewStatus });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async orderDetail(req, res) {
        try {
            const order = await this.orderModel.getOrderDetail(req.params.id);
            if (!order || order.user_id.toString() !== req.session.user.id.toString()) {
                return res.status(403).render('error', { title: 'Lỗi', status: 403, message: 'Không có quyền truy cập' });
            }

            // Lấy trạng thái review cho từng sản phẩm trong đơn
            const reviewStatus = {};
            if (order.status === 'delivered') {
                for (const item of order.items) {
                    const pid = item.product_id && item.product_id._id ? item.product_id._id.toString() : item.product_id.toString();
                    reviewStatus[pid] = await this.reviewModel.hasReviewed(
                        req.session.user.id, pid, order._id
                    );
                }
            }

            res.render('orders/detail', {
                title: `Đơn hàng #${order._id}`,
                order, reviewStatus,
                success: req.query.success || null,
                error: req.query.error || null
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async cancelOrder(req, res) {
        try {
            const result = await this.orderModel.cancelOrder(req.params.id, req.session.user.id);
            res.json(result);
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async returnOrder(req, res) {
        try {
            const { reason } = req.body;
            const images = req.files ? req.files.map(f => f.filename) : [];
            
            const order = await this.orderModel.model.findOne({ _id: req.params.id, user_id: req.session.user.id });
            if (!order) return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });
            if (order.status !== 'delivered') return res.json({ success: false, message: 'Chỉ có thể yêu cầu hoàn hàng cho đơn hàng đã giao. Trạng thái hiện tại: ' + order.status });

            await this.orderModel.update(req.params.id, {
                status: 'return_requested',
                return_request: {
                    reason,
                    images,
                    requested_at: new Date()
                }
            });
            
            // Notify admin
            const io = req.app.get('io');
            if (io) {
                io.notifyAdmin('return_request', {
                    orderId: order._id,
                    customer: req.session.user.name,
                    message: `Khách hàng yêu cầu hoàn đơn #${order._id.toString().slice(-6).toUpperCase()}`
                });
            }

            res.json({ success: true });
        } catch (err) {
            console.error('Return order error:', err);
            res.json({ success: false, message: err.message });
        }
    }

    // API: gửi đánh giá
    async submitReview(req, res) {
        try {
            const { product_id, order_id, rating, comment, tags } = req.body;
            const userId = req.session.user.id;

            if (!rating || rating < 1 || rating > 5)
                return res.json({ success: false, message: 'Đánh giá không hợp lệ' });

            // Kiểm tra đơn hàng đã giao chưa
            const order = await this.orderModel.getOrderDetail(order_id);
            if (!order || order.status !== 'delivered' || order.user_id.toString() !== userId)
                return res.json({ success: false, message: 'Không thể đánh giá đơn hàng này' });

            const already = await this.reviewModel.hasReviewed(userId, product_id, order_id);
            if (already)
                return res.json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });

            // Parse tags
            let parsedTags = [];
            if (Array.isArray(tags)) parsedTags = tags;
            else if (typeof tags === 'string') {
                try { parsedTags = JSON.parse(tags); } catch (e) { parsedTags = [tags]; }
            }

            await this.reviewModel.create({ product_id, user_id: userId, order_id, rating: +rating, comment, tags: parsedTags });
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    // API: lấy reviews của sản phẩm
    async getReviews(req, res) {
        try {
            const reviews = await this.reviewModel.getByProduct(req.params.productId);
            const stats = await this.reviewModel.getStats(req.params.productId);
            res.json({ success: true, reviews, stats });
        } catch (err) {
            res.json({ success: false, reviews: [], stats: {} });
        }
    }

    // API: Tiếp tục thanh toán
    async retryPayment(req, res) {
        try {
            const userId = req.session.user.id;
            const orderId = req.params.id;
            const order = await this.orderModel.model.findOne({ _id: orderId, user_id: userId });

            if (!order) return res.redirect('/orders/my-orders');
            if (order.status !== 'pending' || order.payment_status !== 'unpaid') {
                return res.redirect(`/orders/${orderId}?error=invalid_status`);
            }

            // Kiểm tra xem đã quá 15 phút chưa
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
            if (order.createdAt < fifteenMinsAgo) {
                return res.redirect(`/orders/${orderId}?error=expired`);
            }

            const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';

            if (order.payment_method === 'vnpay') {
                const url = createVNPayUrl(
                    order._id.toString(), order.total_price, ip,
                    `${appUrl}/orders/vnpay-return`
                );
                return res.redirect(url);
            }

            if (order.payment_method === 'momo') {
                const url = await createMoMoUrl(
                    order._id.toString(), order.total_price,
                    `${appUrl}/orders/momo-return`,
                    `${appUrl}/orders/momo-notify`
                );
                return res.redirect(url);
            }

            res.redirect(`/orders/${orderId}`);
        } catch (err) {
            console.error('Lỗi khi tiếp tục thanh toán:', err);
            res.redirect('/orders/my-orders?error=system_error');
        }
    }
}

module.exports = new OrderController();

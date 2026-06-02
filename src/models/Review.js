const mongoose = require('mongoose');
const Model = require('./Model');

const reviewSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 1000 },
    tags: [{ type: String }]
}, { timestamps: true });

// Mỗi user chỉ review 1 lần / 1 sản phẩm / 1 đơn hàng
reviewSchema.index({ product_id: 1, user_id: 1, order_id: 1 }, { unique: true });

class Review extends Model {
    constructor() {
        super(reviewSchema, 'Review');
    }

    async getByProduct(productId) {
        return await this.model
            .find({ product_id: productId })
            .populate('user_id', 'name')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getStats(productId) {
        const result = await this.model.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    total: { $sum: 1 },
                    stars: { $push: '$rating' }
                }
            }
        ]);
        if (!result.length) return { avgRating: 0, total: 0, distribution: {} };
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        result[0].stars.forEach(s => dist[s]++);
        return { avgRating: +result[0].avgRating.toFixed(1), total: result[0].total, distribution: dist };
    }

    // Kiểm tra user đã review sản phẩm trong đơn hàng này chưa
    async hasReviewed(userId, productId, orderId) {
        const r = await this.model.findOne({ user_id: userId, product_id: productId, order_id: orderId });
        return !!r;
    }

    // Lấy các sản phẩm trong đơn hàng đã giao mà user chưa review
    async getPendingReviews(userId) {
        const Order = mongoose.model('Order');
        const orders = await Order.find({ user_id: userId, status: 'delivered' }).lean();
        const pending = [];
        for (const order of orders) {
            for (const item of order.items) {
                const reviewed = await this.hasReviewed(userId, item.product_id, order._id);
                if (!reviewed) pending.push({ order_id: order._id, product: item });
            }
        }
        return pending;
    }
}

module.exports = Review;

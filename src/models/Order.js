const mongoose = require('mongoose');
const Model = require('./Model');

const orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total_price: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'return_requested', 'returned', 'return_rejected'],
        default: 'pending'
    },
    payment_method: {
        type: String,
        enum: ['cod', 'bank_transfer', 'vnpay', 'momo'],
        default: 'cod'
    },
    payment_status: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    address: { type: String, required: true },
    phone: { type: String },
    note: { type: String },
    items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String },
        quantity: { type: Number },
        price: { type: Number }
    }],
    return_request: {
        reason: { type: String },
        images: [{ type: String }],
        requested_at: { type: Date }
    }
}, { timestamps: true });

class Order extends Model {
    constructor() {
        super(orderSchema, 'Order');
    }

    async createOrder(userId, address, phone, note, payment_method, items, totalPrice) {
        const orderItems = items.map(item => ({
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        }));
        const order = await this.create({
            user_id: userId, total_price: totalPrice,
            address, phone, note, payment_method,
            items: orderItems
        });
        const ProductModel = mongoose.model('Product');
        for (const item of items) {
            await ProductModel.findByIdAndUpdate(
                item.product_id, { $inc: { stock: -item.quantity } }
            );
        }
        return order._id;
    }

    async cancelOrder(id, userId) {
        const order = await this.model.findOne({ _id: id, user_id: userId });
        if (!order) return { success: false, message: 'Không tìm thấy đơn hàng' };
        if (!['pending', 'confirmed'].includes(order.status)) {
            return { success: false, message: 'Không thể hủy đơn hàng ở trạng thái này' };
        }
        // Hoàn lại tồn kho
        const ProductModel = mongoose.model('Product');
        for (const item of order.items) {
            await ProductModel.findByIdAndUpdate(
                item.product_id, { $inc: { stock: item.quantity } }
            );
        }
        await this.update(id, { status: 'cancelled' });
        return { success: true };
    }

    async getOrdersByUser(userId) {
        return await this.model.find({ user_id: userId })
            .populate('items.product_id', 'image name slug')
            .sort({ createdAt: -1 }).lean();
    }

    async getOrderDetail(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await this.model.findById(id)
            .populate('items.product_id', 'name image')
            .lean();
    }

    async getAllOrders() {
        return await this.model.find()
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 }).lean();
    }

    async updateStatus(id, status) {
        const updateData = { status };
        if (status === 'delivered') {
            updateData.payment_status = 'paid';
        }
        return await this.update(id, updateData);
    }

    async revenueByMonth(year) {
        return await this.model.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    revenue: { $sum: '$total_price' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    }

    async countByStatus() {
        return await this.model.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
    }

    async totalRevenue() {
        const result = await this.model.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total_price' } } }
        ]);
        return result[0]?.total || 0;
    }

    async topProducts(limit = 5) {
        return await this.model.aggregate([
            { $match: { status: 'delivered' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product_id',
                    name: { $first: '$items.name' },
                    totalQty: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: limit }
        ]);
    }
}

module.exports = Order;
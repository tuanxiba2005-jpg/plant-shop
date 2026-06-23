const mongoose = require('mongoose');
const Model = require('./Model');

const orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total_price: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'return_requested', 'returned', 'partially_returned', 'return_rejected'],
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
        items: [{
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: { type: String },
            price: { type: Number },
            quantity: { type: Number }
        }],
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

    async getOrdersByUser(userId, filter = {}) {
        return await this.model.find({ user_id: userId, ...filter })
            .populate('items.product_id', 'image name slug')
            .sort({ createdAt: -1 }).lean();
    }

    async getOrderDetail(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await this.model.findById(id)
            .populate('items.product_id', 'name image')
            .lean();
    }

    async getAllOrders(filter = {}) {
        return await this.model.find(filter)
            .populate('user_id', 'name email')
            .populate('items.product_id', 'image name slug')
            .sort({ createdAt: -1 }).lean();
    }

    async updateStatus(id, status) {
        const order = await this.model.findById(id);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        const oldStatus = order.status;
        const updateData = { status };
        if (status === 'delivered') {
            updateData.payment_status = 'paid';
        }

        // Hoàn lại kho nếu chuyển trạng thái sang cancelled (và trước đó chưa bị cancelled)
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            const ProductModel = mongoose.model('Product');
            for (const item of order.items) {
                if (item.product_id) {
                    await ProductModel.findByIdAndUpdate(
                        item.product_id, { $inc: { stock: item.quantity } }
                    );
                }
            }
        }

        // Hoàn lại kho nếu duyệt hoàn trả
        if (['returned', 'partially_returned'].includes(status) && !['returned', 'partially_returned'].includes(oldStatus)) {
            const ProductModel = mongoose.model('Product');
            // Nếu có danh sách items trả lại cụ thể (partial return)
            if (order.return_request && order.return_request.items && order.return_request.items.length > 0) {
                for (const item of order.return_request.items) {
                    if (item.product_id) {
                        await ProductModel.findByIdAndUpdate(
                            item.product_id, { $inc: { stock: item.quantity } }
                        );
                    }
                }
            } else {
                // Trả toàn bộ đơn
                for (const item of order.items) {
                    if (item.product_id) {
                        await ProductModel.findByIdAndUpdate(
                            item.product_id, { $inc: { stock: item.quantity } }
                        );
                    }
                }
            }
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

    async revenueChartData(dateFilter = null) {
        let matchStage = { status: 'delivered' };
        if (dateFilter) matchStage.createdAt = dateFilter;

        return await this.model.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { 
                        year: { $year: '$createdAt' }, 
                        month: { $month: '$createdAt' }, 
                        day: { $dayOfMonth: '$createdAt' } 
                    },
                    revenue: { $sum: '$total_price' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
    }

    async countByStatus(dateFilter = null) {
        let pipeline = [];
        if (dateFilter) pipeline.push({ $match: { createdAt: dateFilter } });
        pipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } });
        return await this.model.aggregate(pipeline);
    }

    async totalRevenue(dateFilter = null) {
        let matchStage = { status: 'delivered' };
        if (dateFilter) matchStage.createdAt = dateFilter;
        
        const result = await this.model.aggregate([
            { $match: matchStage },
            { $group: { _id: null, total: { $sum: '$total_price' } } }
        ]);
        return result[0]?.total || 0;
    }

    async topProducts(limit = 5, dateFilter = null) {
        let matchStage = { status: 'delivered' };
        if (dateFilter) matchStage.createdAt = dateFilter;

        return await this.model.aggregate([
            { $match: matchStage },
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
const mongoose = require('mongoose');
const Model = require('./Model');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true },          // % hoặc số tiền cố định
    minOrder: { type: Number, default: 0 },              // đơn hàng tối thiểu
    maxDiscount: { type: Number, default: null },            // giảm tối đa (cho percent)
    usageLimit: { type: Number, default: null },            // null = không giới hạn
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

class Coupon extends Model {
    constructor() {
        super(couponSchema, 'Coupon');
    }

    async findByCode(code) {
        return await this.model.findOne({ code: code.toUpperCase().trim() }).lean();
    }

    // Validate coupon và trả về số tiền được giảm
    async apply(code, orderTotal) {
        const coupon = await this.findByCode(code);
        if (!coupon) return { valid: false, message: 'Mã giảm giá không tồn tại' };
        if (!coupon.isActive) return { valid: false, message: 'Mã giảm giá đã bị vô hiệu hóa' };
        if (coupon.expiresAt && new Date() > coupon.expiresAt)
            return { valid: false, message: 'Mã giảm giá đã hết hạn' };
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
            return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
        if (orderTotal < coupon.minOrder)
            return { valid: false, message: `Đơn hàng tối thiểu ${coupon.minOrder.toLocaleString('vi-VN')}đ` };

        let discount = coupon.type === 'percent'
            ? Math.round(orderTotal * coupon.value / 100)
            : coupon.value;

        if (coupon.type === 'percent' && coupon.maxDiscount)
            discount = Math.min(discount, coupon.maxDiscount);

        discount = Math.min(discount, orderTotal);

        return { valid: true, discount, coupon };
    }

    // Tăng usedCount sau khi dùng thành công
    async markUsed(code) {
        await this.model.findOneAndUpdate(
            { code: code.toUpperCase() },
            { $inc: { usedCount: 1 } }
        );
    }

    async getAll() {
        return await this.model.find().sort({ createdAt: -1 }).lean();
    }
}

module.exports = Coupon;

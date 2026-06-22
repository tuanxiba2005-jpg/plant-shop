const mongoose = require('mongoose');
const Model = require('./Model');

const addressSchema = new mongoose.Schema({
    user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:       { type: String, required: true },       // tên người nhận
    phone:      { type: String, required: true },
    province:   { type: String, default: '' },
    district:   { type: String, default: '' },
    ward:       { type: String, default: '' },
    address:    { type: String, required: true },       // địa chỉ cụ thể (số nhà, tên đường)
    isDefault:  { type: Boolean, default: false }
}, { timestamps: true });

class Address extends Model {
    constructor() {
        super(addressSchema, 'Address');
    }

    // Lấy tất cả địa chỉ của user, mặc định lên đầu
    async getByUser(userId) {
        return await this.model
            .find({ user_id: userId })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean();
    }

    // Thêm địa chỉ mới; nếu là địa chỉ đầu tiên → tự đặt làm mặc định
    async addAddress(userId, data) {
        const count = await this.model.countDocuments({ user_id: userId });
        const isDefault = count === 0 ? true : (data.isDefault === true);

        // Nếu đặt mặc định → bỏ mặc định của các địa chỉ cũ
        if (isDefault) {
            await this.model.updateMany({ user_id: userId }, { isDefault: false });
        }

        return await this.create({ ...data, user_id: userId, isDefault });
    }

    // Cập nhật địa chỉ (chỉ chủ sở hữu)
    async updateAddress(addressId, userId, data) {
        const address = await this.model.findOne({ _id: addressId, user_id: userId });
        if (!address) return null;

        if (data.isDefault) {
            await this.model.updateMany({ user_id: userId }, { isDefault: false });
        }

        return await this.model.findByIdAndUpdate(addressId, data, { new: true }).lean();
    }

    // Xóa địa chỉ (chỉ chủ sở hữu)
    async deleteAddress(addressId, userId) {
        return await this.model.findOneAndDelete({ _id: addressId, user_id: userId });
    }

    // Đặt địa chỉ làm mặc định
    async setDefault(addressId, userId) {
        const address = await this.model.findOne({ _id: addressId, user_id: userId });
        if (!address) return null;
        await this.model.updateMany({ user_id: userId }, { isDefault: false });
        return await this.model.findByIdAndUpdate(addressId, { isDefault: true }, { new: true }).lean();
    }

    // Lấy địa chỉ mặc định của user
    async getDefault(userId) {
        return await this.model.findOne({ user_id: userId, isDefault: true }).lean();
    }
}

module.exports = Address;

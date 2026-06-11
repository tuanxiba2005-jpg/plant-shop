const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Model = require('./Model');

const userSchema = new mongoose.Schema({
    name:               { type: String, required: true },
    email:              { type: String, required: true, unique: true },
    password:           { type: String }, // Không bắt buộc vì Social Login không có password
    googleId:           { type: String, default: null },
    facebookId:         { type: String, default: null },
    avatar:             { type: String, default: null }, // Lưu avatar từ Google/FB
    role:               { type: String, enum: ['admin', 'staff', 'user'], default: 'user' },
    isBlocked:          { type: Boolean, default: false },
    isVerified:         { type: Boolean, default: true },
    verificationToken:  { type: String, default: null },
    resetToken:         { type: String, default: null },        // token đặt lại mật khẩu
    resetTokenExpiry:   { type: Date, default: null }           // hết hạn sau 15 phút
}, { timestamps: true });

class User extends Model {
    constructor() {
        super(userSchema, 'User');
    }

    async findByEmail(email) {
        return await this.model.findOne({ email }).lean();
    }

    async register(name, email, password, verificationToken = null) {
        const hashed = await bcrypt.hash(password, 10);
        return await this.create({ name, email, password: hashed, verificationToken });
    }

    async verifyPassword(password, hashed) {
        return await bcrypt.compare(password, hashed);
    }

    // Lưu reset token vào DB
    async saveResetToken(email, token) {
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        return await this.model.findOneAndUpdate(
            { email },
            { resetToken: token, resetTokenExpiry: expiry },
            { new: true }
        );
    }

    // Tìm user bằng reset token (còn hạn)
    async findByResetToken(token) {
        return await this.model.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
        }).lean();
    }

    // Đặt lại mật khẩu và xóa token
    async resetPassword(userId, newPassword) {
        const hashed = await bcrypt.hash(newPassword, 10);
        return await this.model.findByIdAndUpdate(userId, {
            password: hashed,
            resetToken: null,
            resetTokenExpiry: null
        });
    }

    // Lấy tất cả user + staff (không lấy admin)
    async getAllUsersAndStaff() {
        return await this.model
            .find({ role: { $in: ['user', 'staff'] } })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getAllUsers() {
        return await this.model.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
    }

    async toggleBlock(id) {
        const user = await this.findById(id);
        if (!user) return null;
        return await this.update(id, { isBlocked: !user.isBlocked });
    }

    async updateRole(id, role) {
        return await this.update(id, { role });
    }

    async createStaff(name, email, password) {
        const hashed = await bcrypt.hash(password, 10);
        return await this.create({ name, email, password: hashed, role: 'staff' });
    }

    async updateUser(id, data) {
        if (data.password && data.password.trim() !== '') {
            data.password = await bcrypt.hash(data.password, 10);
        } else {
            delete data.password;
        }
        return await this.update(id, data);
    }

    async deleteUser(id) {
        return await this.model.findByIdAndDelete(id);
    }
}

module.exports = User;

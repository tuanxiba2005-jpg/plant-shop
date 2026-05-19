const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Model = require('./Model');

const userSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    role:      { type: String, enum: ['admin', 'staff', 'user'], default: 'user' },
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

class User extends Model {
    constructor() {
        super(userSchema, 'User');
    }

    async findByEmail(email) {
        return await this.model.findOne({ email }).lean();
    }

    async register(name, email, password) {
        const hashed = await bcrypt.hash(password, 10);
        return await this.create({ name, email, password: hashed });
    }

    async verifyPassword(password, hashed) {
        return await bcrypt.compare(password, hashed);
    }

    // Lấy tất cả user + staff (không lấy admin)
    async getAllUsersAndStaff() {
        return await this.model
            .find({ role: { $in: ['user', 'staff'] } })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
    }

    // Giữ lại để StaffController dùng
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
const mongoose = require('mongoose');
const Model = require('./Model');

const shiftSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    date: { 
        type: String, // Format: YYYY-MM-DD
        required: true 
    },
    type: { 
        type: String, 
        enum: ['morning', 'afternoon', 'evening'], 
        required: true 
    },
    checkIn: { 
        type: Date, 
        default: null 
    },
    checkOut: { 
        type: Date, 
        default: null 
    }
}, { timestamps: true });

// Mỗi nhân viên chỉ có 1 loại ca trong 1 ngày
shiftSchema.index({ user: 1, date: 1, type: 1 }, { unique: true });

class Shift extends Model {
    constructor() {
        super(shiftSchema, 'Shift');
    }

    async assignShift(userId, date, type) {
        try {
            return await this.model.create({ user: userId, date, type });
        } catch (error) {
            if (error.code === 11000) {
                // Duplicate key error, already assigned
                return null;
            }
            throw error;
        }
    }

    async removeShift(userId, date, type) {
        return await this.model.deleteOne({ user: userId, date, type });
    }

    async getShiftsByDateRange(startDate, endDate) {
        return await this.model.find({
            date: { $gte: startDate, $lte: endDate }
        }).populate('user', 'name email avatar').lean();
    }

    async getShiftsByUser(userId, startDate, endDate) {
        return await this.model.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }).lean();
    }

    async checkIn(shiftId) {
        return await this.model.findByIdAndUpdate(shiftId, { checkIn: new Date() }, { new: true });
    }

    async checkOut(shiftId) {
        return await this.model.findByIdAndUpdate(shiftId, { checkOut: new Date() }, { new: true });
    }
}

module.exports = Shift;

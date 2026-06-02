const mongoose = require('mongoose');
const Model = require('./Model');

const wishlistSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true });

wishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

class Wishlist extends Model {
    constructor() {
        super(wishlistSchema, 'Wishlist');
    }

    async getByUser(userId) {
        return await this.model.find({ user_id: userId })
            .populate('product_id', 'name price image stock slug')
            .sort({ createdAt: -1 })
            .lean();
    }

    async toggle(userId, productId) {
        const existing = await this.model.findOne({ user_id: userId, product_id: productId });
        if (existing) {
            await this.model.deleteOne({ _id: existing._id });
            return { action: 'removed' };
        }
        await this.create({ user_id: userId, product_id: productId });
        return { action: 'added' };
    }

    async isWishlisted(userId, productId) {
        return !!(await this.model.findOne({ user_id: userId, product_id: productId }));
    }

    async countByUser(userId) {
        return await this.model.countDocuments({ user_id: userId });
    }
}

module.exports = Wishlist;

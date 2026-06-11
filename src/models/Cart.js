const mongoose = require('mongoose');
const Model = require('./Model');

const cartSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity:   { type: Number, default: 1 }
    }]
}, { timestamps: true });

class Cart extends Model {
    constructor() {
        super(cartSchema, 'Cart');
    }

    async getOrCreateCart(userId) {
        let cart = await this.model.findOne({ user_id: userId });
        if (!cart) {
            cart = await this.model.create({ user_id: userId, items: [] });
        }
        return cart;
    }

    async getCartItems(userId) {
        const cart = await this.model.findOne({ user_id: userId })
            .populate('items.product_id')
            .lean();
        if (!cart) return [];

        return cart.items.map(item => ({
            product_id: item.product_id._id,
            name:       item.product_id.name,
            price:      item.product_id.price,
            image:      item.product_id.image,
            stock:      item.product_id.stock,
            quantity:   item.quantity,
            subtotal:   item.product_id.price * item.quantity
        }));
    }

    async addItem(userId, productId, quantity = 1) {
        const cart = await this.getOrCreateCart(userId);
        const existingIndex = cart.items.findIndex(
            i => i.product_id.toString() === productId.toString()
        );
        if (existingIndex >= 0) {
            cart.items[existingIndex].quantity += quantity;
        } else {
            cart.items.push({ product_id: productId, quantity });
        }
        await cart.save();
    }

    async updateItem(userId, productId, quantity) {
        if (quantity <= 0) return await this.removeItem(userId, productId);
        const cart = await this.getOrCreateCart(userId);
        const item = cart.items.find(
            i => i.product_id.toString() === productId.toString()
        );
        if (item) {
            item.quantity = quantity;
            await cart.save();
        }
    }

    async removeItem(userId, productId) {
        const cart = await this.getOrCreateCart(userId);
        cart.items = cart.items.filter(
            i => i.product_id.toString() !== productId.toString()
        );
        await cart.save();
    }

    async clearCart(userId) {
        await this.model.findOneAndUpdate(
            { user_id: userId },
            { $set: { items: [] } }
        );
    }

    async getCartCount(userId) {
        const cart = await this.model.findOne({ user_id: userId }).lean();
        if (!cart) return 0;
        return cart.items.length;
    }
}

module.exports = Cart;
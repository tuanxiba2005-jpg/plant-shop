const mongoose = require('mongoose');
const Model = require('./Model');

const productSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String, default: '' },
    price:       { type: Number, required: true },
    stock:       { type: Number, default: 0 },
    image:       { type: String, default: 'default.jpg' },
    images:      [{ type: String }],
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

class Product extends Model {
    constructor() {
        super(productSchema, 'Product');
    }

    async findAllWithCategory() {
        return await this.model.find()
            .populate('category_id', 'name')
            .sort({ createdAt: -1 })
            .lean();
    }

    async findByIdWithCategory(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await this.model.findById(id)
            .populate('category_id', 'name')
            .lean();
    }

    async findByCategory(categoryId) {
        return await this.model.find({ category_id: categoryId })
            .populate('category_id', 'name')
            .lean();
    }

    async search(keyword) {
        return await this.model.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        }).populate('category_id', 'name').lean();
    }

    async findWithPagination(page = 1, limit = 8, categoryId = null, keyword = '') {
        const query = {};
        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            query.category_id = categoryId;
        }
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        const total = await this.model.countDocuments(query);
        const products = await this.model.find(query)
            .populate('category_id', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Chuẩn hóa category_name để view dùng như cũ
        const normalized = products.map(p => ({
            ...p,
            category_name: p.category_id?.name || ''
        }));

        return {
            products: normalized,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }
}

module.exports = Product;
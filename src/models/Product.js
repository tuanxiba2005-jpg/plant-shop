const mongoose = require('mongoose');
const Model = require('./Model');

const productSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String, default: '' },
    price:       { type: Number, required: true },
    stock:       { type: Number, default: 0 },
    image:       { type: String, default: 'default.jpg' },
    images:      [{ type: String }],
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    embedding:   { type: [Number], index: true }
}, { timestamps: true });

class Product extends Model {
    constructor() {
        super(productSchema, 'Product');
    }

    async create(data) {
        try {
            const aiService = require('../services/aiService');
            const Category = mongoose.models.Category || mongoose.model('Category');
            const cat = data.category_id ? await Category.findById(data.category_id) : null;
            const textToEmbed = aiService.createProductTextToEmbed(data, cat ? cat.name : '');
            
            const embedding = await aiService.generateEmbedding(textToEmbed);
            if (embedding) data.embedding = embedding;
        } catch (e) { console.error('Lỗi tạo embedding lúc tạo mới:', e); }
        
        return super.create(data);
    }

    async update(id, data) {
        try {
            const existing = await this.findById(id);
            if (existing) {
                const merged = { ...existing, ...data };
                const aiService = require('../services/aiService');
                const Category = mongoose.models.Category || mongoose.model('Category');
                const cat = merged.category_id ? await Category.findById(merged.category_id) : null;
                const textToEmbed = aiService.createProductTextToEmbed(merged, cat ? cat.name : '');
                
                const embedding = await aiService.generateEmbedding(textToEmbed);
                if (embedding) data.embedding = embedding;
            }
        } catch (e) { console.error('Lỗi tạo embedding lúc cập nhật:', e); }
        
        return super.update(id, data);
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
        if (!keyword) return [];
        try {
            const aiService = require('../services/aiService');
            const vector = await aiService.generateEmbedding(keyword);
            if (vector && vector.length > 0) {
                return await this.model.aggregate([
                    {
                        $vectorSearch: {
                            index: 'vector_index',
                            path: 'embedding',
                            queryVector: vector,
                            numCandidates: 100,
                            limit: 8
                        }
                    },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'category_id',
                            foreignField: '_id',
                            as: 'category_info'
                        }
                    },
                    {
                        $addFields: {
                            category_id: { $arrayElemAt: ['$category_info', 0] }
                        }
                    }
                ]);
            }
        } catch (e) { console.error('Vector search error:', e); }

        // Fallback to Regex
        return await this.model.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        }).populate('category_id', 'name').lean();
    }

    async findWithPagination(page = 1, limit = 8, categoryId = null, keyword = '', minPrice = null, maxPrice = null, sort = 'newest') {
        const query = {};
        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            query.category_id = categoryId;
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };

        let products = [];
        let total = 0;

        if (keyword) {
            let useVector = false;
            try {
                const aiService = require('../services/aiService');
                const vector = await aiService.generateEmbedding(keyword);
                if (vector && vector.length > 0) {
                    useVector = true;
                    // Chuyển category_id thành ObjectId cho aggregation match
                    const matchStage = {};
                    if (query.category_id) matchStage.category_id = new mongoose.Types.ObjectId(query.category_id);
                    if (query.price) matchStage.price = query.price;

                    const pipeline = [
                        {
                            $vectorSearch: {
                                index: 'vector_index',
                                path: 'embedding',
                                queryVector: vector,
                                numCandidates: 100,
                                limit: 100 // Lấy top 100 liên quan nhất rồi lọc
                            }
                        }
                    ];

                    if (Object.keys(matchStage).length > 0) {
                        pipeline.push({ $match: matchStage });
                    }

                    // Thực hiện aggregation
                    let rawResults = await this.model.aggregate(pipeline);
                    
                    // Sorting and Pagination in memory for the top 100
                    if (sort === 'price_asc') rawResults.sort((a, b) => a.price - b.price);
                    else if (sort === 'price_desc') rawResults.sort((a, b) => b.price - a.price);
                    
                    total = rawResults.length;
                    
                    const pagedResults = rawResults.slice((page - 1) * limit, page * limit);
                    
                    // Populate category manually since aggregate doesn't use standard populate
                    const CategoryModel = require('./Category');
                    const categoryInstance = new CategoryModel();
                    for (let p of pagedResults) {
                        if (p.category_id) {
                            p.category_id = await categoryInstance.findById(p.category_id);
                        }
                    }
                    products = pagedResults;
                }
            } catch (e) {
                console.error('Vector search pagination error:', e.message);
                useVector = false; // Fallback
            }

            if (!useVector) {
                query.$or = [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ];
                total = await this.model.countDocuments(query);
                products = await this.model.find(query)
                    .populate('category_id', 'name')
                    .sort(sortOption)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean();
            }
        } else {
            total = await this.model.countDocuments(query);
            products = await this.model.find(query)
                .populate('category_id', 'name')
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();
        }

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
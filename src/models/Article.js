const mongoose = require('mongoose');
const Model = require('./Model');

const commentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, default: '' },
    content: { type: String, required: true },
    image: { type: String, default: 'default-article.jpg' },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    views: { type: Number, default: 0 },
    comments: [commentSchema]
}, { timestamps: true });

class Article extends Model {
    constructor() {
        super(articleSchema, 'Article');
    }

    async findAllPublished() {
        return await this.model.find({ status: 'published' })
            .populate('author_id', 'fullname avatar')
            .sort({ createdAt: -1 })
            .lean();
    }

    async findBySlug(slug) {
        return await this.model.findOne({ slug, status: 'published' })
            .populate('author_id', 'fullname avatar')
            .populate('comments.user_id', 'fullname avatar')
            .lean();
    }
    
    async incrementViews(id) {
        return await this.model.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }

    async addComment(articleId, userId, content) {
        return await this.model.findByIdAndUpdate(
            articleId,
            { $push: { comments: { user_id: userId, content } } },
            { new: true }
        );
    }
}

module.exports = Article;

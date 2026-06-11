const Article = require('../models/Article');

class BlogController {
    constructor() {
        this.articleModel = new Article();
        this.index = this.index.bind(this);
        this.detail = this.detail.bind(this);
        this.comment = this.comment.bind(this);
    }

    async index(req, res) {
        try {
            const articles = await this.articleModel.findAllPublished();
            res.render('blog/index', {
                title: 'Mẹo & Chăm sóc cây',
                path: '/blogs',
                articles
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async detail(req, res) {
        try {
            const article = await this.articleModel.findBySlug(req.params.slug);
            if (!article) return res.status(404).render('error', { title: 'Không tìm thấy bài viết', status: 404, message: 'Bài viết không tồn tại.' });

            // Tăng view
            await this.articleModel.incrementViews(article._id);
            article.views = (article.views || 0) + 1;

            // Bài viết liên quan
            const related = await this.articleModel.model.find({ status: 'published', _id: { $ne: article._id } })
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            res.render('blog/detail', {
                title: article.title,
                path: '/blogs',
                article,
                related
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async comment(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để bình luận' });
            }
            
            const article = await this.articleModel.findBySlug(req.params.slug);
            if (!article) return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });

            const { content } = req.body;
            if (!content || !content.trim()) {
                return res.status(400).json({ success: false, message: 'Nội dung bình luận không được trống' });
            }

            await this.articleModel.addComment(article._id, req.session.user._id, content.trim());
            
            // Redirect back to article
            res.redirect(`/blogs/${article.slug}`);
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new BlogController();

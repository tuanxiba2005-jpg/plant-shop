const Article = require('../models/Article');
const path = require('path');
const fs = require('fs');

class AdminArticleController {
    constructor() {
        this.articleModel = new Article();
        this.index = this.index.bind(this);
        this.createForm = this.createForm.bind(this);
        this.create = this.create.bind(this);
        this.editForm = this.editForm.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }

    async index(req, res) {
        try {
            const articles = await this.articleModel.model.find()
                .populate('author_id', 'fullname')
                .sort({ createdAt: -1 })
                .lean();
            res.render('admin/articles/index', {
                title: 'Quản lý bài viết',
                path: '/admin/articles',
                articles
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    createForm(req, res) {
        res.render('admin/articles/form', {
            title: 'Thêm bài viết mới',
            path: '/admin/articles',
            article: null
        });
    }

    async create(req, res) {
        try {
            const { title, slug, summary, content, status } = req.body;
            let image = 'default-article.jpg';
            if (req.file) {
                image = req.file.filename;
            }

            await this.articleModel.create({
                title, slug, summary, content, status, image, author_id: req.session.user._id
            });
            res.redirect('/admin/articles');
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async editForm(req, res) {
        try {
            const article = await this.articleModel.findById(req.params.id);
            if (!article) return res.redirect('/admin/articles');
            res.render('admin/articles/form', {
                title: 'Sửa bài viết',
                path: '/admin/articles',
                article
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async update(req, res) {
        try {
            const { title, slug, summary, content, status } = req.body;
            const data = { title, slug, summary, content, status };
            
            if (req.file) {
                data.image = req.file.filename;
            }

            await this.articleModel.update(req.params.id, data);
            res.redirect('/admin/articles');
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async delete(req, res) {
        try {
            await this.articleModel.delete(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }
}

module.exports = new AdminArticleController();

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

router.get('/', async (req, res) => {
    try {
        const productModel = new Product();
        const categoryModel = new Category();
        const Article = require('../models/Article');
        const articleModel = new Article();

        const categories = await categoryModel.findAll();

        // Với mỗi danh mục, lấy tối đa 8 sản phẩm
        const categoriesWithProducts = await Promise.all(
            categories.map(async (cat) => {
                const products = await productModel.findByCategory(cat._id);
                return {
                    ...cat.toObject ? cat.toObject() : cat,
                    products: products.slice(0, 8)
                };
            })
        );

        // Lấy 3 bài viết mới nhất
        const latestArticles = await articleModel.model.find({ status: 'published' })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

        res.render('index', {
            title: 'Trang chủ - Plant Shop',
            categoriesWithProducts,
            latestArticles
        });
    } catch (err) {
        console.error('Home error:', err);
        res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
    }
});

// Trang Bí quyết chăm sóc cây
router.get('/plant-care', (req, res) => {
    res.render('pages/plant-care', {
        title: 'Bí quyết chăm sóc cây - Cẩm nang'
    });
});

// Bài viết Blog
const blogController = require('../controllers/BlogController');
router.get('/blogs', blogController.index);
router.get('/blogs/:slug', blogController.detail);
router.post('/blogs/:slug/comment', blogController.comment);

module.exports = router;
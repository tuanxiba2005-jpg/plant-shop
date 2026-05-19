const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

router.get('/', async (req, res) => {
    try {
        const productModel = new Product();
        const categoryModel = new Category();

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

        res.render('index', {
            title: 'Trang chủ - Plant Shop',
            categoriesWithProducts
        });
    } catch (err) {
        console.error('Home error:', err);
        res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
    }
});

module.exports = router;
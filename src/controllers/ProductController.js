const Product = require('../models/Product');
const Category = require('../models/Category');

class ProductController {
    constructor() {
        this.productModel = new Product();
        this.categoryModel = new Category();
        this.index = this.index.bind(this);
        this.show = this.show.bind(this);
    }

    async index(req, res) {
        try {
            const page = parseInt(req.query.page)  || 1;
            const categoryId = req.query.category || null;
            const keyword = req.query.search || '';
            const categories = await this.categoryModel.findAll();
            const data =await this.productModel.findWithPagination(page, 8, categoryId, keyword);
            res.render('products/index', {
                title: 'Danh sách cây cảnh',
                ...data,
                categories,
                selectedCategory: categoryId,
                keyword
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', {message: 'lỗi server' });
        }
    }

    async show(req, res) {
         try {
            const product =await this.productModel.findByIdWithCategory(req.params.id);
            if (!product) return res.status(404).render('404', {title: '404'});
            const related = await this.productModel.findByCategory(product.category_id);
            res.render('products/detail', {title: product.name, product, related: related.filter(p => p.id != product.id ).slice(0,4)});

         }catch (err) {
            res.status(500).render('errror', {message: 'Error server'});
         }
    }
}

module.exports = new ProductController();

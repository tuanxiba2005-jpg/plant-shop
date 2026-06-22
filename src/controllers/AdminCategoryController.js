const Category = require('../models/Category');
const categoryModel = new Category();
const Product = require('../models/Product');
const productModel = new Product();

class AdminCategoryController {
    // [GET] /admin/categories
    async index(req, res, next) {
        try {
            const categories = await categoryModel.findAll();
            res.render('admin/categories/index', {
                title: 'Quản lý danh mục',
                categories: categories
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /admin/categories/create
    async create(req, res) {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.json({ success: false, message: 'Tên danh mục không được để trống' });
            }
            await categoryModel.create({ name, description });
            if (req.app.locals.clearCategoryCache) req.app.locals.clearCategoryCache();
            res.json({ success: true, message: 'Thêm danh mục thành công' });
        } catch (error) {
            res.json({ success: false, message: 'Có lỗi xảy ra: ' + error.message });
        }
    }

    // [POST] /admin/categories/:id/update
    async update(req, res) {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.json({ success: false, message: 'Tên danh mục không được để trống' });
            }
            await categoryModel.update(req.params.id, { name, description });
            if (req.app.locals.clearCategoryCache) req.app.locals.clearCategoryCache();
            res.json({ success: true, message: 'Cập nhật danh mục thành công' });
        } catch (error) {
            res.json({ success: false, message: 'Có lỗi xảy ra: ' + error.message });
        }
    }

    // [DELETE] /admin/categories/:id
    async delete(req, res) {
        try {
            const categoryId = req.params.id;
            // Check if any product is using this category
            const products = await productModel.model.find({ category: categoryId });
            if (products.length > 0) {
                return res.json({ success: false, message: 'Không thể xoá danh mục này vì đang có sản phẩm thuộc danh mục!' });
            }

            await categoryModel.delete(categoryId);
            if (req.app.locals.clearCategoryCache) req.app.locals.clearCategoryCache();
            res.json({ success: true, message: 'Xoá danh mục thành công' });
        } catch (error) {
            res.json({ success: false, message: 'Có lỗi xảy ra: ' + error.message });
        }
    }
}

module.exports = new AdminCategoryController();

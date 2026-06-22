const Product = require('../models/Product');
const productModel = new Product();

class AdminDiscountController {
    // [GET] /admin/discounts
    async index(req, res, next) {
        try {
            // Lấy toàn bộ sản phẩm
            const allProducts = await productModel.findAllWithCategory();
            // Lọc ra sản phẩm đang giảm giá
            const discountedProducts = allProducts.filter(p => p.original_price != null);

            res.render('admin/discounts/index', {
                title: 'Quản lý Giảm giá',
                allProducts,
                discountedProducts
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /admin/discounts/create
    async create(req, res) {
        try {
            const { product_id, new_price } = req.body;
            if (!product_id || !new_price || new_price <= 0) {
                return res.json({ success: false, message: 'Dữ liệu không hợp lệ' });
            }

            const product = await productModel.model.findById(product_id);
            if (!product) {
                return res.json({ success: false, message: 'Không tìm thấy sản phẩm' });
            }

            if (Number(new_price) >= product.price && !product.original_price) {
                return res.json({ success: false, message: 'Giá sau giảm phải nhỏ hơn giá gốc' });
            }

            // Nếu sản phẩm chưa từng giảm giá, copy giá hiện tại vào original_price
            const originalPrice = product.original_price ? product.original_price : product.price;

            if (Number(new_price) >= originalPrice) {
                return res.json({ success: false, message: 'Giá sau giảm phải nhỏ hơn giá gốc của sản phẩm' });
            }

            await productModel.update(product_id, {
                original_price: originalPrice,
                price: Number(new_price)
            });

            res.json({ success: true, message: 'Thêm giảm giá thành công' });
        } catch (error) {
            res.json({ success: false, message: 'Có lỗi xảy ra: ' + error.message });
        }
    }

    // [POST] /admin/discounts/:id/remove
    async remove(req, res) {
        try {
            const productId = req.params.id;
            const product = await productModel.model.findById(productId);
            if (!product || !product.original_price) {
                return res.json({ success: false, message: 'Sản phẩm không có giảm giá' });
            }

            // Trả lại giá gốc cho price và xoá original_price
            await productModel.model.findByIdAndUpdate(productId, {
                $set: { price: product.original_price },
                $unset: { original_price: "" }
            });

            res.json({ success: true, message: 'Đã huỷ giảm giá' });
        } catch (error) {
            res.json({ success: false, message: 'Có lỗi xảy ra: ' + error.message });
        }
    }
}

module.exports = new AdminDiscountController();

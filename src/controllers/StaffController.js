const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

class StaffController {
    constructor() {
        this.productModel = new Product();
        this.categoryModel = new Category();
        this.orderModel = new Order();
        this.userModel = new User();

        this.dashboard = this.dashboard.bind(this);
        this.products = this.products.bind(this);
        this.createProduct = this.createProduct.bind(this);
        this.updateProduct = this.updateProduct.bind(this);
        this.orders = this.orders.bind(this);
        this.updateOrderStatus = this.updateOrderStatus.bind(this);
        this.customers = this.customers.bind(this);
    }

    async dashboard(req, res) {
        try {
            const totalProducts = await this.productModel.count();
            const totalOrders = await this.orderModel.count();
            const totalUsers = await this.userModel.count({ role: 'user' });
            const recentOrders = await this.orderModel.getAllOrders();
            const statusStats = await this.orderModel.countByStatus();

            res.render('staff/dashboard', {
                title: 'Staff Dashboard',
                totalProducts,
                totalOrders,
                totalUsers,
                recentOrders: recentOrders.slice(0, 5),
                statusStats
            });
        } catch (err) {
            console.error('Staff dashboard error:', err.message);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async products(req, res) {
        try {
            const products = await this.productModel.findAllWithCategory();
            const categories = await this.categoryModel.findAll();
            res.render('staff/products', { title: 'Quản lý sản phẩm', products, categories });
        } catch (err) {
            console.error('Staff products error:', err.message);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async createProduct(req, res) {
        try {
            const { name, description, price, stock, category_id } = req.body;
            const image = req.file ? req.file.filename : 'default.jpg';
            await this.productModel.create({ name, description, price, stock, category_id, image });
            res.redirect('/staff/products');
        } catch (err) {
            console.error('Staff create product error:', err.message);
            res.redirect('/staff/products');
        }
    }

    async updateProduct(req, res) {
        try {
            const { name, description, price, stock, category_id } = req.body;
            const data = { name, description, price, stock, category_id };
            if (req.file) data.image = req.file.filename;
            await this.productModel.update(req.params.id, data);
            res.redirect('/staff/products');
        } catch (err) {
            console.error('Staff update product error:', err.message);
            res.redirect('/staff/products');
        }
    }

    async orders(req, res) {
        try {
            const orders = await this.orderModel.getAllOrders();
            res.render('staff/orders', { title: 'Quản lý đơn hàng', orders });
        } catch (err) {
            console.error('Staff orders error:', err.message);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            await this.orderModel.updateStatus(req.params.id, req.body.status);
            res.json({ success: true });
        } catch (err) {
            console.error('Staff update order status error:', err.message);
            res.json({ success: false, message: err.message });
        }
    }

    async customers(req, res) {
        try {
            const users = await this.userModel.getAllUsers();
            res.render('staff/customers', { title: 'Danh sách khách hàng', users });
        } catch (err) {
            console.error('Staff customers error:', err.message);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }
}

module.exports = new StaffController();
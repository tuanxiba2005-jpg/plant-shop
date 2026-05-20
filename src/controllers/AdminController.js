const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

class AdminController {
    constructor() {
        this.productModel = new Product();
        this.categoryModel = new Category();
        this.orderModel = new Order();
        this.userModel = new User();

        this.dashboard = this.dashboard.bind(this);
        this.products = this.products.bind(this);
        this.createProduct = this.createProduct.bind(this);
        this.updateProduct = this.updateProduct.bind(this);
        this.deleteProduct = this.deleteProduct.bind(this);
        this.orders = this.orders.bind(this);
        this.updateOrderStatus = this.updateOrderStatus.bind(this);
        this.users = this.users.bind(this);
        this.createUser = this.createUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.toggleBlockUser = this.toggleBlockUser.bind(this);
        this.updateRole = this.updateRole.bind(this);
        this.revenue = this.revenue.bind(this);
    }

    async dashboard(req, res) {
        try {
            const year = new Date().getFullYear();
            const totalProducts = await this.productModel.count();
            const totalOrders = await this.orderModel.count();
            const totalUsers = await this.userModel.count({ role: 'user' });
            const totalRevenue = await this.orderModel.totalRevenue();
            const recentOrders = await this.orderModel.getAllOrders();
            const statusStats = await this.orderModel.countByStatus();
            const monthlyRevenue = await this.orderModel.revenueByMonth(year);

            const months = Array.from({ length: 12 }, (_, i) => {
                const found = monthlyRevenue.find(r => r._id === i + 1);
                return { month: i + 1, revenue: found?.revenue || 0, orders: found?.orders || 0 };
            });

            res.render('admin/dashboard', {
                title: 'Admin Dashboard',
                totalProducts, totalOrders, totalUsers, totalRevenue,
                recentOrders: recentOrders.slice(0, 5),
                statusStats, months
            });
        } catch (err) {
            console.error('Dashboard error:', err.message);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async products(req, res) {
        try {
            const products = await this.productModel.findAllWithCategory();
            const categories = await this.categoryModel.findAll();
            res.render('admin/products', {
                title: 'Quản lý sản phẩm',
                products,
                categories,
                query: req.query
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async createProduct(req, res) {
        try {
            const { name, description, price, stock, category_id } = req.body;
            const image = req.file ? req.file.filename : 'default.jpg';
            await this.productModel.create({ name, description, price, stock, category_id, image });
            res.redirect('/admin/products');
        } catch (err) {
            res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
        }
    }

    async updateProduct(req, res) {
        try {
            const { name, description, price, stock, category_id } = req.body;
            const data = { name, description, price, stock, category_id };
            if (req.file) data.image = req.file.filename;
            await this.productModel.update(req.params.id, data);
            res.redirect('/admin/products');
        } catch (err) {
            res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
        }
    }

    async deleteProduct(req, res) {
        try {
            await this.productModel.delete(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async orders(req, res) {
        try {
            const orders = await this.orderModel.getAllOrders();
            res.render('admin/orders', { title: 'Quản lý đơn hàng', orders });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            await this.orderModel.updateStatus(req.params.id, req.body.status);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async users(req, res) {
        try {
            const users = await this.userModel.getAllUsersAndStaff();
            res.render('admin/users', { title: 'Quản lý người dùng', users });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async createUser(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const existing = await this.userModel.findByEmail(email);
            if (existing) {
                return res.json({ success: false, message: 'Email đã tồn tại' });
            }
            if (role === 'staff') {
                await this.userModel.createStaff(name, email, password);
            } else {
                await this.userModel.register(name, email, password);
            }
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async updateUser(req, res) {
        try {
            const { name, email, password } = req.body;
            await this.userModel.updateUser(req.params.id, { name, email, password });
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async deleteUser(req, res) {
        try {
            if (req.params.id === req.session.user.id) {
                return res.json({ success: false, message: 'Không thể xóa tài khoản đang đăng nhập' });
            }
            await this.userModel.deleteUser(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async toggleBlockUser(req, res) {
        try {
            if (req.params.id === req.session.user.id) {
                return res.json({ success: false, message: 'Không thể khóa tài khoản đang đăng nhập' });
            }
            await this.userModel.toggleBlock(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async updateRole(req, res) {
        try {
            const { role } = req.body;
            if (!['user', 'staff'].includes(role)) {
                return res.json({ success: false, message: 'Role không hợp lệ' });
            }
            await this.userModel.updateRole(req.params.id, role);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async revenue(req, res) {
        try {
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const monthlyRevenue = await this.orderModel.revenueByMonth(year);
            const totalRevenue = await this.orderModel.totalRevenue();
            const topProducts = await this.orderModel.topProducts(5);
            const statusStats = await this.orderModel.countByStatus();

            const months = Array.from({ length: 12 }, (_, i) => {
                const found = monthlyRevenue.find(r => r._id === i + 1);
                return { month: i + 1, revenue: found?.revenue || 0, orders: found?.orders || 0 };
            });

            res.render('admin/revenue', {
                title: 'Báo cáo doanh thu',
                months, totalRevenue, topProducts, statusStats, year
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }
}

module.exports = new AdminController();
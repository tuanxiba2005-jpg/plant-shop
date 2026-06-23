const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Shift = require('../models/Shift');

const STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Chờ lấy hàng',
    shipping: 'Đang giao',
    delivered: 'Giao hàng thành công',
    cancelled: 'Đã hủy'
};

class StaffController {
    constructor() {
        this.productModel = new Product();
        this.categoryModel = new Category();
        this.orderModel = new Order();
        this.userModel = new User();
        this.shiftModel = new Shift();

        this.dashboard = this.dashboard.bind(this);
        this.products = this.products.bind(this);
        this.createProduct = this.createProduct.bind(this);
        this.updateProduct = this.updateProduct.bind(this);
        this.orders = this.orders.bind(this);
        this.updateOrderStatus = this.updateOrderStatus.bind(this);
        this.getOrderDetail = this.getOrderDetail.bind(this);
        this.getReturnDetail = this.getReturnDetail.bind(this);
        this.processReturn = this.processReturn.bind(this);
        this.customers = this.customers.bind(this);

        this.shiftsPage = this.shiftsPage.bind(this);
        this.shiftsApi = this.shiftsApi.bind(this);
        this.checkIn = this.checkIn.bind(this);
        this.checkOut = this.checkOut.bind(this);
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
            const statusFilter = req.query.status && req.query.status !== 'all' ? { status: req.query.status } : {};
            if (req.query.startDate && req.query.endDate) {
                const startDate = new Date(req.query.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                statusFilter.createdAt = { $gte: startDate, $lte: endDate };
            }

            const orders = await this.orderModel.getAllOrders(statusFilter);
            const statsArray = await this.orderModel.countByStatus();
            const statusStats = {};
            statsArray.forEach(st => {
                statusStats[st._id] = st.count;
            });
            
            // Tính toán KPI hôm nay
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const todayOrders = await this.orderModel.model.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean();
            const kpi = {
                todayCount: todayOrders.length,
                todayRevenue: todayOrders.reduce((sum, o) => sum + o.total_price, 0)
            };

            res.render('staff/orders', { 
                title: 'Quản lý đơn hàng', 
                orders,
                statusStats,
                kpi,
                currentStatus: req.query.status || 'all',
                filterStartDate: req.query.startDate || '',
                filterEndDate: req.query.endDate || ''
            });
        } catch (err) {
            console.error('Staff orders error:', err.message);
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { status } = req.body;
            await this.orderModel.updateStatus(req.params.id, status);

            // Lấy user_id từ đơn hàng để emit thông báo
            const order = await this.orderModel.model.findById(req.params.id).lean();
            if (order && STATUS_LABELS[status]) {
                const messageText = `Đơn hàng #${order._id.toString().slice(-6).toUpperCase()} của bạn đã được cập nhật: ${STATUS_LABELS[status]}`;
                
                await Notification.create({
                    user_id: order.user_id,
                    title: 'Cập nhật đơn hàng',
                    message: messageText,
                    link: `/orders/my-orders`,
                    type: 'order_status'
                });

                const io = req.app.get('io');
                if (io) {
                    io.to('user_' + order.user_id.toString()).emit('order_status_update', {
                        orderId: order._id,
                        status,
                        statusLabel: STATUS_LABELS[status],
                        message: messageText
                    });
                }
            }

            res.json({ success: true });
        } catch (err) {
            console.error('Staff update order status error:', err.message);
            res.json({ success: false, message: err.message });
        }
    }

    async getOrderDetail(req, res) {
        try {
            const order = await this.orderModel.model.findById(req.params.id)
                .populate('user_id', 'name email phone')
                .populate('items.product_id', 'image')
                .lean();
            if (!order) return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });
            res.json({ success: true, order });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async getReturnDetail(req, res) {
        try {
            const order = await this.orderModel.model.findById(req.params.id)
                .populate('user_id', 'name email')
                .lean();
            if (!order) return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });
            res.json({ success: true, order });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async processReturn(req, res) {
        try {
            const { action } = req.body;
            
            const order = await this.orderModel.model.findById(req.params.id).lean();
            if (!order || order.status !== 'return_requested') {
                return res.json({ success: false, message: 'Đơn hàng không ở trạng thái yêu cầu hoàn' });
            }

            let newStatus = 'return_rejected';
            if (action === 'approve') {
                if (order.return_request && order.return_request.items && order.return_request.items.length > 0) {
                    newStatus = 'partially_returned';
                } else {
                    newStatus = 'returned';
                }
            }

            await this.orderModel.update(req.params.id, { status: newStatus });

            const messageText = action === 'approve' 
                ? `Yêu cầu hoàn hàng cho đơn #${order._id.toString().slice(-6).toUpperCase()} đã được CHẤP NHẬN.`
                : `Yêu cầu hoàn hàng cho đơn #${order._id.toString().slice(-6).toUpperCase()} đã bị TỪ CHỐI.`;
            
            await Notification.create({
                user_id: order.user_id,
                title: 'Kết quả yêu cầu hoàn hàng',
                message: messageText,
                link: `/orders/my-orders`,
                type: 'order_status'
            });

            const io = req.app.get('io');
            if (io) {
                io.to('user_' + order.user_id.toString()).emit('order_status_update', {
                    orderId: order._id,
                    status: newStatus,
                    message: messageText
                });
            }

            res.json({ success: true });
        } catch (err) {
            console.error('Staff process return error:', err);
            res.json({ success: false, message: err.message });
        }
    }

    async customers(req, res) {
        try {
            const users = await this.userModel.getAllUsers();
            res.render('staff/customers', { title: 'Danh sách khách hàng', users });
        } catch (error) {
            res.status(500).send('Lỗi máy chủ');
        }
    }

    // --- Shift Management ---

    async shiftsPage(req, res) {
        try {
            res.render('staff/shifts', { 
                title: 'Lịch làm việc',
                path: '/staff/shifts',
                user: req.session.user
            });
        } catch (error) {
            console.error('Lỗi khi render trang lịch làm việc:', error);
            res.status(500).send('Lỗi server');
        }
    }

    async shiftsApi(req, res) {
        try {
            const { start, end } = req.query;
            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Thiếu thời gian start/end' });
            }
            
            const startDate = start.split('T')[0];
            const endDate = end.split('T')[0];

            const shifts = await this.shiftModel.getShiftsByUser(req.session.user.id, startDate, endDate);
            
            const events = [];
            shifts.forEach(shift => {
                let shiftColor = '';
                let shiftTime = '';
                let title = 'Ca làm việc';

                if (shift.type === 'morning') {
                    shiftColor = '#10b981';
                    shiftTime = '08:00 - 12:00';
                    title = 'Ca Sáng';
                } else if (shift.type === 'afternoon') {
                    shiftColor = '#3b82f6';
                    shiftTime = '13:00 - 17:00';
                    title = 'Ca Chiều';
                } else if (shift.type === 'evening') {
                    shiftColor = '#f59e0b';
                    shiftTime = '18:00 - 22:00';
                    title = 'Ca Tối';
                }

                events.push({
                    id: shift._id,
                    title: title,
                    start: shift.date,
                    allDay: true,
                    backgroundColor: shiftColor,
                    borderColor: shiftColor,
                    extendedProps: {
                        type: shift.type,
                        time: shiftTime,
                        checkIn: shift.checkIn,
                        checkOut: shift.checkOut
                    }
                });
            });

            res.json(events);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu ca làm:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    async checkIn(req, res) {
        try {
            const shiftId = req.params.id;
            const shift = await this.shiftModel.findById(shiftId);
            
            if (!shift || shift.user.toString() !== req.session.user.id.toString()) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền điểm danh ca này' });
            }

            if (shift.checkIn) {
                return res.status(400).json({ success: false, message: 'Ca này đã được check-in' });
            }

            // Có thể thêm logic kiểm tra thời gian hiện tại có nằm trong khoảng ca làm không
            await this.shiftModel.checkIn(shiftId);
            res.json({ success: true, message: 'Check-in thành công' });
        } catch (error) {
            console.error('Lỗi check-in:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    async checkOut(req, res) {
        try {
            const shiftId = req.params.id;
            const shift = await this.shiftModel.findById(shiftId);
            
            if (!shift || shift.user.toString() !== req.session.user.id.toString()) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền điểm danh ca này' });
            }

            if (!shift.checkIn) {
                return res.status(400).json({ success: false, message: 'Ca này chưa check-in' });
            }

            if (shift.checkOut) {
                return res.status(400).json({ success: false, message: 'Ca này đã được check-out' });
            }

            await this.shiftModel.checkOut(shiftId);
            res.json({ success: true, message: 'Check-out thành công' });
        } catch (error) {
            console.error('Lỗi check-out:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }
}

module.exports = new StaffController();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const Shift = require('../models/Shift');

const STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao hàng',
    cancelled: 'Đã hủy'
};

class AdminController {
    constructor() {
        this.productModel = new Product();
        this.categoryModel = new Category();
        this.orderModel = new Order();
        this.userModel = new User();
        this.couponModel = new Coupon();

        this.dashboard = this.dashboard.bind(this);
        this.products = this.products.bind(this);
        this.createProduct = this.createProduct.bind(this);
        this.updateProduct = this.updateProduct.bind(this);
        this.deleteProduct = this.deleteProduct.bind(this);
        this.orders = this.orders.bind(this);
        this.updateOrderStatus = this.updateOrderStatus.bind(this);
        this.getOrderDetail = this.getOrderDetail.bind(this);
        this.getReturnDetail = this.getReturnDetail.bind(this);
        this.processReturn = this.processReturn.bind(this);
        this.users = this.users.bind(this);
        this.createUser = this.createUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.toggleBlockUser = this.toggleBlockUser.bind(this);
        this.updateRole = this.updateRole.bind(this);
        this.revenue = this.revenue.bind(this);
        this.coupons = this.coupons.bind(this);
        this.createCoupon = this.createCoupon.bind(this);
        this.toggleCoupon = this.toggleCoupon.bind(this);
        this.deleteCoupon = this.deleteCoupon.bind(this);
        this.topCustomers = this.topCustomers.bind(this);

        this.shiftModel = new Shift();
        this.shiftsPage = this.shiftsPage.bind(this);
        this.shiftsApi = this.shiftsApi.bind(this);
        this.assignShifts = this.assignShifts.bind(this);
    }

    async dashboard(req, res) {
        try {
            const year = new Date().getFullYear();
            const [totalProducts, totalOrders, totalUsers, totalRevenue,
                recentOrders, statusStats, monthlyRevenue, topProducts] = await Promise.all([
                    this.productModel.count(),
                    this.orderModel.count(),
                    this.userModel.count({ role: 'user' }),
                    this.orderModel.totalRevenue(),
                    this.orderModel.getAllOrders(),
                    this.orderModel.countByStatus(),
                    this.orderModel.revenueByMonth(year),
                    this.productModel.model.find().sort({ createdAt: -1 }).limit(4).lean()
                ]);
            const months = Array.from({ length: 12 }, (_, i) => {
                const found = monthlyRevenue.find(r => r._id === i + 1);
                return { month: i + 1, revenue: found?.revenue || 0, orders: found?.orders || 0 };
            });
            res.render('admin/dashboard', {
                title: 'Admin Dashboard',
                hideNav: true,
                hideFooter: true,
                totalProducts, totalOrders, totalUsers, totalRevenue,
                recentOrders: recentOrders.slice(0, 5),
                statusStats, months, topProducts
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async products(req, res) {
        try {
            const [products, categories] = await Promise.all([
                this.productModel.findAllWithCategory(),
                this.categoryModel.findAll()
            ]);
            res.render('admin/products', { title: 'Quản lý sản phẩm', products, categories, query: req.query });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async createProduct(req, res) {
        try {
            const { name, description, price, stock, category_id } = req.body;
            const image = req.files?.image?.[0]?.filename || 'default.jpg';
            const images = req.files?.images?.map(f => f.filename) || [];
            await this.productModel.create({ name, description, price, stock, category_id, image, images });
            res.redirect('/admin/products');
        } catch (err) {
            res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
        }
    }

    async updateProduct(req, res) {
        try {
            const { name, description, price, stock, category_id } = req.body;
            const data = { name, description, price, stock, category_id };
            if (req.files?.image?.[0]) data.image = req.files.image[0].filename;
            if (req.files?.images?.length) {
                data.images = req.files.images.map(f => f.filename);
            }
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

            res.render('admin/orders', { 
                title: 'Quản lý đơn hàng', 
                orders,
                statusStats,
                kpi,
                currentStatus: req.query.status || 'all',
                filterStartDate: req.query.startDate || '',
                filterEndDate: req.query.endDate || ''
            });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    // Đổi trạng thái đơn hàng + emit socket cho user
    async updateOrderStatus(req, res) {
        try {
            const { status } = req.body;
            const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status))
                return res.json({ success: false, message: 'Trạng thái không hợp lệ' });

            await this.orderModel.updateStatus(req.params.id, status);

            // Lấy user_id từ đơn hàng để emit thông báo
            const order = await this.orderModel.model.findById(req.params.id).lean();
            if (order) {
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
            console.error('Admin update order status error:', err.message);
            res.json({ success: false, message: err.message });
        }
    }

    // Lấy thông tin hoàn hàng
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

    // Xử lý yêu cầu hoàn hàng
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

            // Thông báo cho user
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
            console.error('Process return error:', err);
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
            if (existing) return res.json({ success: false, message: 'Email đã tồn tại' });
            if (role === 'staff') await this.userModel.createStaff(name, email, password);
            else await this.userModel.register(name, email, password);
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
            if (req.params.id === req.session.user.id)
                return res.json({ success: false, message: 'Không thể xóa tài khoản đang đăng nhập' });
            await this.userModel.deleteUser(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async toggleBlockUser(req, res) {
        try {
            if (req.params.id === req.session.user.id)
                return res.json({ success: false, message: 'Không thể khóa tài khoản đang đăng nhập' });
            await this.userModel.toggleBlock(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async updateRole(req, res) {
        try {
            const { role } = req.body;
            if (!['user', 'staff'].includes(role))
                return res.json({ success: false, message: 'Role không hợp lệ' });
            await this.userModel.updateRole(req.params.id, role);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async revenue(req, res) {
        try {
            let dateFilter = null;
            if (req.query.from && req.query.to) {
                const start = new Date(req.query.from);
                start.setHours(0, 0, 0, 0);
                const end = new Date(req.query.to);
                end.setHours(23, 59, 59, 999);
                dateFilter = { $gte: start, $lte: end };
            }

            const year = parseInt(req.query.year) || new Date().getFullYear();
            
            const [chartData, totalRevenue, topProducts, statsArray] = await Promise.all([
                this.orderModel.revenueChartData(dateFilter),
                this.orderModel.totalRevenue(dateFilter),
                this.orderModel.topProducts(5, dateFilter),
                this.orderModel.countByStatus(dateFilter)
            ]);

            const statusStats = {};
            statsArray.forEach(st => {
                statusStats[st._id] = st.count;
            });

            // Format chart data
            const labels = [];
            const revenueData = [];
            const ordersData = [];

            if (chartData.length > 0) {
                chartData.forEach(item => {
                    labels.push(`${item._id.day}/${item._id.month}/${item._id.year}`);
                    revenueData.push(item.revenue);
                    ordersData.push(item.orders);
                });
            }

            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.json({
                    success: true,
                    data: {
                        totalRevenue,
                        statusStats,
                        chart: { labels, revenue: revenueData, orders: ordersData },
                        topProducts
                    }
                });
            }

            // Fallback for initial render
            const months = chartData.map(item => ({
                month: item._id.month,
                revenue: item.revenue,
                orders: item.orders
            }));

            res.render('admin/revenue', { title: 'Báo cáo doanh thu', months, totalRevenue, topProducts, statusStats, year });
        } catch (err) {
            console.error(err);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async topCustomers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const topCustomers = await this.orderModel.model.aggregate([
                { $match: { status: 'delivered' } },
                {
                    $group: {
                        _id: '$user_id',
                        totalSpent: { $sum: '$total_price' },
                        ordersCount: { $sum: 1 }
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 1,
                        name: '$user.name',
                        email: '$user.email',
                        totalSpent: 1,
                        ordersCount: 1
                    }
                }
            ]);

            res.json({ success: true, data: topCustomers });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── Quản lý Coupon ──────────────────────────────────────
    async coupons(req, res) {
        try {
            const coupons = await this.couponModel.getAll();
            res.render('admin/coupons', { title: 'Quản lý mã giảm giá', coupons });
        } catch (err) {
            res.status(500).render('error', { title: 'Lỗi', status: 500, message: err.message });
        }
    }

    async createCoupon(req, res) {
        try {
            const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt } = req.body;
            await this.couponModel.create({
                code: code.toUpperCase().trim(),
                type,
                value: +value,
                minOrder: +minOrder || 0,
                maxDiscount: maxDiscount ? +maxDiscount : null,
                usageLimit: usageLimit ? +usageLimit : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            });
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message.includes('duplicate') ? 'Mã đã tồn tại' : err.message });
        }
    }

    async toggleCoupon(req, res) {
        try {
            const coupon = await this.couponModel.findById(req.params.id);
            await this.couponModel.update(req.params.id, { isActive: !coupon.isActive });
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    async deleteCoupon(req, res) {
        try {
            await this.couponModel.model.findByIdAndDelete(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }
    // --- Shift Management ---

    async shiftsPage(req, res) {
        try {
            // Lấy danh sách nhân viên để hiển thị trong modal xếp lịch
            const staffs = await this.userModel.model.find({ role: 'staff' }).select('name email avatar').lean();
            res.render('admin/shifts', { 
                title: 'Phân ca làm việc',
                path: '/admin/shifts',
                user: req.session.user,
                staffs
            });
        } catch (error) {
            console.error('Lỗi khi render trang xếp lịch:', error);
            res.status(500).send('Lỗi server');
        }
    }

    async shiftsApi(req, res) {
        try {
            const { start, end } = req.query; // FullCalendar truyền start và end dạng ISO string
            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Thiếu thời gian start/end' });
            }
            
            // Format to YYYY-MM-DD
            const startDate = start.split('T')[0];
            const endDate = end.split('T')[0];

            const shifts = await this.shiftModel.getShiftsByDateRange(startDate, endDate);
            
            // Format data cho FullCalendar
            const events = [];
            shifts.forEach(shift => {
                let shiftColor = '';
                let shiftTime = '';
                let title = shift.user.name;

                if (shift.type === 'morning') {
                    shiftColor = '#10b981'; // Green
                    shiftTime = '08:00 - 12:00';
                } else if (shift.type === 'afternoon') {
                    shiftColor = '#3b82f6'; // Blue
                    shiftTime = '13:00 - 17:00';
                } else if (shift.type === 'evening') {
                    shiftColor = '#f59e0b'; // Orange
                    shiftTime = '18:00 - 22:00';
                }

                events.push({
                    id: shift._id,
                    title: `${title}`,
                    start: shift.date, // Gán vào ngày
                    allDay: true,
                    backgroundColor: shiftColor,
                    borderColor: shiftColor,
                    extendedProps: {
                        userId: shift.user._id,
                        type: shift.type,
                        time: shiftTime,
                        avatar: shift.user.avatar
                    }
                });
            });

            res.json(events);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu ca làm:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    async assignShifts(req, res) {
        try {
            const { date, type, staffIds } = req.body;
            
            if (!date || !type) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin ngày hoặc ca' });
            }

            // Danh sách nhân viên đang được chọn cho ngày và ca đó
            const currentStaffIds = Array.isArray(staffIds) ? staffIds : (staffIds ? [staffIds] : []);

            // Tìm các ca làm việc hiện tại của ngày và ca này
            const existingShifts = await this.shiftModel.model.find({ date, type }).lean();
            const existingStaffIds = existingShifts.map(s => s.user.toString());

            // Tìm những staff mới được thêm vào
            const staffsToAdd = currentStaffIds.filter(id => !existingStaffIds.includes(id));
            
            // Tìm những staff bị xóa khỏi ca
            const staffsToRemove = existingStaffIds.filter(id => !currentStaffIds.includes(id));

            // Thực hiện thêm
            for (let id of staffsToAdd) {
                await this.shiftModel.assignShift(id, date, type);
                
                // Tạo thông báo cho nhân viên
                await Notification.create({
                    user_id: id,
                    title: 'Lịch làm việc mới',
                    message: `Bạn đã được phân công ca làm việc vào ngày ${new Date(date).toLocaleDateString('vi-VN')} (${type})`,
                    type: 'system',
                    link: '/staff/shifts'
                });
            }

            // Thực hiện xóa
            for (let id of staffsToRemove) {
                await this.shiftModel.removeShift(id, date, type);
                
                // Tạo thông báo cho nhân viên
                await Notification.create({
                    user_id: id,
                    title: 'Hủy lịch làm việc',
                    message: `Lịch làm việc ngày ${new Date(date).toLocaleDateString('vi-VN')} (${type}) của bạn đã bị hủy`,
                    type: 'system',
                    link: '/staff/shifts'
                });
            }

            res.json({ success: true, message: 'Cập nhật phân ca thành công' });
        } catch (error) {
            console.error('Lỗi khi phân ca:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
        }
    }
}

module.exports = new AdminController();

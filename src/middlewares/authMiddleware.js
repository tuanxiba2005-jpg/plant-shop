class AuthMiddleware {
    constructor() {
        this.isLoggedIn = this.isLoggedIn.bind(this);
        this.isAdmin = this.isAdmin.bind(this);
        this.isUser = this.isUser.bind(this);
        this.isStaff = this.isStaff.bind(this);
    }

    // Kiểm tra đã đăng nhập chưa
    isLoggedIn(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/user/login');
        }
        next();
    }

    // Chỉ admin mới vào được
    isAdmin(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/user/login');
        }
        if (req.session.user.role !== 'admin') {
            return res.status(403).render('error', {
                title: 'Lỗi',
                status: 403,
                message: 'Bạn không có quyền truy cập trang này!'
            });
        }
        next();
    }
    // Chỉ admin hoặc staff mới vào được
isStaff(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/user/login');
    }
    if (req.session.user.role !== 'admin' && req.session.user.role !== 'staff') {
        return res.status(403).render('error', {
            title: 'Lỗi',
            status: 403,
            message: 'Bạn không có quyền truy cập trang này!'
        });
    }
    next();
}

    // Chỉ user thường mới vào được (admin không vào được)
    isUser(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/user/login');
        }
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }
        next();
    }
}

module.exports = new AuthMiddleware();
const User = require('../models/User');

class UserController {
    constructor() {
        this.userModel = new User();
        this.showLogin = this.showLogin.bind(this);
        this.showRegister = this.showRegister.bind(this);
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.logout = this.logout.bind(this);
        this.profile = this.profile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.changePassword = this.changePassword.bind(this);
    }

    showLogin(req, res) {
        if (req.session.user) return res.redirect('/');
        res.render('user/login', { title: 'Đăng nhập', error: null });
    }

    async showRegister(req, res) {
        if (req.session.user) return res.redirect('/');
        res.render('user/register', { title: 'Đăng ký', error: null });
    }

async login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await this.userModel.findByEmail(email);

        if (!user || !(await this.userModel.verifyPassword(password, user.password))) {
            return res.status(401).render('user/login', {  // thêm status(401)
                title: 'Đăng nhập',
                error: 'Email hoặc mật khẩu không đúng'
            });
        }
        if (user.isBlocked) {
            return res.status(401).render('user/login', {  // thêm status(401)
                title: 'Đăng nhập',
                error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
            });
        }

        req.session.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        if (user.role === 'admin') return res.redirect('/admin/dashboard');
        if (user.role === 'staff') return res.redirect('/staff/dashboard');
        res.redirect('/');
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).render('user/login', { title: 'Đăng nhập', error: 'Lỗi server' });
    }
}

    async register(req, res) {
        try {
            const { name, email, password, confirmPassword } = req.body;
            if (password !== confirmPassword) {
                return res.render('user/register', { title: 'Đăng ký', error: 'Mật khẩu không khớp' });
            }
            const existing = await this.userModel.findByEmail(email);
            if (existing) {
                return res.render('user/register', { title: 'Đăng ký', error: 'Email đã tồn tại' });
            }
            await this.userModel.register(name, email, password);
            res.redirect('/user/login');
        } catch (err) {
            res.render('user/register', { title: 'Đăng ký', error: 'Lỗi server' });
        }
    }

    logout(req, res) {
        req.session.destroy();
        res.redirect('/');
    }

   async profile(req, res) {
    try {
        const user = await this.userModel.findById(req.session.user.id);
        res.render('user/profile', {
            title: 'Tài khoản',
            userInfo: user,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        res.redirect('/');
    }
}

    // Cập nhật họ tên + email
    async updateProfile(req, res) {
        try {
            const { name, email } = req.body;
            const userId = req.session.user.id;

            if (!name || !email) {
                return res.redirect('/user/profile?error=Vui lòng điền đầy đủ thông tin');
            }

            // Kiểm tra email đã tồn tại chưa (trừ chính mình)
            const existing = await this.userModel.findByEmail(email);
            if (existing && existing._id.toString() !== userId) {
                return res.redirect('/user/profile?error=Email đã được sử dụng');
            }

            await this.userModel.update(userId, { name, email });

            // Cập nhật lại session
            req.session.user.name = name;
            req.session.user.email = email;

            res.redirect('/user/profile?success=Cập nhật thông tin thành công');
        } catch (err) {
            console.error('Update profile error:', err);
            res.redirect('/user/profile?error=Lỗi server');
        }
    }

    // Đổi mật khẩu
    async changePassword(req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user.id;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.redirect('/user/profile?error=Vui lòng điền đầy đủ thông tin&tab=password');
        }
        if (newPassword.length < 6) {
            return res.redirect('/user/profile?error=Mật khẩu mới tối thiểu 6 ký tự&tab=password');
        }
        if (newPassword !== confirmPassword) {
            return res.redirect('/user/profile?error=Mật khẩu mới không khớp&tab=password');
        }

        const user = await this.userModel.findById(userId);
        const isMatch = await this.userModel.verifyPassword(currentPassword, user.password);
        if (!isMatch) {
            return res.redirect('/user/profile?error=Mật khẩu hiện tại không đúng&tab=password');
        }

        // Kiểm tra mật khẩu mới phải khác mật khẩu cũ
        const isSame = await this.userModel.verifyPassword(newPassword, user.password);
        if (isSame) {
            return res.redirect('/user/profile?error=Mật khẩu mới phải khác mật khẩu hiện tại&tab=password');
        }

        await this.userModel.updateUser(userId, { password: newPassword });
        res.redirect('/user/profile?success=Đổi mật khẩu thành công&tab=password');
    } catch (err) {
        console.error('Change password error:', err);
        res.redirect('/user/profile?error=Lỗi server&tab=password');
     }
    }
}

module.exports = new UserController();
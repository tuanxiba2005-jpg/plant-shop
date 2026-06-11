const crypto = require('crypto');
const User = require('../models/User');
const Order = require('../models/Order');
const Wishlist = require('../models/wishlist');
const { sendResetPassword } = require('../services/emailService');

class UserController {
    constructor() {
        this.userModel = new User();
        this.orderModel = new Order();
        this.wishlistModel = new Wishlist();
        this.showLogin          = this.showLogin.bind(this);
        this.showRegister       = this.showRegister.bind(this);
        this.login              = this.login.bind(this);
        this.register           = this.register.bind(this);
        this.logout             = this.logout.bind(this);
        this.profile            = this.profile.bind(this);
        this.updateProfile      = this.updateProfile.bind(this);
        this.changePassword     = this.changePassword.bind(this);
        this.showForgotPassword = this.showForgotPassword.bind(this);
        this.forgotPassword     = this.forgotPassword.bind(this);
        this.showResetPassword  = this.showResetPassword.bind(this);
        this.resetPassword      = this.resetPassword.bind(this);
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
                return res.status(401).render('user/login', {
                    title: 'Đăng nhập',
                    error: 'Email hoặc mật khẩu không đúng'
                });
            }
            if (user.isBlocked) {
                return res.status(401).render('user/login', {
                    title: 'Đăng nhập',
                    error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
                });
            }

            // Regenerate session để tránh Session Fixation
            req.session.regenerate((err) => {
                if (err) return res.status(500).render('user/login', { title: 'Đăng nhập', error: 'Lỗi server' });
                req.session.user = {
                    id:    user._id.toString(),
                    name:  user.name,
                    email: user.email,
                    role:  user.role
                };
                if (user.role === 'admin') return res.redirect('/admin/dashboard');
                if (user.role === 'staff') return res.redirect('/staff/dashboard');
                res.redirect('/');
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).render('user/login', { title: 'Đăng nhập', error: 'Lỗi server' });
        }
    }

    async register(req, res) {
        try {
            const Joi = require('joi');
            const schema = Joi.object({
                name: Joi.string().min(2).max(50).required().messages({
                    'string.empty': 'Vui lòng nhập họ tên',
                    'string.min': 'Họ tên tối thiểu 2 ký tự'
                }),
                email: Joi.string().email().required().messages({
                    'string.empty': 'Vui lòng nhập email',
                    'string.email': 'Email không hợp lệ'
                }),
                password: Joi.string()
                    .min(8)
                    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
                    .required()
                    .messages({
                        'string.empty': 'Vui lòng nhập mật khẩu',
                        'string.min': 'Mật khẩu tối thiểu 8 ký tự',
                        'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%^&*)'
                    }),
                confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
                    'any.only': 'Mật khẩu xác nhận không khớp'
                })
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.render('user/register', { title: 'Đăng ký', error: error.details[0].message });
            }

            const { name, email, password } = value;
            
            const existing = await this.userModel.findByEmail(email);
            if (existing) {
                return res.render('user/register', { title: 'Đăng ký', error: 'Email đã tồn tại' });
            }
            
            // Tạm thời bỏ qua xác thực email, đăng ký xong là isVerified = true
            await this.userModel.register(name, email, password, null);
            
            res.render('user/login', { 
                title: 'Đăng nhập', 
                error: null,
                success: 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.' 
            });
        } catch (err) {
            console.error('Register error:', err);
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
            const orders = await this.orderModel.getOrdersByUser(req.session.user.id);
            const wishlists = await this.wishlistModel.getByUser(req.session.user.id);
            res.render('user/profile', {
                title:    'Dashboard',
                userInfo: user,
                orders:   orders,
                wishlists: wishlists,
                success:  req.query.success || null,
                error:    req.query.error   || null,
                layout:   false // Indicate we don't need header/footer if we were using express-ejs-layouts
            });
        } catch (err) {
            res.redirect('/');
        }
    }

    async updateProfile(req, res) {
        try {
            const { name, email } = req.body;
            const userId = req.session.user.id;

            if (!name || !email) {
                return res.redirect('/user/profile?error=Vui lòng điền đầy đủ thông tin');
            }

            const existing = await this.userModel.findByEmail(email);
            if (existing && existing._id.toString() !== userId) {
                return res.redirect('/user/profile?error=Email đã được sử dụng');
            }

            await this.userModel.update(userId, { name, email });
            req.session.user.name  = name;
            req.session.user.email = email;

            res.redirect('/user/profile?success=Cập nhật thông tin thành công');
        } catch (err) {
            console.error('Update profile error:', err);
            res.redirect('/user/profile?error=Lỗi server');
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.session.user.id;

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.redirect('/user/profile?error=Vui lòng điền đầy đủ thông tin&tab=password');
            }
            
            const regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])');
            if (newPassword.length < 8 || !regex.test(newPassword)) {
                return res.redirect('/user/profile?error=Mật khẩu mới tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt&tab=password');
            }
            
            if (newPassword !== confirmPassword) {
                return res.redirect('/user/profile?error=Mật khẩu mới không khớp&tab=password');
            }

            const user    = await this.userModel.findById(userId);
            const isMatch = await this.userModel.verifyPassword(currentPassword, user.password);
            if (!isMatch) {
                return res.redirect('/user/profile?error=Mật khẩu hiện tại không đúng&tab=password');
            }

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

    // ─── Quên mật khẩu ───────────────────────────────────────────────────────

    showForgotPassword(req, res) {
        if (req.session.user) return res.redirect('/');
        res.render('user/forgot-password', {
            title:   'Quên mật khẩu',
            error:   null,
            success: null
        });
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await this.userModel.findByEmail(email);

            // Luôn hiện thông báo thành công dù email có tồn tại hay không
            // (tránh lộ thông tin email nào đã đăng ký)
            const successMsg = 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.';

            if (user) {
                const token = crypto.randomBytes(32).toString('hex');
                await this.userModel.saveResetToken(email, token);
                await sendResetPassword(email, token);
            }

            res.render('user/forgot-password', {
                title:   'Quên mật khẩu',
                error:   null,
                success: successMsg
            });
        } catch (err) {
            console.error('Forgot password error:', err);
            res.render('user/forgot-password', {
                title:   'Quên mật khẩu',
                error:   'Lỗi server. Vui lòng thử lại.',
                success: null
            });
        }
    }

    async showResetPassword(req, res) {
        try {
            const { token } = req.params;
            const user = await this.userModel.findByResetToken(token);

            if (!user) {
                return res.render('user/forgot-password', {
                    title:   'Quên mật khẩu',
                    error:   'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
                    success: null
                });
            }

            res.render('user/reset-password', {
                title: 'Đặt lại mật khẩu',
                token,
                error: null
            });
        } catch (err) {
            console.error('Show reset password error:', err);
            res.redirect('/user/forgot-password');
        }
    }

    async resetPassword(req, res) {
        try {
            const { token }                    = req.params;
            const { password, confirmPassword } = req.body;

            if (!password || !confirmPassword) {
                return res.render('user/reset-password', {
                    title: 'Đặt lại mật khẩu',
                    token,
                    error: 'Vui lòng điền đầy đủ thông tin'
                });
            }
            const regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])');
            if (password.length < 8 || !regex.test(password)) {
                return res.render('user/reset-password', {
                    title: 'Đặt lại mật khẩu',
                    token,
                    error: 'Mật khẩu mới tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
                });
            }
            if (password !== confirmPassword) {
                return res.render('user/reset-password', {
                    title: 'Đặt lại mật khẩu',
                    token,
                    error: 'Mật khẩu không khớp'
                });
            }

            const user = await this.userModel.findByResetToken(token);
            if (!user) {
                return res.render('user/forgot-password', {
                    title:   'Quên mật khẩu',
                    error:   'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
                    success: null
                });
            }

            await this.userModel.resetPassword(user._id, password);
            res.redirect('/user/login?success=Đặt lại mật khẩu thành công. Vui lòng đăng nhập.');
        } catch (err) {
            console.error('Reset password error:', err);
            res.render('user/reset-password', {
                title: 'Đặt lại mật khẩu',
                token: req.params.token,
                error: 'Lỗi server. Vui lòng thử lại.'
            });
        }
    }
}

module.exports = new UserController();

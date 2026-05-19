const rateLimit = require('express-rate-limit');

// Giới hạn đăng nhập: tối đa 5 lần / 15 phút
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Chỉ đếm request thất bại (status >= 400)
    handler: (req, res) => {
        // Nếu là API request thì trả JSON, nếu là form thì render lại view
        if (req.headers['content-type']?.includes('application/json')) {
            return res.status(429).json({
                success: false,
                error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
            });
        }
        res.status(429).render('user/login', {
            title: 'Đăng nhập',
            error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
        });
    }
});

// Giới hạn chung cho toàn app: tối đa 100 request / 1 phút
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).render('error', {
            title: 'Lỗi',
            status: 429,
            message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'
        });
    }
});

module.exports = { loginLimiter, generalLimiter };
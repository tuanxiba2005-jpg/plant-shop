const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req),
    handler: (req, res) => {
        res.status(429).render('user/login', {
            title: 'Đăng nhập',
            error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
        });
    }
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req),
    handler: (req, res) => {
        res.status(429).render('error', {
            title: 'Lỗi',
            status: 429,
            message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'
        });
    }
});

module.exports = { loginLimiter, generalLimiter };
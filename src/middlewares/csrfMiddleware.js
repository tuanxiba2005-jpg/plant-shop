const crypto = require('crypto');

// Tạo CSRF token và lưu vào session
const generateToken = (req) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    return req.session.csrfToken;
};

// Middleware xác thực CSRF token
const verifyCsrf = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    const tokenFromBody = req.body?._csrf;
    const tokenFromHeader = req.headers?.['x-csrf-token'];
    const token = tokenFromBody || tokenFromHeader;

    if (!token || token !== req.session.csrfToken) {
        return res.status(403).render('error', {
            title: 'Lỗi',
            status: 403,
            message: 'Yêu cầu không hợp lệ (CSRF token không khớp)'
        });
    }
    next();
};

module.exports = { generateToken, verifyCsrf };
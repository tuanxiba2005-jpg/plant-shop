const express = require('express');
const passport = require('passport');
const router = express.Router();

// ========================
// GOOGLE AUTH
// ========================

// Khởi tạo quy trình đăng nhập Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Xử lý callback từ Google
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/user/login?error=GoogleAuthFailed' }),
    (req, res) => {
        // Đăng nhập thành công, lưu thông tin vào session giống cách hệ thống đang làm
        req.session.user = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        };
        res.redirect('/');
    }
);

// ========================
// FACEBOOK AUTH
// ========================

// Khởi tạo quy trình đăng nhập Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Xử lý callback từ Facebook
router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: '/user/login?error=FacebookAuthFailed' }),
    (req, res) => {
        req.session.user = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        };
        res.redirect('/');
    }
);

module.exports = router;

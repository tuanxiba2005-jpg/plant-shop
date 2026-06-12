const express = require('express');
const router  = express.Router();
const userController  = require('../controllers/UserController');
const authMiddleware  = require('../middlewares/authMiddleware');
const { loginLimiter, generalLimiter } = require('../middlewares/rateLimitMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'public/images/avatars/temp/' });

// Auth
router.get('/login',    userController.showLogin);
router.get('/register', userController.showRegister);
router.post('/register', generalLimiter, userController.register);
router.post('/login', loginLimiter, userController.login);
router.get('/logout',   userController.logout);

// Profile
router.get('/profile',                  authMiddleware.isLoggedIn, userController.profile);
router.post('/profile/update',          authMiddleware.isLoggedIn, userController.updateProfile);
router.post('/profile/change-password', authMiddleware.isLoggedIn, userController.changePassword);
router.post('/profile/avatar',          authMiddleware.isLoggedIn, upload.single('avatar'), userController.uploadAvatar);

// Quên mật khẩu
router.get('/forgot-password',              userController.showForgotPassword);
router.post('/forgot-password', generalLimiter, userController.forgotPassword);
router.get('/reset-password/:token',        userController.showResetPassword);
router.post('/reset-password/:token',       userController.resetPassword);

module.exports = router;
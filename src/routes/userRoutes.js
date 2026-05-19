const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimitMiddleware'); // thêm dòng này

router.get('/login', userController.showLogin);
router.get('/register', userController.showRegister);
router.post('/login', loginLimiter, userController.login); // thêm loginLimiter
router.post('/register', userController.register);
router.get('/logout', userController.logout);
router.get('/profile', authMiddleware.isLoggedIn, userController.profile);
router.post('/profile/update', authMiddleware.isLoggedIn, userController.updateProfile);
router.post('/profile/change-password', authMiddleware.isLoggedIn, userController.changePassword);

module.exports = router;
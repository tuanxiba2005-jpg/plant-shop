const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/login', userController.showLogin);
router.post('/login', userController.login);
router.get('/register', userController.showRegister);
router.post('/register', userController.register);
router.get('/logout', userController.logout);
router.get('/profile', authMiddleware.isLoggedIn, userController.profile);
router.post('/profile/update', authMiddleware.isLoggedIn, userController.updateProfile);
router.post('/profile/change-password', authMiddleware.isLoggedIn, userController.changePassword);

module.exports = router;
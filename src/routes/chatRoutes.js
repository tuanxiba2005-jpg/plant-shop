const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.isLoggedIn);

router.get('/history', chatController.getHistory);
router.get('/admin/history/:userId', authMiddleware.isStaff, chatController.getAdminHistory);

module.exports = router;

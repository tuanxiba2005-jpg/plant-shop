const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.isUser); // Đổi isLoggedIn → isUser

router.get('/', (req, res) => cartController.index(req, res));
router.post('/add', (req, res) => cartController.add(req, res));
router.post('/update', (req, res) => cartController.update(req, res));
router.delete('/remove/:productId', (req, res) => cartController.remove(req, res));

module.exports = router;
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/StaffController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/images/products/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.use(authMiddleware.isStaff);

router.get('/dashboard', staffController.dashboard);

router.get('/products', staffController.products);
router.post('/products/create', upload.single('image'), staffController.createProduct);
router.post('/products/update/:id', upload.single('image'), staffController.updateProduct);

router.get('/orders', staffController.orders);
router.post('/orders/status/:id', staffController.updateOrderStatus);

router.get('/customers', staffController.customers);

module.exports = router;
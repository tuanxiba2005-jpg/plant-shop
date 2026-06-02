const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/images/products/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname).toLowerCase())
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype))
        return cb(new Error('Chỉ cho phép upload file ảnh (jpg, jpeg, png, webp, gif)'), false);
    cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

const uploadSingle = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError)
            return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File quá lớn. Tối đa 5MB.' : err.message });
        if (err)
            return res.status(400).json({ success: false, message: err.message });
        next();
    });
};

router.use(authMiddleware.isAdmin);

// Products
router.get('/dashboard', adminController.dashboard);
router.get('/products', adminController.products);
router.post('/products/create', uploadSingle, adminController.createProduct);
router.post('/products/update/:id', uploadSingle, adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Orders
router.get('/orders', adminController.orders);
router.post('/orders/:id/status', adminController.updateOrderStatus);

// Users
router.get('/users', adminController.users);
router.post('/users/create', adminController.createUser);
router.post('/users/:id/update', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/toggle-block', adminController.toggleBlockUser);
router.post('/users/:id/role', adminController.updateRole);

// Revenue
router.get('/revenue', adminController.revenue);

// Coupons
router.get('/coupons', adminController.coupons);
router.post('/coupons/create', adminController.createCoupon);
router.post('/coupons/:id/toggle', adminController.toggleCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

module.exports = router;

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
    console.log('>>> fileFilter called:', file.originalname, file.mimetype);
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        console.log('>>> Extension bị chặn:', ext);
        return cb(new Error('Chỉ cho phép upload file ảnh (jpg, jpeg, png, webp, gif)'), false);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        console.log('>>> Mime-type bị chặn:', file.mimetype);
        return cb(new Error('File không hợp lệ. Chỉ chấp nhận ảnh jpg, png, webp, gif'), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

const uploadSingle = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File quá lớn. Tối đa 5MB.' });
            }
            return res.status(400).json({ success: false, message: 'Lỗi upload: ' + err.message });
        }
        if (err) {
            console.log('Upload error:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

router.use(authMiddleware.isAdmin);

router.get('/dashboard', adminController.dashboard);
router.get('/products', adminController.products);
router.post('/products/create', (req, res, next) => {
    console.log('>>> Route create được gọi, content-type:', req.headers['content-type']);
    next();
}, uploadSingle, adminController.createProduct);
router.post('/products/update/:id', uploadSingle, adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/orders', adminController.orders);
router.post('/orders/:id/status', adminController.updateOrderStatus);

router.get('/users', adminController.users);
router.post('/users/create', adminController.createUser);
router.post('/users/:id/update', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/toggle-block', adminController.toggleBlockUser);
router.post('/users/:id/role', adminController.updateRole);

router.get('/revenue', adminController.revenue);

module.exports = router;
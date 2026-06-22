const express = require('express');
const router = express.Router();
const staffController = require('../controllers/StaffController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ cho phép tải lên hình ảnh.'), false);
    }
});

const sharp = require('sharp');
const fs = require('fs');
const ImageStore = require('../models/ImageStore');

const processStaffImages = async (req, res, next) => {
    try {
        if (req.file) {
            const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
            const buffer = await sharp(req.file.buffer)
                .resize({ width: 800, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            
            await ImageStore.findOneAndUpdate(
                { filename }, 
                { data: buffer, contentType: 'image/webp' }, 
                { upsert: true }
            ).catch(err => console.error('Lỗi lưu DB:', err));
            
            await fs.promises.writeFile(path.join(__dirname, '../../public/images/products/', filename), buffer).catch(() => {});
            req.file.filename = filename;
        }
        next();
    } catch (err) {
        next(err);
    }
};

router.use(authMiddleware.isStaff);

router.get('/dashboard', staffController.dashboard);

router.get('/products', staffController.products);
router.post('/products/create', upload.single('image'), processStaffImages, staffController.createProduct);
router.post('/products/update/:id', upload.single('image'), processStaffImages, staffController.updateProduct);

// Orders
router.get('/orders', staffController.orders);
router.post('/orders/:id/status', staffController.updateOrderStatus);
router.get('/orders/:id/detail', staffController.getOrderDetail);
router.get('/orders/:id/return-detail', staffController.getReturnDetail);
router.post('/orders/:id/process-return', staffController.processReturn);

router.get('/customers', staffController.customers);

// Chat
const chatController = require('../controllers/ChatController');
router.get('/chat', chatController.adminChat);

module.exports = router;
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/images/products/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.use(authMiddleware.isAdmin);

router.get('/dashboard', adminController.dashboard);
router.get('/products', adminController.products);
router.post('/products/create', upload.single('image'), adminController.createProduct);
router.post('/products/update/:id', upload.single('image'), adminController.updateProduct);
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
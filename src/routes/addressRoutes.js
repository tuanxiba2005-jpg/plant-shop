const express = require('express');
const router  = express.Router();
const addressController = require('../controllers/AddressController');
const authMiddleware    = require('../middlewares/authMiddleware');

// Tất cả route địa chỉ đều cần đăng nhập
router.use(authMiddleware.isLoggedIn);

router.get('/',              addressController.list);
router.post('/',             addressController.add);
router.post('/:id/update',   addressController.update);
router.delete('/:id',        addressController.delete);
router.post('/:id/default',  addressController.setDefault);

module.exports = router;

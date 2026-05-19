const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');

router.get('/', (req, res) => productController.index(req, res));
router.get('/:id', (req, res) => productController.show(req, res));

module.exports = router;
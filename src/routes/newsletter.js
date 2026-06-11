const express = require('express');
const router = express.Router();
const NewsletterController = require('../controllers/NewsletterController');

// POST /newsletter/subscribe
router.post('/subscribe', NewsletterController.subscribe);

module.exports = router;

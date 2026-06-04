const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');

router.get('/', notificationController.getNotifications);
router.post('/mark-read/:id', notificationController.markAsRead);

module.exports = router;

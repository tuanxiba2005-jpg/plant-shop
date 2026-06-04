const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const notifications = await Notification.find({ user_id: req.session.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
            
        const unreadCount = await Notification.countDocuments({ 
            user_id: req.session.user.id, 
            is_read: false 
        });

        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        
        if (id === 'all') {
            await Notification.updateMany(
                { user_id: req.session.user.id, is_read: false },
                { is_read: true }
            );
        } else {
            await Notification.findOneAndUpdate(
                { _id: id, user_id: req.session.user.id },
                { is_read: true }
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

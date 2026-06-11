const Message = require('../models/Message');

class ChatController {
    // API Lấy lịch sử chat của user hiện tại
    async getHistory(req, res) {
        try {
            const userId = req.session.user.id;
            const room = `chat_${userId}`;
            const history = await Message.getHistory(room);

            // Đánh dấu các tin nhắn chưa đọc của Admin gửi cho user là đã đọc
            await Message.model.updateMany(
                { room, is_read: false, sender: { $ne: userId } },
                { $set: { is_read: true } }
            );

            res.json({ success: true, history });
        } catch (error) {
            console.error('Lỗi getHistory:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    // API Lấy lịch sử chat của 1 khách hàng (dành cho Admin)
    async getAdminHistory(req, res) {
        try {
            const customerId = req.params.userId;
            const room = `chat_${customerId}`;
            const history = await Message.getHistory(room);

            // Đánh dấu các tin nhắn chưa đọc của Khách gửi cho Admin là đã đọc
            await Message.model.updateMany(
                { room, is_read: false, sender: customerId },
                { $set: { is_read: true } }
            );

            res.json({ success: true, history });
        } catch (error) {
            console.error('Lỗi getAdminHistory:', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    // Giao diện Admin - Quản lý Chat
    async adminChat(req, res) {
        try {
            const chatList = await Message.getAdminChatList();
            res.render('admin/chat', { 
                title: 'Hỗ trợ khách hàng (Live Chat)',
                path: req.baseUrl + '/chat',
                hideFooter: true,
                chatList 
            });
        } catch (error) {
            console.error('Lỗi adminChat:', error);
            res.status(500).send('Lỗi máy chủ');
        }
    }
}

module.exports = new ChatController();

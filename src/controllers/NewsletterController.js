const Newsletter = require('../models/Newsletter');

const NewsletterController = {
    // Handle AJAX subscription
    subscribe: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email.' });
            }

            // Basic email regex validation
            const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Địa chỉ email không hợp lệ.' });
            }

            // Check if already subscribed
            const existingSubscriber = await Newsletter.findOne({ email });

            if (existingSubscriber) {
                if (existingSubscriber.status === 'unsubscribed') {
                    // Resubscribe
                    existingSubscriber.status = 'subscribed';
                    await existingSubscriber.save();
                    return res.status(200).json({ success: true, message: 'Bạn đã đăng ký nhận bản tin thành công!' });
                }
                return res.status(400).json({ success: false, message: 'Email này đã đăng ký nhận bản tin rồi.' });
            }

            // Create new subscriber
            const newSubscriber = new Newsletter({ email });
            await newSubscriber.save();

            res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đăng ký nhận bản tin!' });
        } catch (error) {
            console.error('Newsletter Subscribe Error:', error);
            res.status(500).json({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
        }
    }
};

module.exports = NewsletterController;

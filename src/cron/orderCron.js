const mongoose = require('mongoose');

async function autoCancelOrders() {
    // Only run if mongoose models are initialized
    if (!mongoose.models.Order || !mongoose.models.Product) return;
    
    const OrderModel = mongoose.model('Order');
    const ProductModel = mongoose.model('Product');

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    try {
        const expiredOrders = await OrderModel.find({
            payment_method: { $in: ['vnpay', 'momo'] },
            status: 'pending',
            payment_status: 'unpaid',
            createdAt: { $lt: fifteenMinsAgo }
        });

        for (const order of expiredOrders) {
            order.status = 'cancelled';
            await order.save();

            // Hoàn lại tồn kho
            for (const item of order.items) {
                if (item.product_id) {
                    await ProductModel.findByIdAndUpdate(
                        item.product_id,
                        { $inc: { stock: item.quantity } }
                    );
                }
            }
            console.log(`[CRON] Đã hủy đơn hàng quá hạn thanh toán: ${order._id}`);
        }
    } catch (err) {
        console.error('[CRON] Lỗi khi tự động hủy đơn hàng quá hạn:', err);
    }
}

// Chạy mỗi 1 phút (60,000 ms)
setInterval(autoCancelOrders, 60 * 1000);

console.log('[CRON] Đã khởi động tác vụ tự động hủy đơn hàng.');

module.exports = autoCancelOrders;

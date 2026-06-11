const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 5000,
    family: 4, // Bắt buộc dùng IPv4
    tls: {
        rejectUnauthorized: false
    }
});

// Gửi email xác nhận đơn hàng
async function sendOrderConfirmation(toEmail, order) {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.product_name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">
                ${parseInt(item.subtotal).toLocaleString('vi-VN')}đ
            </td>
        </tr>
    `).join('');

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: `Plant Shop - Xác nhận đơn hàng #${order._id}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#2d6a4f;padding:20px;text-align:center">
                <h1 style="color:white;margin:0">🌿 Plant Shop</h1>
            </div>
            <div style="padding:24px">
                <h2 style="color:#2d6a4f">Đặt hàng thành công!</h2>
                <p>Xin chào <strong>${order.userName}</strong>,</p>
                <p>Đơn hàng <strong>#${order._id}</strong> của bạn đã được xác nhận.</p>

                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <thead>
                        <tr style="background:#f0f7f4">
                            <th style="padding:10px;text-align:left">Sản phẩm</th>
                            <th style="padding:10px;text-align:center">SL</th>
                            <th style="padding:10px;text-align:right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding:10px;font-weight:bold">Tổng cộng</td>
                            <td style="padding:10px;text-align:right;font-weight:bold;color:#2d6a4f">
                                ${parseInt(order.total).toLocaleString('vi-VN')}đ
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0">
                    <p style="margin:0"><strong>Giao tới:</strong> ${order.address}</p>
                    <p style="margin:4px 0"><strong>Điện thoại:</strong> ${order.phone}</p>
                    <p style="margin:4px 0"><strong>Thanh toán:</strong> ${order.payment_method === 'cod' ? 'Tiền mặt khi nhận hàng' : order.payment_method}</p>
                </div>

                <p>Chúng tôi sẽ liên hệ bạn sớm nhất có thể. Cảm ơn bạn đã tin tưởng Plant Shop!</p>
            </div>
            <div style="background:#f0f7f4;padding:16px;text-align:center;color:#666;font-size:13px">
                Plant Shop - Mang thiên nhiên vào ngôi nhà bạn
            </div>
        </div>
        `
    });
}

// Gửi email reset mật khẩu
async function sendResetPassword(toEmail, resetToken) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/user/reset-password/${resetToken}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: 'Plant Shop - Đặt lại mật khẩu',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#2d6a4f;padding:20px;text-align:center">
                <h1 style="color:white;margin:0">🌿 Plant Shop</h1>
            </div>
            <div style="padding:24px">
                <h2 style="color:#2d6a4f">Đặt lại mật khẩu</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tiếp tục:</p>
                <div style="text-align:center;margin:24px 0">
                    <a href="${resetUrl}"
                       style="background:#2d6a4f;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">
                        Đặt lại mật khẩu
                    </a>
                </div>
                <p style="color:#999;font-size:13px">Link này có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            </div>
            <div style="background:#f0f7f4;padding:16px;text-align:center;color:#666;font-size:13px">
                Plant Shop - Mang thiên nhiên vào ngôi nhà bạn
            </div>
        </div>
        `
    });
}

// Gửi email xác thực tài khoản
async function sendVerificationEmail(toEmail, name, token) {
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/user/verify/${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: 'Plant Shop - Xác thực tài khoản của bạn',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#2d6a4f;padding:20px;text-align:center">
                <h1 style="color:white;margin:0">🌿 Plant Shop</h1>
            </div>
            <div style="padding:24px">
                <h2 style="color:#2d6a4f">Chào mừng ${name} đến với Plant Shop!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Để bắt đầu mua sắm, vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của bạn:</p>
                <div style="text-align:center;margin:24px 0">
                    <a href="${verifyUrl}"
                       style="background:#2d6a4f;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold">
                        Xác thực Email
                    </a>
                </div>
                <p style="color:#999;font-size:13px">Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email.</p>
            </div>
            <div style="background:#f0f7f4;padding:16px;text-align:center;color:#666;font-size:13px">
                Plant Shop - Mang thiên nhiên vào ngôi nhà bạn
            </div>
        </div>
        `
    });
}

module.exports = { sendOrderConfirmation, sendResetPassword, sendVerificationEmail };
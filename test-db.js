require('dotenv').config();
const mongoose = require('mongoose');

console.log('URI:', process.env.MONGODB_URI ? '✅ Đã có' : '❌ Không tìm thấy .env');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Kết nối thành công!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    });
require('dotenv').config();
const mongoose = require('mongoose');

class Database {
    static instance = null;

    constructor() {
        this.isConnected = false;
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async connect() {
        if (this.isConnected) return;
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000, // timeout 5s
                socketTimeoutMS: 45000,
                family: 4 // Bắt buộc dùng IPv4 để tránh lỗi querySrv trên một số mạng
            });
            this.isConnected = true;
            console.log('✅ Kết nối MongoDB Atlas thành công!');

            // Lắng nghe sự kiện mất kết nối
            mongoose.connection.on('disconnected', () => {
                console.log('⚠️  MongoDB Atlas mất kết nối!');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB Atlas kết nối lại thành công!');
                this.isConnected = true;
            });

        } catch (error) {
            console.error('❌ Kết nối MongoDB Atlas thất bại:', error.message);
            process.exit(1);
        }
    }
}

module.exports = Database;
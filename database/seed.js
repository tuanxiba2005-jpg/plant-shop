require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plant_shop');
    console.log('✅ Kết nối MongoDB');

    // Xóa data cũ
    await mongoose.connection.dropDatabase();
    console.log('🗑️  Đã xóa database cũ');

    // Tạo Categories
    const Category = mongoose.model('Category', new mongoose.Schema({
        name: String, description: String
    }));

    const categories = await Category.insertMany([
        { name: 'Cây trong nhà',  description: 'Các loại cây phù hợp trồng trong nhà' },
        { name: 'Cây ngoài trời', description: 'Các loại cây trồng ngoài trời, sân vườn' },
        { name: 'Cây xương rồng', description: 'Các loại xương rồng và cây mọng nước' },
        { name: 'Cây phong thủy', description: 'Cây mang lại may mắn, tài lộc' }
    ]);
    console.log('✅ Tạo categories');

    // Tạo Products
    const Product = mongoose.model('Product', new mongoose.Schema({
        name: String, description: String,
        price: Number, stock: Number,
        image: String, category_id: mongoose.Schema.Types.ObjectId
    }));

    await Product.insertMany([
        { name: 'Cây Kim Tiền',  description: 'Cây phong thủy mang lại tài lộc',        price: 150000, stock: 50,  image: 'kim-tien.jpg',   category_id: categories[3]._id },
        { name: 'Cây Lưỡi Hổ',  description: 'Cây lọc không khí tốt, chịu bóng tốt',   price: 120000, stock: 30,  image: 'luoi-ho.jpg',    category_id: categories[0]._id },
        { name: 'Cây Sen Đá',    description: 'Cây mọng nước xinh xắn, ít cần tưới',    price: 80000,  stock: 100, image: 'sen-da.jpg',     category_id: categories[2]._id },
        { name: 'Cây Trầu Bà',  description: 'Cây leo dễ trồng, phù hợp để bàn',       price: 90000,  stock: 40,  image: 'trau-ba.jpg',    category_id: categories[0]._id },
        { name: 'Cây Xương Rồng',description: 'Cây xương rồng cảnh đẹp, độc đáo',      price: 70000,  stock: 60,  image: 'xuong-rong.jpg', category_id: categories[2]._id },
        { name: 'Cây Phát Tài', description: 'Cây phong thủy phổ biến, may mắn',        price: 200000, stock: 25,  image: 'phat-tai.jpg',   category_id: categories[3]._id },
        { name: 'Hoa Hồng',     description: 'Hoa hồng đỏ thơm ngát, trồng ngoài trời',price: 180000, stock: 35,  image: 'hoa-hong.jpg',   category_id: categories[1]._id },
        { name: 'Cây Ngọc Ngân',description: 'Cây cảnh sang trọng cho nội thất',        price: 350000, stock: 15,  image: 'ngoc-ngan.jpg',  category_id: categories[0]._id }
    ]);
    console.log('✅ Tạo products');

    // Tạo Admin
    const User = mongoose.model('User', new mongoose.Schema({
        name: String, email: String,
        password: String, role: String
    }));

    const hashed = await bcrypt.hash('password', 10);
    await User.create({
        name: 'Admin',
        email: 'admin@plantshop.com',
        password: hashed,
        role: 'admin'
    });
    console.log('✅ Tạo admin');

    console.log('\n🎉 Seed data thành công!');
    console.log('👤 Admin: admin@plantshop.com / password');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Lỗi seed:', err);
    process.exit(1);
});
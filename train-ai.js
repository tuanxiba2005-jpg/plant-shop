require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Ép NodeJS dùng DNS của Google và Cloudflare để tránh bị nhà mạng VN chặn
dns.setServers(['8.8.8.8', '1.1.1.1']);

const aiService = require('./src/services/aiService');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function train() {
    try {
        console.log('⏳ Đang kết nối CSDL MongoDB (Bỏ qua DNS nhà mạng)...');
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4,
            serverSelectionTimeoutMS: 60000,
            connectTimeoutMS: 60000,
        });
        console.log('✅ Đã kết nối MongoDB thành công!');

        console.log('🔄 Bắt đầu quét sản phẩm...');
        const productModel = new Product();
        const categoryModel = new Category();

        // Chỉ lấy những sản phẩm chưa có embedding hoặc embedding trống
        const products = await productModel.model.find({ 
            $or: [
                { embedding: { $exists: false } },
                { embedding: { $size: 0 } }
            ]
        });

        if (products.length === 0) {
            console.log('✅ Tất cả sản phẩm đã được AI học xong! Không cần train thêm.');
            process.exit(0);
        }

        console.log(`Tiến hành cho AI học ${products.length} sản phẩm...`);
        let count = 0;

        for (const p of products) {
            let catName = '';
            if (p.category_id) {
                const cat = await categoryModel.findById(p.category_id);
                if (cat) catName = cat.name;
            }

            const textToEmbed = aiService.createProductTextToEmbed(p, catName);
            const vector = await aiService.generateEmbedding(textToEmbed);

            if (vector && vector.length > 0) {
                p.embedding = vector;
                await p.save();
                count++;
                console.log(`[${count}/${products.length}] 🧠 AI đã học thuộc: ${p.name}`);
            } else {
                console.log(`❌ Lỗi khi học: ${p.name}`);
            }
            
            // Tránh rate limit của API (Sleep 1 giây mỗi request)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`🎉 HOÀN TẤT! AI đã học thành công ${count}/${products.length} sản phẩm.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi trong quá trình train:', error);
        process.exit(1);
    }
}

train();

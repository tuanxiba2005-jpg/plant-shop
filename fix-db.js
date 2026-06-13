require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function fixDB() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const pModel = new Product();
        
        console.log('Fixing Xương Rồng Cầu Vồng...');
        await pModel.model.updateOne(
            { name: /Cầu Vồng/i },
            { $set: { image: 'xuongrongcauvong.jpg' } }
        );

        console.log('Fixing Xương Rồng Gymno...');
        await pModel.model.updateOne(
            { name: /Gymno/i },
            { $set: { image: 'xuongronggymno.png' } }
        );

        console.log('Fixing Xương Rồng Kim Hổ...');
        await pModel.model.updateOne(
            { name: /Kim Hổ/i },
            { $set: { image: 'xuongrongkimho.jpg' } }
        );

        console.log('Fixing any missing default images...');
        await pModel.model.updateMany(
            { image: { $in: [null, '', 'default.jpg'] } },
            { $set: { image: 'default.jpg' } }
        );

        console.log('All done! You can restart the app and check the shop page.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

fixDB();

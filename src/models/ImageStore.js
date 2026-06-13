const mongoose = require('mongoose');

const imageStoreSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    data: {
        type: Buffer,
        required: true
    },
    contentType: {
        type: String,
        default: 'image/webp'
    }
}, { timestamps: true });

const ImageStore = mongoose.model('ImageStore', imageStoreSchema);

module.exports = ImageStore;

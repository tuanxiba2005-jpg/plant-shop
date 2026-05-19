const mongoose = require('mongoose');
const Model = require('./Model');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' }
}, { timestamps: true });

class Category extends Model {
    constructor() {
        super(categorySchema, 'Category');
    }
}

module.exports = Category;
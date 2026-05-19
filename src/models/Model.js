const mongoose = require('mongoose');

class Model {
    constructor(schema, modelName) {
        // Tránh tạo model trùng khi nodemon reload
        this.model = mongoose.models[modelName] 
            || mongoose.model(modelName, schema);
    }

    async findAll(conditions = {}) {
        return await this.model.find(conditions).lean();
    }

    async findById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await this.model.findById(id).lean();
    }

    async create(data) {
        const doc = new this.model(data);
        const saved = await doc.save();
        return saved;
    }

    async update(id, data) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await this.model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async delete(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await this.model.findByIdAndDelete(id);
    }

    async count(conditions = {}) {
        return await this.model.countDocuments(conditions);
    }
}

module.exports = Model;
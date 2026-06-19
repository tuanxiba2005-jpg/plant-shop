const { GoogleGenAI } = require('@google/genai');

class AIService {
    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    /**
     * Tạo vector embedding cho text
     * @param {string} text 
     * @returns {Promise<number[]>} Mảng vector 768 chiều
     */
    async generateEmbedding(text) {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️ CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY trong .env');
            return null;
        }

        try {
            const result = await this.ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: text,
            });
            return result.embeddings[0].values;
        } catch (error) {
            console.error('❌ Lỗi khi gọi Gemini API:', error);
            return null;
        }
    }

    /**
     * Tiện ích kết hợp thông tin sản phẩm thành 1 chuỗi để huấn luyện AI
     */
    createProductTextToEmbed(product, categoryName = '') {
        return `Tên cây: ${product.name}. 
Giá bán: ${product.price} VNĐ. 
Danh mục: ${categoryName}. 
Đặc điểm và cách chăm sóc: ${product.description}`;
    }
}

module.exports = new AIService();

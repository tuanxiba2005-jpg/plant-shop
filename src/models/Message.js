const mongoose = require('mongoose');
const Model = require('./Model');

const messageSchema = new mongoose.Schema({
    room: { type: String, required: true }, // 'chat_<userId>'
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    is_read: { type: Boolean, default: false }
}, { timestamps: true });

class Message extends Model {
    constructor() {
        super(messageSchema, 'Message');
    }

    async getHistory(room) {
        return await this.model.find({ room }).populate('sender', 'fullname role').sort({ createdAt: 1 }).lean();
    }

    async getAdminChatList() {
        // Return a list of unique users who have sent messages to staff
        // A simple way is to aggregate distinct rooms, then populate user
        const rooms = await this.model.distinct('room');
        const userIds = rooms.map(r => r.replace('chat_', ''));
        const User = require('./User'); // Assuming User model exposes mongoose model
        
        // Find users, but we also want to know the last message and unread count
        // An aggregation is better
        return await this.model.aggregate([
            { $sort: { createdAt: -1 } },
            { 
                $group: { 
                    _id: '$room', 
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: { 
                        $sum: { 
                            $cond: [{ $and: [{ $eq: ['$is_read', false] }, { $ne: ['$sender', null] }] }, 1, 0] 
                        } 
                    }
                } 
            },
            // Lookup user
            {
                $lookup: {
                    from: 'users', // Collection name
                    let: { userId: { $toObjectId: { $substr: ['$_id', 5, -1] } } },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
                        { $project: { fullname: 1, email: 1, avatar: 1 } }
                    ],
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            { $sort: { 'lastMessage.createdAt': -1 } }
        ]);
    }
}

module.exports = new Message();

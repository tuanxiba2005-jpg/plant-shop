require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const path = require('path');
const Database = require('./src/config/Database');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Chia sẻ io cho các controller dùng
app.set('io', io);
app.set('trust proxy', 1);

Database.getInstance().connect();
require('./src/cron/orderCron');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
            fontSrc: ["'self'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "res.cloudinary.com"],
            mediaSrc: ["'self'", "https://assets.mixkit.co"],
            connectSrc: ["'self'", "cdnjs.cloudflare.com", "ws:", "wss:", "https://provinces.open-api.vn", "https://esgoo.net"],
            formAction: ["'self'", "https://sandbox.vnpayment.vn", "https://test-payment.momo.vn"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(express.static(path.join(__dirname, 'public')));

// Tự động phục hồi ảnh từ MongoDB nếu file không tồn tại trên ổ đĩa (do máy chủ xoá ổ ảo)
app.get('/images/:folder/:filename', async (req, res, next) => {
    try {
        const ImageStore = require('./src/models/ImageStore');
        const fs = require('fs');
        const img = await ImageStore.findOne({ filename: req.params.filename });
        
        if (img && img.data) {
            // Trả ảnh về cho trình duyệt
            res.setHeader('Content-Type', img.contentType || 'image/webp');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.send(img.data);
            
            // Ghi lại ra đĩa để lần sau express.static phục vụ
            const dir = path.join(__dirname, 'public/images', req.params.folder);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.promises.writeFile(path.join(dir, req.params.filename), img.data).catch(() => {});
        } else {
            next();
        }
    } catch (e) {
        next();
    }
});

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60,
        autoRemove: 'native',
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
});

app.use(sessionMiddleware);

const passport = require('./src/config/passport');
app.use(passport.initialize());
app.use(passport.session());



// Cho socket.io dùng session
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

const Category = require('./src/models/Category');
const categoryModel = new Category();

let cachedCategories = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.locals.clearCategoryCache = () => {
    cachedCategories = null;
    lastCacheTime = 0;
};

app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cartCount = req.session.cartCount || 0;
    try {
        if (!cachedCategories || Date.now() - lastCacheTime > CACHE_TTL) {
            cachedCategories = await categoryModel.findAll();
            lastCacheTime = Date.now();
        }
        res.locals.globalCategories = cachedCategories;
    } catch {
        res.locals.globalCategories = [];
    }
    next();
});

// ── Routes ──────────────────────────────────────────────────
const indexRoutes = require('./src/routes/index');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const addressRoutes = require('./src/routes/addressRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const newsletterRoutes = require('./src/routes/newsletter');
const authRoutes = require('./src/routes/authRoutes');
const pageRoutes = require('./src/routes/pageRoutes');

app.use('/', indexRoutes);
app.use('/support', pageRoutes);
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/user', userRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/staff', staffRoutes);
app.use('/user/addresses', addressRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/newsletter', newsletterRoutes);
app.use('/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Socket.io — thông báo realtime ─────────────────────────
io.on('connection', (socket) => {
    const userId = socket.request.session?.user?.id;
    const role = socket.request.session?.user?.role;
    const fullname = socket.request.session?.user?.fullname;

    if (userId) socket.join(`user_${userId}`);
    if (role === 'admin' || role === 'staff') socket.join('staff_room');

    // Khách hàng vào phòng chat của mình
    if (userId && role === 'user') {
        socket.join(`chat_${userId}`);
    }

    // Gửi tin nhắn
    socket.on('send_message', async (data) => {
        if (!userId) return; // Phải đăng nhập

        try {
            const Message = require('./src/models/Message');

            // Xác định room
            // Nếu là admin/staff nhắn, room sẽ được gửi từ client. Nếu là customer nhắn, room là chat_ của chính họ
            const room = data.room || `chat_${userId}`;

            const newMsg = await Message.model.create({
                room: room,
                sender: userId,
                content: data.content
            });

            // Lấy thông tin sender để trả về
            await newMsg.populate('sender', 'fullname role');

            // Bắn tin nhắn vào phòng chat
            io.to(room).emit('receive_message', newMsg);

            // Bắn thông báo nếu người gửi là user (khách hàng)
            if (role === 'user') {
                io.to('staff_room').emit('new_message_notification', {
                    room: room,
                    senderName: fullname,
                    content: data.content,
                    message: newMsg
                });
            } else {
                // Người gửi là admin/staff -> Bắn thông báo cho customer
                const customerId = room.replace('chat_', '');
                io.to(`user_${customerId}`).emit('new_message_notification', {
                    room: room,
                    senderName: 'Nhân viên hỗ trợ',
                    content: data.content,
                    message: newMsg
                });
            }
        } catch (error) {
            console.error('Lỗi send_message:', error);
        }
    });

    // Admin join phòng chat của một khách hàng cụ thể
    socket.on('join_chat', (data) => {
        if (role === 'admin' || role === 'staff') {
            const room = `chat_${data.customerId}`;
            socket.join(room);
        }
    });
});

// Hàm helper để emit từ controller: req.app.get('io').notifyUser(...)
io.notifyUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
};
io.notifyStaff = (event, data) => {
    io.to('staff_room').emit(event, data);
};
app.set('io', io);

// ── Error handlers ──────────────────────────────────────────
const errorMiddleware = require('./src/middlewares/errorMiddleware');
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌿 Server chạy tại http://localhost:${PORT}`);
});

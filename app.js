require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const path = require('path');
const Database = require('./src/config/Database');
const helmet = require('helmet');

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
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "cdnjs.cloudflare.com", "ws:", "wss:"],
            formAction: ["'self'", "https://sandbox.vnpayment.vn", "https://test-payment.momo.vn"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

// Cho socket.io dùng session
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

const Category = require('./src/models/Category');
const categoryModel = new Category();

app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cartCount = req.session.cartCount || 0;
    try {
        res.locals.globalCategories = await categoryModel.findAll();
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

app.use('/', indexRoutes);
app.use('/products', productRoutes);
app.use('/user', userRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/staff', staffRoutes);
app.use('/user/addresses', addressRoutes);
app.use('/wishlist', wishlistRoutes);

// ── Socket.io — thông báo realtime ─────────────────────────
io.on('connection', (socket) => {
    const userId = socket.request.session?.user?.id;
    const role = socket.request.session?.user?.role;

    if (userId) socket.join(`user_${userId}`);
    if (role === 'admin' || role === 'staff') socket.join('staff_room');
});

// Hàm helper để emit từ controller: req.app.get('io').notifyUser(...)
io.notifyUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
};
io.notifyStaff = (event, data) => {
    io.to('staff_room').emit(event, data);
};

// ── Error handlers ──────────────────────────────────────────
const errorMiddleware = require('./src/middlewares/errorMiddleware');
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌿 Server chạy tại http://localhost:${PORT}`);
});

require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const MongoStore = require('connect-mongo').default;
const path       = require('path');
const Database   = require('./src/config/Database');
const helmet     = require('helmet');

const app = express();
app.set('trust proxy', 1);

Database.getInstance().connect();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:    ["'self'"],
            scriptSrc:     ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],   // cho phép onclick="..." inline
            styleSrc:      ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            fontSrc:       ["'self'", "cdnjs.cloudflare.com"],
            imgSrc:        ["'self'", "data:"],
            connectSrc:    ["'self'", "cdnjs.cloudflare.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl:       process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl:            24 * 60 * 60,
        autoRemove:     'native',
    }),
    cookie: {
        maxAge:   24 * 60 * 60 * 1000,
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production'
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

const Category      = require('./src/models/Category');
const categoryModel = new Category();

app.use(async (req, res, next) => {
    res.locals.user      = req.session.user || null;
    res.locals.cartCount = req.session.cartCount || 0;
    try {
        res.locals.globalCategories = await categoryModel.findAll();
    } catch (err) {
        res.locals.globalCategories = [];
    }
    next();
});

const indexRoutes   = require('./src/routes/index');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes    = require('./src/routes/userRoutes');
const cartRoutes    = require('./src/routes/cartRoutes');
const orderRoutes   = require('./src/routes/orderRoutes');
const adminRoutes   = require('./src/routes/adminRoutes');
const staffRoutes   = require('./src/routes/staffRoutes');
const addressRoutes = require('./src/routes/addressRoutes');   // ← thêm

app.use('/',          indexRoutes);
app.use('/products',  productRoutes);
app.use('/user',      userRoutes);
app.use('/cart',      cartRoutes);
app.use('/orders',    orderRoutes);
app.use('/admin',     adminRoutes);
app.use('/staff',     staffRoutes);
app.use('/user/addresses', addressRoutes);                     // ← thêm

const errorMiddleware = require('./src/middlewares/errorMiddleware');
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌿 Server chạy tại http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('./src/config/Database');

const app = express();
app.set('trust proxy', 1);

Database.getInstance().connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

const Category = require('./src/models/Category');
const categoryModel = new Category();

app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cartCount = req.session.cartCount || 0;
    try {
        res.locals.globalCategories = await categoryModel.findAll();
    } catch (err) {
        res.locals.globalCategories = [];
    }
    next();
});

const indexRoutes = require('./src/routes/index');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const staffRoutes = require('./src/routes/staffRoutes');

app.use('/', indexRoutes);
app.use('/products', productRoutes);
app.use('/user', userRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/staff', staffRoutes);

const errorMiddleware = require('./src/middlewares/errorMiddleware');
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌿 Server chạy tại http://localhost:${PORT}`);
});
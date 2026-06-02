const express = require('express');
const app = express();
const OrderController = require('./src/controllers/OrderController');

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    req.session = { user: { id: 'dummy' } };
    next();
});

const oc = new OrderController();
oc.orderModel = {
    createOrder: async () => '123'
};
oc.cartModel = {
    getCartItems: async () => [{ price: 100, quantity: 1, subtotal: 100 }],
    clearCart: async () => {}
};
oc.couponModel = { apply: async () => ({ valid: false }) };
oc.userModel = { findById: async () => ({ email: 'test@test.com', name: 'test' }) };

app.post('/test', oc.placeOrder.bind(oc));

app.listen(4000, () => console.log('Mock server on 4000'));

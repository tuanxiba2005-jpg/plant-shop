const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const ejs = require('ejs');

const str = fs.readFileSync('src/views/orders/checkout.ejs', 'utf-8');
const html = ejs.render(str, { 
    user: {name: 'Test'}, 
    items: [], 
    total: 100, 
    error: null, 
    locals: {user: null} 
}, { filename: 'src/views/orders/checkout.ejs' });

const dom = new JSDOM(html);
const document = dom.window.document;

const radio = document.querySelector('input[value="vnpay"]');
radio.checked = true;

const form = document.getElementById('checkoutForm');
const formData = new dom.window.FormData(form);

console.log('payment_method:', formData.get('payment_method'));

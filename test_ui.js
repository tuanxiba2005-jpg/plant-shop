const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('src/views/orders/checkout.ejs', 'utf-8');
const dom = new JSDOM(html);
global.document = dom.window.document;

function selectPayment(method) {
    ['cod', 'bank_transfer', 'vnpay', 'momo'].forEach(m => {
        const opt = document.getElementById('opt-' + m);
        const radio = opt?.querySelector('input[type="radio"]');
        const icon = opt?.querySelector('.check-icon');
        if (opt) opt.classList.remove('selected');
        if (icon) icon.style.opacity = '0';
        if (radio) radio.checked = false;
    });

    const selected = document.getElementById('opt-' + method);
    const selectedRadio = selected?.querySelector('input[type="radio"]');
    const selectedIcon = selected?.querySelector('.check-icon');
    
    console.log('Testing method:', method);
    console.log('Selected element found:', !!selected);
    console.log('Selected radio found:', !!selectedRadio);

    if (selected) selected.classList.add('selected');
    if (selectedRadio) selectedRadio.checked = true;
    if (selectedIcon) selectedIcon.style.opacity = '1';
    
    console.log('After set, radio.checked is:', selectedRadio ? selectedRadio.checked : 'N/A');
}

selectPayment('vnpay');
console.log('Final vnpay radio checked:', document.querySelector('#opt-vnpay input').checked);
console.log('Final cod radio checked:', document.querySelector('#opt-cod input').checked);

const crypto = require('crypto');
const https = require('https');
const qs = require('querystring');

// ─── VNPAY ────────────────────────────────────────────────────────────────────
// Hàm sắp xếp và mã hóa tham số chuẩn của VNPay
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
}

function createVNPayUrl(orderId, amount, ipAddr, returnUrl) {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    const date = new Date();
    const pad = n => String(n).padStart(2, '0');
    const createDate = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId.toString(),
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Amount: Math.round(amount * 100),
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    const sortedParams = sortObject(params);
    const signData = Object.keys(sortedParams).map(k => `${k}=${sortedParams[k]}`).join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const hash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const finalQuery = signData + '&vnp_SecureHash=' + hash;
    return `${vnpUrl}?${finalQuery}`;
}

function verifyVNPay(query) {
    const secureHash = query.vnp_SecureHash;
    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sortedParams = sortObject(params);
    const signData = Object.keys(sortedParams).map(k => `${k}=${sortedParams[k]}`).join('&');

    const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return signed === secureHash && query.vnp_ResponseCode === '00';
}

// ─── MOMO ─────────────────────────────────────────────────────────────────────
async function createMoMoUrl(orderId, amount, returnUrl, notifyUrl) {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = `${partnerCode}${Date.now()}`;
    const orderInfo = `Thanh toan don hang ${orderId}`;
    const redirectUrl = returnUrl;
    const ipnUrl = notifyUrl;
    const requestType = 'payWithMethod';
    const extraData = '';
    const autoCapture = true;
    const lang = 'vi';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const body = JSON.stringify({
        partnerCode, accessKey, requestId, amount, orderId,
        orderInfo, redirectUrl: redirectUrl, ipnUrl,
        requestType, extraData, lang, autoCapture, signature
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443, path: '/v2/gateway/api/create',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        };
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.resultCode === 0) resolve(parsed.payUrl);
                    else reject(new Error(parsed.message || 'MoMo error'));
                } catch (e) {
                    reject(new Error('Phản hồi từ MoMo không hợp lệ (sai cấu hình API Key)'));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function verifyMoMo(query) {
    const { signature, ...rest } = query;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const rawSignature = Object.keys(rest).sort()
        .map(k => `${k}=${rest[k]}`).join('&');
    const expected = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    return expected === signature && query.resultCode === '0';
}

module.exports = { createVNPayUrl, verifyVNPay, createMoMoUrl, verifyMoMo };

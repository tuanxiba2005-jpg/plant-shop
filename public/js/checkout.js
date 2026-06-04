document.addEventListener('DOMContentLoaded', function () {
    const radios = document.querySelectorAll('input[name="payment_method"]');
    const bankInfo = document.getElementById('bankInfo');

    function updateStyles() {
        radios.forEach(r => {
            const box = r.closest('.payment-option').querySelector('div.border');
            if(box) {
                if (r.checked) {
                    box.style.borderColor = '#198754';
                    box.style.borderWidth = '2px';
                    box.style.backgroundColor = '#f8fff9';
                } else {
                    box.style.borderColor = '#dee2e6';
                    box.style.borderWidth = '1px';
                    box.style.backgroundColor = '#fff';
                }
            }
        });
    }

    radios.forEach(radio => {
        radio.addEventListener('change', function () {
            updateStyles();
            if (bankInfo) {
                bankInfo.style.display = this.value === 'bank_transfer' ? 'block' : 'none';
            }
        });
    });

    updateStyles();
});

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const res = await fetch('/user/addresses');
        const data = await res.json();
        if (data.success && data.addresses.length > 0) {
            const def = data.addresses.find(a => a.isDefault) || data.addresses[0];
            const phoneEl = document.getElementById('checkoutPhone');
            const addressEl = document.getElementById('checkoutAddress');
            if (phoneEl && !phoneEl.value) phoneEl.value = def.phone;
            if (addressEl && !addressEl.value) addressEl.value = def.address;
        }
    } catch (e) { }

    const btnPickAddress = document.getElementById('btnPickAddress');
    if (btnPickAddress) {
        btnPickAddress.addEventListener('click', async function () {
            const modal = new bootstrap.Modal(document.getElementById('pickAddressModal'));
            const list = document.getElementById('pickAddressList');
            list.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin"></i></div>';
            modal.show();
            try {
                const res = await fetch('/user/addresses');
                const data = await res.json();
                if (!data.success || !data.addresses.length) {
                    list.innerHTML = '<div class="text-center text-muted py-4">Chưa có địa chỉ nào. <a href="/user/profile?tab=address" class="text-success">Thêm địa chỉ</a></div>';
                    return;
                }
                list.innerHTML = data.addresses.map(a => `
        <div class="border rounded p-3 mb-2 ${a.isDefault ? 'border-success' : ''}" style="cursor:pointer"
             onclick="applyAddress('${a.phone.replace(/'/g, "\\'")}','${a.address.replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
            <strong>${a.name}</strong> ${a.isDefault ? '<span class="badge bg-success">Mặc định</span>' : ''}
            <div class="text-muted small">${a.phone}</div>
            <div class="small">${a.address}</div>
        </div>`).join('');
            } catch (e) { }
        });
    }

    const btnApplyCoupon = document.getElementById('btnApplyCoupon');
    if (btnApplyCoupon) {
        btnApplyCoupon.addEventListener('click', async function () {
            const code = document.getElementById('couponInput').value.trim();
            const msg = document.getElementById('couponMsg');
            const orderTotal = document.getElementById('checkoutTotalData') ? parseFloat(document.getElementById('checkoutTotalData').value) : 0;
            if (!code) { msg.innerHTML = '<span class="text-danger">Vui lòng nhập mã</span>'; return; }
            const res = await fetch('/orders/apply-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `code=${encodeURIComponent(code)}&total=${orderTotal}`
            });
            const data = await res.json();
            if (data.valid) {
                document.getElementById('couponCode').value = code;
                document.getElementById('discountRow').style.cssText = '';
                document.getElementById('discountDisplay').textContent = '-' + parseInt(data.discount).toLocaleString('vi-VN') + 'đ';
                document.getElementById('totalDisplay').textContent = parseInt(orderTotal - data.discount).toLocaleString('vi-VN') + 'đ';
                msg.innerHTML = '<span class="text-success"><i class="fas fa-check me-1"></i>Áp dụng thành công!</span>';
            } else {
                document.getElementById('couponCode').value = '';
                document.getElementById('discountRow').style.cssText = 'display:none!important;';
                document.getElementById('totalDisplay').textContent = parseInt(orderTotal).toLocaleString('vi-VN') + 'đ';
                msg.innerHTML = `<span class="text-danger">${data.message}</span>`;
            }
        });
    }
});

function applyAddress(phone, address) {
    document.getElementById('checkoutPhone').value = phone;
    document.getElementById('checkoutAddress').value = address;
    bootstrap.Modal.getInstance(document.getElementById('pickAddressModal')).hide();
}

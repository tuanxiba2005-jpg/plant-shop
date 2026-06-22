// Initialize Checkout logic
(function () {
    // ── Payment Methods UI ──────────────────────────────────────
    const radios = document.querySelectorAll('input[name="payment_method"]');
    const bankInfo = document.getElementById('bankInfoPanel');

    function updateStyles() {
        radios.forEach(r => {
            const card = r.nextElementSibling; // div.payment-card
            const icon = card.querySelector('.check-icon');
            if (card) {
                if (r.checked) {
                    card.style.borderColor = 'var(--primary)';
                    card.style.backgroundColor = 'rgba(45, 95, 63, 0.03)';
                    if (icon) icon.classList.remove('d-none');
                } else {
                    card.style.borderColor = '#ced4da';
                    card.style.backgroundColor = '#fff';
                    if (icon) icon.classList.add('d-none');
                }
            }
        });
    }

    radios.forEach(radio => {
        radio.addEventListener('change', function () {
            updateStyles();
            if (bankInfo) {
                if (this.value === 'bank_transfer') {
                    bankInfo.classList.remove('d-none');
                } else {
                    bankInfo.classList.add('d-none');
                }
            }
        });
    });
    updateStyles();

    // ── Tích hợp API Tỉnh / Thành phố ─────────────────────────
    const provinceSelect = document.getElementById('provinceSelect');
    const districtSelect = document.getElementById('districtSelect');
    const wardSelect = document.getElementById('wardSelect');

    // Fetch Provinces
    fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
        .then(res => res.json())
        .then(resData => {
            if (resData.error === 0) {
                resData.data.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.name;
                    option.dataset.code = p.id;
                    option.textContent = p.name;
                    provinceSelect.appendChild(option);
                });
            }
        }).catch(err => console.error('Lỗi tải tỉnh thành:', err));

    provinceSelect.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
        wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
        wardSelect.disabled = true;

        if (this.value && selectedOption.dataset.code) {
            districtSelect.disabled = false;
            fetch(`https://esgoo.net/api-tinhthanh/2/${selectedOption.dataset.code}.htm`)
                .then(res => res.json())
                .then(resData => {
                    if (resData.error === 0) {
                        resData.data.forEach(d => {
                            const option = document.createElement('option');
                            option.value = d.name;
                            option.dataset.code = d.id;
                            option.textContent = d.name;
                            districtSelect.appendChild(option);
                        });
                    }
                });
        } else {
            districtSelect.disabled = true;
        }
    });

    districtSelect.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';

        if (this.value && selectedOption.dataset.code) {
            wardSelect.disabled = false;
            fetch(`https://esgoo.net/api-tinhthanh/3/${selectedOption.dataset.code}.htm`)
                .then(res => res.json())
                .then(resData => {
                    if (resData.error === 0) {
                        resData.data.forEach(w => {
                            const option = document.createElement('option');
                            option.value = w.name;
                            option.dataset.code = w.id;
                            option.textContent = w.name;
                            wardSelect.appendChild(option);
                        });
                    }
                });
        } else {
            wardSelect.disabled = true;
        }
    });

    // ── Xử lý Form Submit (Gộp địa chỉ) ────────────────────────
    const checkoutForm = document.getElementById('checkoutForm');
    const finalAddress = document.getElementById('checkoutAddressFinal');
    const streetInput = document.getElementById('streetInput');

    checkoutForm.addEventListener('submit', function (e) {
        if (!provinceSelect.value || !districtSelect.value || !wardSelect.value || !streetInput.value) {
            e.preventDefault();
            // Simple validation feedback
            [provinceSelect, districtSelect, wardSelect, streetInput].forEach(el => {
                if (!el.value) {
                    el.classList.add('is-invalid');
                } else {
                    el.classList.remove('is-invalid');
                }
            });
            alert('Vui lòng điền đầy đủ thông tin địa chỉ!');
            return;
        }

        // Remove invalid classes just in case
        [provinceSelect, districtSelect, wardSelect, streetInput].forEach(el => el.classList.remove('is-invalid'));

        // Gộp chuỗi địa chỉ
        finalAddress.value = `${streetInput.value.trim()}, ${wardSelect.value}, ${districtSelect.value}, ${provinceSelect.value}`;

        // Disable submit button to prevent double submit
        const submitBtn = document.getElementById('btnSubmitOrder');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>ĐANG XỬ LÝ...';
    });

    // ── Load địa chỉ mặc định (Sổ địa chỉ) ─────────────────────
    const btnPickAddress = document.getElementById('btnPickAddress');
    if (btnPickAddress) {
        btnPickAddress.addEventListener('click', async function () {
            const modal = new bootstrap.Modal(document.getElementById('pickAddressModal'));
            const list = document.getElementById('pickAddressList');
            list.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fs-4 text-success"></i></div>';
            modal.show();
            try {
                const res = await fetch('/user/addresses');
                const data = await res.json();
                if (!data.success || !data.addresses.length) {
                    list.innerHTML = '<div class="text-center text-muted py-4">Chưa có địa chỉ nào được lưu. <br><a href="/user/profile?tab=address" class="btn btn-outline-success btn-sm mt-3">Thêm địa chỉ mới</a></div>';
                    return;
                }
                list.innerHTML = data.addresses.map(a => `
                <div class="border rounded p-3 mb-3 bg-white shadow-sm hover-shadow ${a.isDefault ? 'border-success' : ''}" style="cursor:pointer; transition: 0.3s;"
                     onclick="applyAddress('${a.phone.replace(/'/g, "\\'")}','${(a.province||'').replace(/'/g, "\\'")}','${(a.district||'').replace(/'/g, "\\'")}','${(a.ward||'').replace(/'/g, "\\'")}','${a.address.replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
                    <div class="d-flex justify-content-between">
                        <strong class="text-dark">${a.name}</strong> 
                        ${a.isDefault ? '<span class="badge bg-success">Mặc định</span>' : ''}
                    </div>
                    <div class="text-muted small mt-1"><i class="fas fa-phone-alt me-1"></i> ${a.phone}</div>
                    <div class="small mt-1"><i class="fas fa-map-marker-alt me-1"></i> ${a.address}${a.ward ? ', '+a.ward : ''}${a.district ? ', '+a.district : ''}${a.province ? ', '+a.province : ''}</div>
                </div>`).join('');
            } catch (e) {
                list.innerHTML = '<div class="text-center text-danger py-4">Có lỗi xảy ra khi tải danh sách địa chỉ.</div>';
            }
        });
    }

    // ── Mã giảm giá (Coupon) ───────────────────────────────────
    const btnApplyCoupon = document.getElementById('btnApplyCoupon');
    if (btnApplyCoupon) {
        btnApplyCoupon.addEventListener('click', async function () {
            const code = document.getElementById('couponInput').value.trim();
            const msg = document.getElementById('couponMsg');
            const orderTotal = document.getElementById('checkoutTotalData') ? parseFloat(document.getElementById('checkoutTotalData').value) : 0;
            if (!code) { msg.innerHTML = '<span class="text-danger small"><i class="fas fa-exclamation-circle me-1"></i>Vui lòng nhập mã</span>'; return; }

            // UI state loading
            btnApplyCoupon.disabled = true;
            btnApplyCoupon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const res = await fetch('/orders/apply-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `code=${encodeURIComponent(code)}&total=${orderTotal}`
            });
            const data = await res.json();

            btnApplyCoupon.disabled = false;
            btnApplyCoupon.innerHTML = 'Áp dụng';

            if (data.valid) {
                document.getElementById('couponCode').value = code;
                document.getElementById('discountRow').style.cssText = 'display: flex !important;';
                document.getElementById('discountDisplay').textContent = '-' + parseInt(data.discount).toLocaleString('vi-VN') + 'đ';
                document.getElementById('totalDisplay').textContent = parseInt(orderTotal - data.discount).toLocaleString('vi-VN') + 'đ';
                msg.innerHTML = '<span class="text-success small"><i class="fas fa-check-circle me-1"></i>Áp dụng thành công!</span>';
            } else {
                document.getElementById('couponCode').value = '';
                document.getElementById('discountRow').style.cssText = 'display:none!important;';
                document.getElementById('totalDisplay').textContent = parseInt(orderTotal).toLocaleString('vi-VN') + 'đ';
                msg.innerHTML = `<span class="text-danger small"><i class="fas fa-times-circle me-1"></i>${data.message}</span>`;
            }
        });
    }
})();

// Hàm apply địa chỉ khi chọn từ Modal (Tự động chọn Tỉnh/Huyện/Xã)
window.applyAddress = function (phone, province, district, ward, address) {
    document.getElementById('checkoutPhone').value = phone;
    document.getElementById('streetInput').value = address;

    const provSelect = document.getElementById('provinceSelect');
    const distSelect = document.getElementById('districtSelect');
    const wardSelect = document.getElementById('wardSelect');

    const selectOptionByText = (selectElem, text) => {
        Array.from(selectElem.options).forEach(opt => {
            if (opt.text === text) selectElem.value = opt.value;
        });
    };

    if (province) {
        selectOptionByText(provSelect, province);
        provSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
            if (district) {
                selectOptionByText(distSelect, district);
                distSelect.dispatchEvent(new Event('change'));
                setTimeout(() => {
                    if (ward) {
                        selectOptionByText(wardSelect, ward);
                    }
                }, 300);
            }
        }, 300);
    } else {
        // Gợi ý người dùng chọn lại tỉnh thành nếu địa chỉ cũ thiếu thông tin
        const msg = document.createElement('div');
        msg.className = 'text-primary small mt-1';
        msg.innerHTML = '<i class="fas fa-info-circle me-1"></i> Vui lòng chọn lại Tỉnh/Quận/Phường cho chính xác.';
        document.getElementById('streetInput').parentNode.appendChild(msg);
        setTimeout(() => msg.remove(), 5000);
    }

    bootstrap.Modal.getInstance(document.getElementById('pickAddressModal')).hide();
}

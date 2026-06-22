// ============================================================
// FILE: public/js/address.js
// Quản lý địa chỉ giao hàng — dùng cho profile & checkout
// ============================================================

// ── Lấy danh sách địa chỉ ──────────────────────────────────
async function loadAddresses(containerId, mode = 'manage') {
    try {
        const res  = await fetch('/user/addresses');
        const data = await res.json();
        if (!data.success) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        if (data.addresses.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-map-marker-alt fa-2x mb-2"></i>
                    <p>Bạn chưa có địa chỉ nào. Thêm ngay!</p>
                </div>`;
            return;
        }

        container.innerHTML = data.addresses.map(addr => `
            <div class="address-card border rounded p-3 mb-2 ${addr.isDefault ? 'border-success' : ''}"
                 id="addr-${addr._id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${addr.name}</strong>
                        ${addr.isDefault ? '<span class="badge bg-success ms-2">Mặc định</span>' : ''}
                        <div class="text-muted small">${addr.phone}</div>
                        <div>${addr.address}</div>
                    </div>
                    <div class="d-flex flex-column gap-1 ms-3">
                        ${mode === 'manage' ? `
                        <button class="btn btn-sm btn-outline-secondary"
                                onclick="openEditModal('${addr._id}','${escHtml(addr.name)}','${escHtml(addr.phone)}','${escHtml(addr.province)}','${escHtml(addr.district)}','${escHtml(addr.ward)}','${escHtml(addr.address)}',${addr.isDefault})">
                            <i class="fas fa-pen"></i>
                        </button>
                        ${!addr.isDefault ? `
                        <button class="btn btn-sm btn-outline-success"
                                onclick="setDefault('${addr._id}')">
                            <i class="fas fa-star"></i>
                        </button>` : ''}
                        <button class="btn btn-sm btn-outline-danger"
                                onclick="deleteAddress('${addr._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : `
                        <button class="btn btn-sm btn-success"
                                onclick="selectAddressForCheckout('${escHtml(addr.phone)}','${escHtml(addr.address)}')">
                            Chọn
                        </button>`}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('loadAddresses error:', e);
    }
}

// ── Thêm địa chỉ mới ───────────────────────────────────────
async function submitAddAddress(event) {
    event.preventDefault();
    const form = event.target;
    const body = new URLSearchParams(new FormData(form));

    const res  = await fetch('/user/addresses', { method: 'POST', body });
    const data = await res.json();

    if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('addAddressModal')).hide();
        form.reset();
        loadAddresses('addressList');
        showToast('Thêm địa chỉ thành công!', 'success');
    } else {
        document.getElementById('addAddrError').textContent = data.message;
    }
}

// ── Sửa địa chỉ ────────────────────────────────────────────
function openEditModal(id, name, phone, province, district, ward, address, isDefault) {
    document.getElementById('editAddrId').value      = id;
    document.getElementById('editAddrName').value    = name;
    document.getElementById('editAddrPhone').value   = phone;
    document.getElementById('editAddrAddress').value = address;
    document.getElementById('editAddrDefault').checked = isDefault;
    document.getElementById('editAddrError').textContent = '';

    // Trigger API for dropdowns
    const provSelect = document.getElementById('editProvinceSelect');
    const distSelect = document.getElementById('editDistrictSelect');
    const wardSelect = document.getElementById('editWardSelect');

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
    }

    new bootstrap.Modal(document.getElementById('editAddressModal')).show();
}

async function submitEditAddress(event) {
    event.preventDefault();
    const form = event.target;
    const id   = document.getElementById('editAddrId').value;
    const body = new URLSearchParams(new FormData(form));

    const res  = await fetch(`/user/addresses/${id}/update`, { method: 'POST', body });
    const data = await res.json();

    if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('editAddressModal')).hide();
        loadAddresses('addressList');
        showToast('Cập nhật địa chỉ thành công!', 'success');
    } else {
        document.getElementById('editAddrError').textContent = data.message;
    }
}

// ── Xóa địa chỉ ────────────────────────────────────────────
async function deleteAddress(id) {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    const res  = await fetch(`/user/addresses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
        loadAddresses('addressList');
        showToast('Đã xóa địa chỉ.', 'success');
    } else {
        alert(data.message);
    }
}

// ── Đặt làm mặc định ───────────────────────────────────────
async function setDefault(id) {
    const res  = await fetch(`/user/addresses/${id}/default`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
        loadAddresses('addressList');
        showToast('Đã đặt địa chỉ mặc định!', 'success');
    } else {
        alert(data.message);
    }
}

// ── Dùng cho trang checkout ─────────────────────────────────
function selectAddressForCheckout(phone, address) {
    const phoneInput   = document.querySelector('input[name="phone"]');
    const addressInput = document.querySelector('textarea[name="address"]');
    if (phoneInput)   phoneInput.value   = phone;
    if (addressInput) addressInput.value = address;
    // Đóng modal nếu có
    const modal = document.getElementById('pickAddressModal');
    if (modal) bootstrap.Modal.getInstance(modal)?.hide();
}

// ── Tự động điền địa chỉ mặc định khi mở trang checkout ────
async function prefillDefaultAddress() {
    try {
        const res  = await fetch('/user/addresses');
        const data = await res.json();
        if (!data.success || data.addresses.length === 0) return;
        const def = data.addresses.find(a => a.isDefault) || data.addresses[0];
        selectAddressForCheckout(def.phone, def.address);
    } catch (e) {}
}

// ── Utility ─────────────────────────────────────────────────
function escHtml(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showToast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type} border-0 show position-fixed bottom-0 end-0 m-3`;
    el.style.zIndex = 9999;
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${msg}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    onclick="this.closest('.toast').remove()"></button>
        </div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ── Tích hợp API Tỉnh / Thành phố cho Modal ───────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['add', 'edit'].forEach(prefix => {
        const provinceSelect = document.getElementById(`${prefix}ProvinceSelect`);
        const districtSelect = document.getElementById(`${prefix}DistrictSelect`);
        const wardSelect = document.getElementById(`${prefix}WardSelect`);

        if (!provinceSelect) return;

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

            if (this.value && selectedOption && selectedOption.dataset.code) {
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

            if (this.value && selectedOption && selectedOption.dataset.code) {
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
    });
});

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
                                onclick="openEditModal('${addr._id}','${escHtml(addr.name)}','${escHtml(addr.phone)}','${escHtml(addr.address)}',${addr.isDefault})">
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
function openEditModal(id, name, phone, address, isDefault) {
    document.getElementById('editAddrId').value      = id;
    document.getElementById('editAddrName').value    = name;
    document.getElementById('editAddrPhone').value   = phone;
    document.getElementById('editAddrAddress').value = address;
    document.getElementById('editAddrDefault').checked = isDefault;
    document.getElementById('editAddrError').textContent = '';
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

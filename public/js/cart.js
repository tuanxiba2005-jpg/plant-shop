// ── Tăng giảm số lượng ──────────────────────────────────────────
document.querySelectorAll('.btn-qty').forEach(btn => {
    btn.addEventListener('click', async function () {
        const row = this.closest('.cart-item-row');
        const productId = row.dataset.id;
        const input = row.querySelector('.qty-input');
        let qty = parseInt(input.value);
        const max = parseInt(input.max) || 999;

        if (this.dataset.action === 'plus') qty = Math.min(max, qty + 1);
        else qty = Math.max(1, qty - 1);

        input.value = qty;
        await updateCartItem(productId, qty, row);
    });
});

// ── Xóa sản phẩm khỏi giỏ ──────────────────────────────────────
document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async function () {
        const row = this.closest('.cart-item-row');
        const productId = row.dataset.id;

        row.style.opacity = '0.5';
        row.style.transition = 'opacity .2s';

        const res = await fetch(`/cart/remove/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            row.classList.add('removing');
            setTimeout(() => {
                row.remove();
                recalcSelected();
                updateCartBadge(data.cartCount);
                if (document.querySelectorAll('.cart-item-row').length === 0) {
                    location.reload();
                }
            }, 300);
            showToast('Đã xóa khỏi giỏ hàng!', 'danger');
        } else {
            row.style.opacity = '1';
        }
    });
});

// ── Cập nhật giỏ hàng ───────────────────────────────────────────
async function updateCartItem(productId, quantity, row) {
    const res = await fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (data.success) {
        recalcSelected();
        updateCartBadge(data.cartCount);
        // Flash animation
        const subtotalEl = row.querySelector('.item-subtotal');
        if (subtotalEl) {
            subtotalEl.style.transform = 'scale(1.1)';
            subtotalEl.style.transition = 'transform .2s';
            setTimeout(() => { subtotalEl.style.transform = 'scale(1)'; }, 200);
        }
    }
}

// ── Checkbox: item ───────────────────────────────────────────────
document.querySelectorAll('.item-checkbox').forEach(cb => {
    cb.addEventListener('change', function () {
        const row = this.closest('.cart-item-row');
        row.classList.toggle('unchecked', !this.checked);
        recalcSelected();
        updateSelectAllState();
    });
});

// ── Checkbox: select all ─────────────────────────────────────────
const selectAllCb = document.getElementById('selectAllCheckbox');
if (selectAllCb) {
    selectAllCb.addEventListener('change', function () {
        document.querySelectorAll('.item-checkbox').forEach(cb => {
            cb.checked = this.checked;
            const row = cb.closest('.cart-item-row');
            row.classList.toggle('unchecked', !this.checked);
        });
        recalcSelected();
    });
}

function updateSelectAllState() {
    const all = document.querySelectorAll('.item-checkbox');
    const checked = document.querySelectorAll('.item-checkbox:checked');
    if (selectAllCb) {
        selectAllCb.checked = checked.length === all.length;
        selectAllCb.indeterminate = checked.length > 0 && checked.length < all.length;
    }
}

// ── Tính lại tổng theo sản phẩm được chọn ───────────────────────
function recalcSelected() {
    let total = 0;
    let count = 0;

    document.querySelectorAll('.cart-item-row').forEach(row => {
        const cb = row.querySelector('.item-checkbox');
        const priceText = row.querySelector('.cart-price')?.textContent || '0';
        const price = parseInt(priceText.replace(/\D/g, '')) || 0;
        const qty = parseInt(row.querySelector('.qty-input')?.value || 0);
        const subtotal = price * qty;

        // Luôn cập nhật subtotal hiển thị trên từng dòng
        const subtotalEl = row.querySelector('.item-subtotal');
        if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('vi-VN') + 'đ';

        if (cb && cb.checked) {
            total += subtotal;
            count++;
        }
    });

    // Cập nhật panel
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';

    const subtotalEl = document.getElementById('summarySubtotal');
    if (subtotalEl) subtotalEl.textContent = total.toLocaleString('vi-VN') + 'đ';

    const countEl = document.getElementById('selectedCount');
    if (countEl) countEl.textContent = count;

    // Nút đặt hàng: disable nếu không chọn gì
    const btn = document.getElementById('btnCheckout');
    if (btn) {
        btn.disabled = count === 0;
        btn.style.opacity = count === 0 ? '0.5' : '1';
        btn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
    }
}

// ── Chuyển sang checkout với IDs được chọn ──────────────────────
function goToCheckout() {
    const selectedIds = [];
    document.querySelectorAll('.cart-item-row').forEach(row => {
        const cb = row.querySelector('.item-checkbox');
        if (cb && cb.checked) {
            selectedIds.push(row.dataset.id);
        }
    });

    if (selectedIds.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 sản phẩm!', 'warning');
        return;
    }

    window.location.href = `/orders/checkout?items=${selectedIds.join(',')}`;
}

// ── Cập nhật badge header ────────────────────────────────────────
function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.transform = 'scale(1.4)';
        badge.style.transition = 'transform .2s';
        setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }
}
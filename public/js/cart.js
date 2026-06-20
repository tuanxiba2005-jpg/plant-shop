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

        // Confirm animation
        row.style.opacity = '0.5';
        row.style.transition = 'opacity .2s';

        const res = await fetch(`/cart/remove/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            row.classList.add('removing');
            setTimeout(() => {
                row.remove();
                recalcTotal();
                updateCartBadge(data.cartCount);
                // Nếu hết sản phẩm → reload để hiện empty state
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
        recalcTotal();
        updateCartBadge(data.cartCount);
        // Flash animation trên subtotal
        const subtotalEl = row.querySelector('.item-subtotal');
        if (subtotalEl) {
            subtotalEl.style.transform = 'scale(1.1)';
            subtotalEl.style.transition = 'transform .2s';
            setTimeout(() => { subtotalEl.style.transform = 'scale(1)'; }, 200);
        }
    }
}

// ── Tính lại tổng ───────────────────────────────────────────────
function recalcTotal() {
    let total = 0;
    document.querySelectorAll('.cart-item-row').forEach(row => {
        const priceText = row.querySelector('.cart-price')?.textContent || '0';
        const price = parseInt(priceText.replace(/\D/g, '')) || 0;
        const qty = parseInt(row.querySelector('.qty-input')?.value || 0);
        total += price * qty;

        const subtotalEl = row.querySelector('.item-subtotal');
        if (subtotalEl) {
            subtotalEl.textContent = (price * qty).toLocaleString('vi-VN') + 'đ';
        }
    });

    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';

    const subtotalEl = document.getElementById('summarySubtotal');
    if (subtotalEl) subtotalEl.textContent = total.toLocaleString('vi-VN') + 'đ';
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
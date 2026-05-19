// Tăng giảm số lượng
document.querySelectorAll('.btn-qty').forEach(btn => {
    btn.addEventListener('click', async function () {
        const row = this.closest('tr');
        const productId = row.dataset.id;
        const input = row.querySelector('.qty-input');
        let qty = parseInt(input.value);

        if (this.dataset.action === 'plus') qty++;
        else qty = Math.max(1, qty - 1);
        input.value = qty;

        await updateCartItem(productId, qty);
    });
});

// Xóa sản phẩm khỏi giỏ
document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async function () {
        const row = this.closest('tr');
        const productId = row.dataset.id;

        const res = await fetch(`/cart/remove/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            row.remove();
            recalcTotal();
            updateCartBadge(data.cartCount);
            showToast('Đã xóa khỏi giỏ hàng!', 'danger');
        }
    });
});

async function updateCartItem(productId, quantity) {
    const res = await fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (data.success) {
        recalcTotal();
        updateCartBadge(data.cartCount);
    }
}

function recalcTotal() {
    let total = 0;
    document.querySelectorAll('#cartTable tr').forEach(row => {
        const price = parseInt(row.querySelector('td:nth-child(2)')?.textContent.replace(/\D/g, '') || 0);
        const qty = parseInt(row.querySelector('.qty-input')?.value || 0);
        total += price * qty;
        const subtotalEl = row.querySelector('.item-subtotal');
        if (subtotalEl) subtotalEl.textContent = (price * qty).toLocaleString('vi-VN') + 'đ';
    });
    const el = document.getElementById('cartTotal');
    if (el) el.textContent = total.toLocaleString('vi-VN') + 'đ';
}

function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = count;
}
// Tăng giảm số lượng
document.getElementById('btnMinus')?.addEventListener('click', () => {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
});

document.getElementById('btnPlus')?.addEventListener('click', () => {
    const input = document.getElementById('quantity');
    const max = parseInt(input.max);
    if (parseInt(input.value) < max) {
        input.value = parseInt(input.value) + 1;
    }
});

// Thêm vào giỏ hàng với số lượng tùy chọn
document.querySelector('.btn-add-cart')?.addEventListener('click', async function () {
    const productId = this.dataset.id;
    const quantity = parseInt(document.getElementById('quantity').value);
    const res = await fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (data.success) {
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = data.cartCount;
        showToast('Đã thêm vào giỏ hàng!', 'success');
    } else {
        showToast('Vui lòng đăng nhập!', 'danger');
    }
});
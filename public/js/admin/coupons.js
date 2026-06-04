function toggleCouponType() {
    document.getElementById('maxDiscountRow').style.display =
        document.getElementById('cType').value === 'percent' ? '' : 'none';
}

async function createCoupon() {
    const body = new URLSearchParams({
        code: document.getElementById('cCode').value,
        type: document.getElementById('cType').value,
        value: document.getElementById('cValue').value,
        minOrder: document.getElementById('cMinOrder').value,
        maxDiscount: document.getElementById('cMaxDiscount').value,
        usageLimit: document.getElementById('cUsageLimit').value,
        expiresAt: document.getElementById('cExpires').value,
    });
    const res = await fetch('/admin/coupons/create', { method: 'POST', body });
    const data = await res.json();
    if (data.success) location.reload();
    else {
        const err = document.getElementById('couponError');
        err.textContent = data.message;
        err.classList.remove('d-none');
    }
}

async function toggleCoupon(id, btn) {
    const res = await fetch(`/admin/coupons/${id}/toggle`, { method: 'POST' });
    const data = await res.json();
    if (data.success) location.reload();
}

async function deleteCoupon(id) {
    if (!confirm('Xóa mã giảm giá này?')) return;
    const res = await fetch(`/admin/coupons/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) location.reload();
}

// Thêm vào giỏ hàng
document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', async function () {
        const productId = this.dataset.id;
        try {
            const res = await fetch('/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity: 1 })
            });
            const data = await res.json();
            if (data.success) {
                const badge = document.getElementById('cartBadge');
                if (badge) badge.textContent = data.cartCount;
                showToast('Đã thêm vào giỏ hàng!', 'success');
            }
        } catch (e) {
            showToast('Vui lòng đăng nhập!', 'danger');
        }
    });
});

// Giỏ hàng - cập nhật số lượng
document.querySelectorAll('.btn-qty').forEach(btn => {
    btn.addEventListener('click', async function () {
        const row = this.closest('tr');
        const productId = row.dataset.id;
        const input = row.querySelector('.qty-input');
        let qty = parseInt(input.value);
        if (this.dataset.action === 'plus') qty++;
        else qty = Math.max(1, qty - 1);
        input.value = qty;
        await updateCart(productId, qty, row);
    });
});

document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async function () {
        const row = this.closest('tr');
        const productId = row.dataset.id;
        const res = await fetch(`/cart/remove/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            row.remove();
            updateTotal();
            const badge = document.getElementById('cartBadge');
            if (badge) badge.textContent = data.cartCount;
        }
    });
});

async function updateCart(productId, quantity, row) {
    const res = await fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (data.success) {
        updateTotal();
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = data.cartCount;
    }
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('#cartTable tr').forEach(row => {
        const price = parseInt(row.querySelector('td:nth-child(2)')?.textContent.replace(/\D/g, '') || 0);
        const qty = parseInt(row.querySelector('.qty-input')?.value || 0);
        total += price * qty;
    });
    const el = document.getElementById('cartTotal');
    if (el) el.textContent = total.toLocaleString('vi-VN') + 'đ';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3`;
    toast.style.zIndex = 9999;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}


// ==========================================
//  CAROUSEL - TRANG CHỦ
// ==========================================
const carousel = {};

function carouselInit(catId) {
    if (carousel[catId]) return; // đã init rồi thì thôi
    const track = document.getElementById('track-' + catId);
    if (!track) return;
    const total = track.querySelectorAll('.carousel-slide').length;
    const perView = window.innerWidth <= 768 ? 2 : 4;
    carousel[catId] = { page: 0, total, perView, maxPage: Math.max(0, Math.ceil(total / perView) - 1) };
    carouselRenderDots(catId);
    carouselUpdate(catId);
}

function carouselRenderDots(catId) {
    const s = carousel[catId];
    const el = document.getElementById('dots-' + catId);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i <= s.maxPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'dot' + (i === 0 ? ' active' : '');
        btn.setAttribute('aria-label', 'Trang ' + (i + 1));
        btn.onclick = () => carouselGoTo(catId, i);
        el.appendChild(btn);
    }
}

function carouselUpdate(catId) {
    const s = carousel[catId];
    const track = document.getElementById('track-' + catId);
    const outer = document.getElementById('outer-' + catId);
    if (!track || !outer) return;

    const itemW = (outer.clientWidth - (s.perView - 1) * 16) / s.perView;
    track.style.transform = `translateX(-${s.page * s.perView * (itemW + 16)}px)`;

    const prev = document.getElementById('prev-' + catId);
    const next = document.getElementById('next-' + catId);
    if (prev) prev.classList.toggle('hidden', s.page <= 0);
    if (next) next.classList.toggle('hidden', s.page >= s.maxPage);

    document.querySelectorAll('#dots-' + catId + ' .dot').forEach((d, i) => {
        d.classList.toggle('active', i === s.page);
    });
}

function carouselSlide(catId, dir) {
    const s = carousel[catId];
    if (!s) return;
    s.page = Math.max(0, Math.min(s.maxPage, s.page + dir));
    carouselUpdate(catId);
}

function carouselGoTo(catId, page) {
    const s = carousel[catId];
    if (!s) return;
    s.page = page;
    carouselUpdate(catId);
}

function switchTab(catId) {
    // Ẩn tất cả panel, bỏ active tab
    document.querySelectorAll('.cat-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));

    // Hiện panel & active tab được chọn
    const panel = document.getElementById('panel-' + catId);
    const tab = document.getElementById('tab-' + catId);
    if (panel) panel.classList.add('active');
    if (tab) tab.classList.add('active');

    // Init carousel nếu chưa, update nếu rồi
    if (!carousel[catId]) {
        carouselInit(catId);
    } else {
        carouselUpdate(catId);
    }
}

// Init tab đầu tiên khi load
window.addEventListener('load', () => {
    const first = document.querySelector('.tab-btn');
    if (first) {
        switchTab(first.dataset.cat);
    }
});

// Re-calc khi resize
window.addEventListener('resize', () => {
    Object.keys(carousel).forEach(catId => {
        const s = carousel[catId];
        const perView = window.innerWidth <= 768 ? 2 : 4;
        s.perView = perView;
        s.maxPage = Math.max(0, Math.ceil(s.total / perView) - 1);
        s.page = Math.min(s.page, s.maxPage);
        carouselRenderDots(catId);
        carouselUpdate(catId);
    });
});
// ==========================================
//  PROFILE PAGE
// ==========================================

// Tab active dựa vào query string
if (document.getElementById('profileTab')) {
    const urlParams = new URLSearchParams(window.location.search);
    const currentTab = urlParams.get('tab') || 'info';
    switchProfileTab(currentTab);
}

function switchProfileTab(tab) {
    document.querySelectorAll('.profile-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('#profileTab .nav-link').forEach(t => t.classList.remove('active'));
    const panel = document.getElementById('panel-' + tab);
    const tabBtn = document.getElementById('tab-' + tab);
    if (panel) panel.style.display = 'block';
    if (tabBtn) tabBtn.classList.add('active');
}

// Hiện/ẩn mật khẩu
function togglePwd(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Kiểm tra mật khẩu khớp realtime
const newPwdInput = document.getElementById('newPassword');
if (newPwdInput) {
    newPwdInput.addEventListener('input', function () {
        const currentPwd = document.getElementById('currentPassword').value;
        const msg = document.getElementById('pwdMatchMsg');
        if (this.value && currentPwd && this.value === currentPwd) {
            msg.innerHTML = '<span class="text-danger"><i class="fas fa-times me-1"></i>Mật khẩu mới phải khác mật khẩu hiện tại</span>';
        } else {
            msg.textContent = '';
        }
    });
}
// ==========================================
//  CHECKOUT - Phương thức thanh toán
// ==========================================
function selectPayment(method) {
    ['cod', 'bank_transfer'].forEach(m => {
        const opt = document.getElementById('opt-' + m);
        const radio = document.getElementById(m);
        const icon = opt?.querySelector('.check-icon');
        if (opt) opt.classList.remove('selected');
        if (icon) icon.style.opacity = '0';
        if (radio) radio.checked = false;
    });

    const selected = document.getElementById('opt-' + method);
    const selectedRadio = document.getElementById(method);
    const selectedIcon = selected?.querySelector('.check-icon');
    if (selected) selected.classList.add('selected');
    if (selectedRadio) selectedRadio.checked = true;
    if (selectedIcon) selectedIcon.style.opacity = '1';

    const bankInfo = document.getElementById('bankInfo');
    if (bankInfo) bankInfo.style.display = method === 'bank_transfer' ? 'block' : 'none';
}

// ==========================================
//  ORDER DETAIL - Hủy đơn hàng
// ==========================================
const btnCancel = document.getElementById('btnCancel');
if (btnCancel) {
    btnCancel.addEventListener('click', async function () {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

        const orderId = window.location.pathname.split('/').pop();
        const res = await fetch(`/orders/${orderId}/cancel`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            showToast('Đã hủy đơn hàng!', 'success');
            setTimeout(() => location.reload(), 800);
        } else {
            showToast(data.message || 'Không thể hủy đơn hàng!', 'danger');
        }
    });
}
window.addEventListener('scroll', handleFooterVisibility);
window.addEventListener('load', handleFooterVisibility);
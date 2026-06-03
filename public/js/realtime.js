// ============================================================
// FILE: public/js/realtime.js
// Socket.io client — thông báo realtime + đánh giá + wishlist
// ============================================================

// Chỉ kết nối khi đã đăng nhập (biến `currentUser` được set trong header)
if (typeof currentUser !== 'undefined' && currentUser) {
    const socket = io();

    // ── Thông báo trạng thái đơn hàng ──────────────────────
    socket.on('order_status_update', function (data) {
        showRealtimeToast(
            `📦 Đơn hàng #${String(data.orderId).slice(-6).toUpperCase()}`,
            data.message,
            'success',
            `/orders/${data.orderId}`
        );
        // Cập nhật badge thông báo nếu có
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.style.display = 'inline';
            badge.textContent = parseInt(badge.textContent || 0) + 1;
        }
    });

    // ── Thông báo đơn hàng mới (cho staff/admin) ───────────
    socket.on('new_order', function (data) {
        showRealtimeToast('🛒 Đơn hàng mới', data.message, 'primary', '/admin/orders');
    });

    // ── Thông báo tin nhắn mới ─────────────────────────────
    socket.on('new_message_notification', function (data) {
        // Show red dot on headset icon in header (if exists)
        const badgeAdmin = document.getElementById('header-chat-badge-admin');
        const badgeStaff = document.getElementById('header-chat-badge-staff');
        if (badgeAdmin) badgeAdmin.style.display = 'inline-block';
        if (badgeStaff) badgeStaff.style.display = 'inline-block';
    });
}

// ── Toast thông báo realtime ────────────────────────────────
function showRealtimeToast(title, message, type = 'success', link = null) {
    const container = document.getElementById('toastContainer') || createToastContainer();

    const id = 'toast_' + Date.now();
    const html = `
        <div id="${id}" class="toast show align-items-center border-0 mb-2"
             style="background:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:10px;min-width:300px;">
            <div class="d-flex">
                <div class="toast-body">
                    <div class="fw-bold text-${type} mb-1">${title}</div>
                    <div class="small">${message}</div>
                    ${link ? `<a href="${link}" class="small text-success">Xem chi tiết →</a>` : ''}
                </div>
                <button type="button" class="btn-close me-2 m-auto" onclick="document.getElementById('${id}').remove()"></button>
            </div>
        </div>`;

    container.insertAdjacentHTML('beforeend', html);
    setTimeout(() => { document.getElementById(id)?.remove(); }, 6000);
}

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toastContainer';
    div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
    document.body.appendChild(div);
    return div;
}

// ── Đánh giá sản phẩm ──────────────────────────────────────
async function submitReview(productId, orderId, btn) {
    const form = btn.closest('.review-form');
    const rating = form.querySelector('input[name="rating"]:checked')?.value;
    const comment = form.querySelector('textarea[name="comment"]')?.value || '';

    if (!rating) { alert('Vui lòng chọn số sao'); return; }

    btn.disabled = true;
    btn.textContent = 'Đang gửi...';

    const res = await fetch('/orders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `product_id=${productId}&order_id=${orderId}&rating=${rating}&comment=${encodeURIComponent(comment)}`
    });
    const data = await res.json();

    if (data.success) {
        form.innerHTML = '<div class="text-success small"><i class="fas fa-check me-1"></i>Đã gửi đánh giá. Cảm ơn bạn!</div>';
    } else {
        btn.disabled = false;
        btn.textContent = 'Gửi đánh giá';
        alert(data.message);
    }
}

// ── Wishlist toggle trên trang sản phẩm ────────────────────
async function toggleWishlist(productId, btn) {
    if (!currentUser) { window.location.href = '/user/login'; return; }

    const res = await fetch('/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `product_id=${productId}`
    });
    const data = await res.json();

    if (data.success) {
        const icon = btn.querySelector('i');
        if (data.action === 'added') {
            btn.classList.replace('btn-outline-danger', 'btn-danger');
            if (icon) { icon.classList.replace('far', 'fas'); }
            btn.title = 'Bỏ yêu thích';
        } else {
            btn.classList.replace('btn-danger', 'btn-outline-danger');
            if (icon) { icon.classList.replace('fas', 'far'); }
            btn.title = 'Thêm vào yêu thích';
        }
    }
}

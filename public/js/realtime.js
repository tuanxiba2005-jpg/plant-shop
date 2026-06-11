// ============================================================
// FILE: public/js/realtime.js
// Socket.io client — thông báo realtime + đánh giá + wishlist
// ============================================================

// Chỉ kết nối khi đã đăng nhập (biến `currentUser` được set trong header)
if (typeof currentUser !== 'undefined' && currentUser) {
    const socket = io();

    // Lấy thông báo ban đầu
    fetchNotifications();

    // ── Thông báo trạng thái đơn hàng ──────────────────────
    socket.on('order_status_update', function (data) {
        showRealtimeToast(
            `📦 Đơn hàng #${String(data.orderId).slice(-6).toUpperCase()}`,
            data.message,
            'success',
            `/orders/${data.orderId}`
        );
        addNotificationToDropdown({
            title: 'Cập nhật đơn hàng',
            message: data.message,
            link: `/orders/${data.orderId}`,
            created_at: new Date().toISOString()
        });
        incrementBadge();
    });

    // ── Thông báo đơn hàng mới (cho staff/admin) ───────────
    socket.on('new_order', function (data) {
        const link = (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'staff') ? '/staff/orders' : '/admin/orders';
        showRealtimeToast('🛒 Đơn hàng mới', data.message, 'primary', link);
        addNotificationToDropdown({
            title: 'Đơn hàng mới',
            message: data.message,
            link: link,
            created_at: new Date().toISOString()
        });
        incrementBadge();
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

function incrementBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.style.display = 'inline';
        badge.textContent = parseInt(badge.textContent || 0) + 1;
    }
}

async function fetchNotifications() {
    try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success) {
            const badge = document.getElementById('notificationBadge');
            if (badge && data.unreadCount > 0) {
                badge.style.display = 'inline';
                badge.textContent = data.unreadCount;
            }
            
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = '';
                if (data.notifications.length === 0) {
                    list.innerHTML = '<li><div class="dropdown-item text-center text-muted small py-4">Không có thông báo nào.</div></li>';
                } else {
                    data.notifications.forEach(n => addNotificationToDropdown(n, true));
                }
            }
        }
    } catch (err) {
        console.error('Error fetching notifications:', err);
    }
}

function addNotificationToDropdown(n, append = false) {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'staff') {
        if (n.link && n.link.startsWith('/admin/')) {
            n.link = n.link.replace('/admin/', '/staff/');
        }
    }
    const list = document.getElementById('notificationList');
    if (!list) return;

    // Remove empty state if exists
    const emptyState = list.querySelector('.text-muted.small');
    if (emptyState && list.children.length === 1 && emptyState.textContent.includes('Không có thông báo nào')) {
        list.innerHTML = '';
    }

    const time = new Date(n.createdAt || n.created_at).toLocaleString('vi-VN');
    const li = document.createElement('li');
    li.innerHTML = `
        <a class="dropdown-item py-3 border-bottom text-wrap flex-column align-items-start ${n.is_read ? '' : 'bg-light'}" href="${n.link || '#'}" style="min-width: 300px;">
            <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                <h6 class="mb-0 text-dark fw-bold" style="font-size: 14px;"><i class="fas ${n.type === 'order_new' ? 'fa-shopping-cart text-primary' : 'fa-box text-success'} me-2"></i>${n.title}</h6>
                <small class="text-muted" style="font-size: 11px;">${time}</small>
            </div>
            <p class="mb-0 text-secondary mt-1" style="font-size: 13px; line-height: 1.4; padding-left: 24px;">${n.message}</p>
        </a>
    `;

    if (append) {
        list.appendChild(li);
    } else {
        list.insertBefore(li, list.firstChild);
    }
}

window.markNotificationsAsRead = async function() {
    const badge = document.getElementById('notificationBadge');
    if (badge && badge.style.display !== 'none') {
        badge.style.display = 'none';
        badge.textContent = '0';
        
        // Remove bg-light from items visually
        document.querySelectorAll('#notificationList .bg-light').forEach(el => el.classList.remove('bg-light'));

        try {
            await fetch('/api/notifications/mark-read/all', { method: 'POST' });
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }
};

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

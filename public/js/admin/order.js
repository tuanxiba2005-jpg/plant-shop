// Cập nhật trạng thái đơn hàng
document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async function () {
        const orderId = this.dataset.id;
        const status = this.value;
        const row = this.closest('tr');

        try {
            const res = await fetch(`/admin/orders/${orderId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();

            if (data.success) {
                const badges = {
                    pending:   'warning',
                    confirmed: 'info',
                    shipping:  'primary',
                    delivered: 'success',
                    cancelled: 'danger'
                };
                const labels = {
                    pending:   'Chờ xác nhận',
                    confirmed: 'Đã xác nhận',
                    shipping:  'Đang giao',
                    delivered: 'Đã giao',
                    cancelled: 'Đã hủy'
                };

                // Cập nhật badge trong row
                const badge = row.querySelector('.badge');
                if (badge) {
                    // Xóa tất cả class bg- cũ
                    badge.className = badge.className
                        .replace(/bg-\w+/g, '')
                        .trim();
                    badge.classList.add(`bg-${badges[status]}`);
                    badge.textContent = labels[status];
                }

                // Cập nhật data-status của row
                row.dataset.status = status;

                showToast('Cập nhật trạng thái thành công!', 'success');
            } else {
                showToast('Cập nhật thất bại!', 'danger');
                // Rollback select về giá trị cũ
                location.reload();
            }
        } catch (err) {
            console.error('Update status error:', err);
            showToast('Lỗi kết nối!', 'danger');
            location.reload();
        }
    });
});

// Lọc theo trạng thái
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const status = this.dataset.status;
        document.querySelectorAll('#ordersTable tbody tr').forEach(row => {
            row.style.display = (status === 'all' || row.dataset.status === status) ? '' : 'none';
        });
    });
});
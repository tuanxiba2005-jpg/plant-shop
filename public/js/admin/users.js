document.querySelectorAll('.btn-toggle-block').forEach(btn => {
    btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        const isBlocked = this.dataset.blocked === 'true';
        const action = isBlocked ? 'mở khóa' : 'khóa';

        if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

        const res = await fetch(`/admin/users/${id}/toggle-block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Đã ${action} tài khoản thành công!`, isBlocked ? 'success' : 'danger');
            setTimeout(() => location.reload(), 1000);
        }
    });
});
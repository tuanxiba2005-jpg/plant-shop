document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async function () {
            const id = this.dataset.id;
            const status = this.value;
            const res = await fetch(`/staff/orders/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Cập nhật thành công!', 'success');
                setTimeout(() => location.reload(), 800);
            } else {
                showToast('Cập nhật thất bại!', 'danger');
                setTimeout(() => location.reload(), 1500);
            }
        });
    });

    let adminReturnModal;
    if (document.getElementById('adminReturnModal')) {
        adminReturnModal = new bootstrap.Modal(document.getElementById('adminReturnModal'));
    }

    window.viewReturnRequest = async function(orderId) {
        if (!adminReturnModal) return;
        const content = document.getElementById('adminReturnContent');
        const footer = document.getElementById('adminReturnFooter');
        content.innerHTML = '<div class="text-center py-4"><span class="spinner-border text-success"></span></div>';
        footer.innerHTML = '';
        adminReturnModal.show();

        try {
            const res = await fetch(`/staff/orders/${orderId}/return-detail`);
            const data = await res.json();
            
            if (data.success && data.order) {
                const req = data.order.return_request || {};
                let imagesHtml = '';
                if (req.images && req.images.length > 0) {
                    imagesHtml = `<div class="d-flex gap-2 flex-wrap mt-2">
                        ${req.images.map(img => `<img src="/images/returns/${img}" style="width:100px; height:100px; object-fit:cover; border-radius:8px; border:1px solid #ddd; cursor:pointer;" onclick="window.open('/images/returns/${img}', '_blank')">`).join('')}
                    </div>`;
                }
                content.innerHTML = `
                    <div class="mb-3">
                        <strong>Khách hàng:</strong> ${data.order.user_id?.name || 'N/A'}<br>
                        <strong>Ngày yêu cầu:</strong> ${req.requested_at ? new Date(req.requested_at).toLocaleString('vi-VN') : 'N/A'}
                    </div>
                    <div class="mb-3">
                        <label class="fw-bold">Lý do hoàn hàng:</label>
                        <div class="p-3 bg-light rounded">${req.reason || 'Không có lý do'}</div>
                    </div>
                    <div class="mb-3">
                        <label class="fw-bold">Hình ảnh chứng minh:</label>
                        ${imagesHtml || '<p class="text-muted">Không có hình ảnh</p>'}
                    </div>
                `;
                if (data.order.status === 'return_requested') {
                    footer.innerHTML = `
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        <button type="button" class="btn btn-danger" onclick="processReturn('${orderId}', 'reject')">Từ chối</button>
                        <button type="button" class="btn btn-success" onclick="processReturn('${orderId}', 'approve')">Chấp nhận hoàn</button>
                    `;
                } else {
                    footer.innerHTML = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>`;
                }
            }
        } catch (err) {
            content.innerHTML = '<div class="text-danger">Lỗi kết nối.</div>';
        }
    };

    window.processReturn = async function(orderId, action) {
        if (!confirm(`Bạn có chắc chắn muốn ${action === 'approve' ? 'chấp nhận' : 'từ chối'} yêu cầu hoàn hàng này?`)) return;
        try {
            const res = await fetch(`/staff/orders/${orderId}/process-return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Đã xử lý yêu cầu hoàn hàng', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast(data.message || 'Lỗi xử lý', 'danger');
            }
        } catch (err) {
            showToast('Lỗi kết nối!', 'danger');
        }
    };
});

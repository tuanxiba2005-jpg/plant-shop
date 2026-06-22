document.addEventListener('DOMContentLoaded', () => {
// Lọc theo trạng thái và khoảng ngày
function getStaffFilterParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        status: urlParams.get('status') || 'all',
        startDate: urlParams.get('startDate') || '',
        endDate: urlParams.get('endDate') || ''
    };
}

function applyStaffFilters(status, startDate, endDate) {
    let url = `?status=${status}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    window.location.href = url;
}

document.addEventListener('DOMContentLoaded', () => {
    const params = getStaffFilterParams();
    
    const startDateInput = document.getElementById('staffFilterStartDate');
    const endDateInput = document.getElementById('staffFilterEndDate');
    
    const handleDateChange = () => {
        const start = startDateInput?.value;
        const end = endDateInput?.value;
        if (start && end) {
            applyStaffFilters(params.status, start, end);
        }
    };

    if (startDateInput) startDateInput.addEventListener('change', handleDateChange);
    if (endDateInput) endDateInput.addEventListener('change', handleDateChange);
});

window.clearStaffDateFilter = function() {
    const params = getStaffFilterParams();
    applyStaffFilters(params.status, '', '');
};

window.updateStatusFast = async function(orderId, status) {
    if (!confirm('Bạn có chắc chắn cập nhật sang trạng thái này?')) return;
    try {
        const res = await fetch(`/staff/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('Cập nhật trạng thái thành công!', 'success');
            setTimeout(() => location.reload(), 800);
        } else {
            showToast(data.message || 'Cập nhật thất bại!', 'danger');
        }
    } catch (err) {
        showToast('Lỗi kết nối!', 'danger');
    }
};



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
                let itemsHtml = '';
                let totalRefund = 0;
                if (req.items && req.items.length > 0) {
                    itemsHtml = `<div class="table-responsive mb-3"><table class="table table-bordered table-sm">
                        <thead class="table-light"><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL trả</th><th>Thành tiền</th></tr></thead>
                        <tbody>`;
                    req.items.forEach(item => {
                        const lineTotal = item.price * item.quantity;
                        totalRefund += lineTotal;
                        itemsHtml += `<tr>
                            <td>${item.name}</td>
                            <td class="text-end">${parseInt(item.price).toLocaleString('vi-VN')}đ</td>
                            <td class="text-center text-danger fw-bold">${item.quantity}</td>
                            <td class="text-end fw-bold text-success">${lineTotal.toLocaleString('vi-VN')}đ</td>
                        </tr>`;
                    });
                    itemsHtml += `<tr><td colspan="3" class="text-end fw-bold">Tổng tiền hoàn:</td><td class="text-end fw-bold text-danger">${totalRefund.toLocaleString('vi-VN')}đ</td></tr>`;
                    itemsHtml += `</tbody></table></div>`;
                } else {
                    totalRefund = data.order.total_price;
                    itemsHtml = `<div class="alert alert-warning mb-3">Yêu cầu hoàn trả TOÀN BỘ đơn hàng. Tổng tiền hoàn: <strong class="text-danger">${totalRefund.toLocaleString('vi-VN')}đ</strong></div>`;
                }
                
                content.innerHTML = `
                    <div class="mb-3">
                        <strong>Khách hàng:</strong> ${data.order.user_id?.name || 'N/A'}<br>
                        <strong>Ngày yêu cầu:</strong> ${req.requested_at ? new Date(req.requested_at).toLocaleString('vi-VN') : 'N/A'}
                    </div>
                    ${itemsHtml}
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

// Xem chi tiết đơn hàng
let orderDetailModal;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('orderDetailModal')) {
        orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    }
});

window.viewOrderDetail = async function(orderId) {
    if (!orderDetailModal) return;
    const content = document.getElementById('orderDetailContent');
    content.innerHTML = '<div class="text-center py-4"><span class="spinner-border text-success"></span></div>';
    orderDetailModal.show();

    try {
        const pathPrefix = window.location.pathname.startsWith('/staff') ? '/staff' : '/admin';
        const res = await fetch(`${pathPrefix}/orders/${orderId}/detail`);
        const data = await res.json();
        
        if (data.success && data.order) {
            const order = data.order;
            
            let itemsHtml = `
                <table class="table table-bordered table-sm mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Hình ảnh</th>
                            <th>Sản phẩm</th>
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            order.items.forEach(item => {
                const imgPath = item.product_id?.image ? `/images/products/${item.product_id.image}` : '/images/default.jpg';
                const total = item.price * item.quantity;
                itemsHtml += `
                    <tr>
                        <td class="text-center"><img src="${imgPath}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                        <td class="align-middle">${item.name}</td>
                        <td class="align-middle text-center">${item.quantity}</td>
                        <td class="align-middle text-end">${parseInt(item.price).toLocaleString('vi-VN')}đ</td>
                        <td class="align-middle text-end text-success fw-bold">${total.toLocaleString('vi-VN')}đ</td>
                    </tr>
                `;
            });
            
            itemsHtml += `
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <td colspan="4" class="text-end fw-bold">Tổng đơn hàng:</td>
                            <td class="text-end text-success fw-bold fs-5">${parseInt(order.total_price).toLocaleString('vi-VN')}đ</td>
                        </tr>
                    </tfoot>
                </table>
            `;

            // Xác định giao diện trạng thái
            const badges = { pending: 'warning', confirmed: 'info', shipping: 'primary', delivered: 'success', cancelled: 'danger', return_requested: 'warning', returned: 'secondary', partially_returned: 'info', return_rejected: 'dark' };
            const labels = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy', return_requested: 'Y/C Hoàn hàng', returned: 'Đã hoàn toàn bộ', partially_returned: 'Đã hoàn 1 phần', return_rejected: 'Từ chối hoàn' };
            const flow = ['pending', 'confirmed', 'shipping', 'delivered'];
            const currentIndex = flow.indexOf(order.status);
            
            let statusHtml = '';
            if (['return_requested', 'returned', 'partially_returned', 'return_rejected'].includes(order.status)) {
                statusHtml = `<span class="badge bg-${badges[order.status]} fs-6 px-3 py-2">${labels[order.status]}</span>`;
            } else if (order.status === 'cancelled') {
                statusHtml = `<span class="badge bg-danger fs-6 px-3 py-2">Đã hủy</span>`;
            } else {
                let options = '';
                flow.forEach((st, idx) => {
                    options += `<option value="${st}" ${order.status === st ? 'selected' : ''} ${idx < currentIndex ? 'disabled' : ''}>${labels[st]}</option>`;
                });
                if (order.status === 'pending' || order.status === 'confirmed') {
                    options += `<option value="cancelled">Đã hủy</option>`;
                }
                statusHtml = `
                    <div class="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                        <select class="form-select form-select-sm fw-bold text-${badges[order.status]}" style="width: 180px;" id="modalStatusSelect" data-id="${order._id}">
                            ${options}
                        </select>
                        <button class="btn btn-sm btn-success" onclick="updateStatusFromModal('${order._id}')">
                            <i class="fas fa-save me-1"></i>Cập nhật
                        </button>
                    </div>
                `;
            }

            content.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div>
                        <h5 class="mb-1 text-success fw-bold">Mã đơn: #${order._id.toString().slice(-8).toUpperCase()}</h5>
                        <small class="text-muted"><i class="far fa-clock me-1"></i>${new Date(order.createdAt).toLocaleString('vi-VN')}</small>
                    </div>
                    <div>
                        ${statusHtml}
                    </div>
                </div>

                <div class="row mb-4 g-3">
                    <div class="col-md-6">
                        <div class="card h-100 border-0 shadow-sm bg-light">
                            <div class="card-body">
                                <h6 class="fw-bold text-success mb-3"><i class="fas fa-user-circle me-2"></i>Khách hàng</h6>
                                <div class="d-flex flex-column gap-2">
                                    <div><strong>Họ tên:</strong> ${order.user_id?.name || 'Khách vãng lai'}</div>
                                    <div><strong>Email:</strong> ${order.user_id?.email || 'N/A'}</div>
                                    <div><strong>Số ĐT:</strong> ${order.phone || order.user_id?.phone || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card h-100 border-0 shadow-sm bg-light">
                            <div class="card-body">
                                <h6 class="fw-bold text-success mb-3"><i class="fas fa-truck me-2"></i>Giao hàng</h6>
                                <div class="d-flex flex-column gap-2">
                                    <div><strong>Địa chỉ:</strong> ${order.address || 'N/A'}</div>
                                    <div><strong>Thanh toán:</strong> <span class="badge bg-secondary">${order.payment_method === 'cod' ? 'COD' : order.payment_method}</span></div>
                                    ${order.note ? `<div class="text-danger"><strong>Ghi chú:</strong> ${order.note}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h6 class="fw-bold text-success mb-3"><i class="fas fa-box-open me-2"></i>Sản phẩm đã đặt</h6>
                <div class="table-responsive shadow-sm rounded border">
                    ${itemsHtml}
                </div>
            `;
        } else {
            content.innerHTML = `<div class="alert alert-danger m-3"><i class="fas fa-exclamation-circle me-2"></i>${data.message || 'Lỗi tải dữ liệu'}</div>`;
        }
    } catch (err) {
        content.innerHTML = '<div class="alert alert-danger m-3"><i class="fas fa-wifi me-2"></i>Lỗi kết nối máy chủ.</div>';
    }
};

window.updateStatusFromModal = async function(orderId) {
    const select = document.getElementById('modalStatusSelect');
    if (!select) return;
    const status = select.value;
    
    try {
        const pathPrefix = window.location.pathname.startsWith('/staff') ? '/staff' : '/admin';
        const res = await fetch(`${pathPrefix}/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('Cập nhật trạng thái thành công!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(data.message || 'Cập nhật thất bại!', 'danger');
        }
    } catch (err) {
        showToast('Lỗi kết nối!', 'danger');
    }
};


// Redesign Logic: Checkboxes, Floating Bar & Search
document.addEventListener('DOMContentLoaded', () => {
    const selectAll = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const floatingBar = document.getElementById('floatingBar');
    const selectedCount = document.getElementById('selectedCount');
    const searchInput = document.getElementById('searchInput');
    const orderRows = document.querySelectorAll('.order-row');

    function updateFloatingBar() {
        if (!floatingBar) return;
        const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
        if (checkedCount > 0) {
            selectedCount.textContent = checkedCount;
            floatingBar.classList.add('visible');
        } else {
            floatingBar.classList.remove('visible');
            if(selectAll) selectAll.checked = false;
        }
    }

    if (selectAll) {
        selectAll.addEventListener('change', function() {
            rowCheckboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            updateFloatingBar();
        });
    }

    rowCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const allChecked = Array.from(rowCheckboxes).every(c => c.checked);
            if(selectAll) selectAll.checked = allChecked;
            updateFloatingBar();
        });
    });

    // Simple search filter
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const term = this.value.toLowerCase();
            orderRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});

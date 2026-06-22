// Review Modal Functions
let reviewModalInstance;
let selectedTags = new Set();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Review Modal
    const modalEl = document.getElementById('reviewModal');
    if (modalEl) {
        reviewModalInstance = new bootstrap.Modal(modalEl);
    }

    const stars = document.querySelectorAll('#starRatingContainer i');
    const ratingTexts = ['Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.value);
            document.getElementById('reviewRating').value = val;
            updateStars(val);
            document.getElementById('ratingText').textContent = ratingTexts[val - 1];
        });
    });

    function updateStars(val) {
        stars.forEach(s => {
            if (parseInt(s.dataset.value) <= val) {
                s.classList.remove('far');
                s.classList.add('fas');
            } else {
                s.classList.remove('fas');
                s.classList.add('far');
            }
        });
    }

    document.querySelectorAll('.review-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagText = tag.dataset.tag;
            if (selectedTags.has(tagText)) {
                selectedTags.delete(tagText);
                tag.style.opacity = '0.5';
            } else {
                selectedTags.add(tagText);
                tag.style.opacity = '1';
            }
        });
    });

    const form = document.getElementById('reviewForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rating = document.getElementById('reviewRating').value;
            if (!rating) return alert('Vui lòng chọn số sao!');

            const payload = {
                product_id: document.getElementById('reviewProductId').value,
                order_id: document.getElementById('reviewOrderId').value,
                rating: rating,
                comment: document.getElementById('reviewComment').value,
                tags: Array.from(selectedTags)
            };

            try {
                const res = await fetch('/orders/review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    alert('Cảm ơn bạn đã đánh giá!');
                    location.reload();
                } else {
                    alert(data.message || 'Có lỗi xảy ra');
                }
            } catch (err) {
                alert('Lỗi kết nối');
            }
        });
    }

    // Tabs functionality
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || 'all';

    const tabs = document.querySelectorAll('.tab-item');
    const cards = document.querySelectorAll('.order-card');

    function switchTab(status) {
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.tab-item[data-status="${status}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        cards.forEach(card => {
            if (status === 'all' || card.dataset.status === status) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        document.querySelectorAll('.date-group').forEach(group => {
            let hasVisible = false;
            group.querySelectorAll('.order-card').forEach(c => {
                if (c.style.display !== 'none') hasVisible = true;
            });
            group.style.display = hasVisible ? 'block' : 'none';
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const status = tab.dataset.status;
            let url = `/orders/my-orders?tab=${status}`;
            const dateVal = document.getElementById('filterDate')?.value;
            if (dateVal) url += `&date=${dateVal}`;
            window.history.pushState({}, '', url);
            switchTab(status);
        });
    });

    switchTab(initialTab);

    // Date Filter
    const filterDate = document.getElementById('filterDate');
    if (filterDate) {
        filterDate.addEventListener('change', (e) => {
            const dateVal = e.target.value;
            let url = `/orders/my-orders?tab=${document.querySelector('.tab-item.active').dataset.status}`;
            if (dateVal) url += `&date=${dateVal}`;
            window.location.href = url;
        });
    }
});

window.clearDateFilter = function() {
    const activeTab = document.querySelector('.tab-item.active').dataset.status;
    window.location.href = `/orders/my-orders?tab=${activeTab}`;
};

// Open modal from inline onclick
window.openReviewModal = function (productId, orderId, productName) {
    if (!reviewModalInstance) return;
    document.getElementById('reviewProductId').value = productId;
    document.getElementById('reviewOrderId').value = orderId;
    document.getElementById('reviewProductName').textContent = productName;

    document.getElementById('reviewRating').value = '';
    document.getElementById('reviewComment').value = '';

    const stars = document.querySelectorAll('#starRatingContainer i');
    stars.forEach(s => {
        s.classList.remove('fas');
        s.classList.add('far');
    });
    document.getElementById('ratingText').textContent = 'Vui lòng chọn số sao';

    selectedTags.clear();
    document.querySelectorAll('.review-tag').forEach(tag => {
        tag.style.opacity = '0.5';
    });

    reviewModalInstance.show();
};

// Return Modal Functions
let returnModalInstance;

document.addEventListener('DOMContentLoaded', () => {
    const returnModalEl = document.getElementById('returnModal');
    if (returnModalEl) {
        returnModalInstance = new bootstrap.Modal(returnModalEl);
    }

    const returnForm = document.getElementById('returnForm');
    if (returnForm) {
        returnForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const orderId = document.getElementById('returnOrderId').value;
            const btn = document.getElementById('btnSubmitReturn');
            
            const formData = new FormData(this);
            if (document.getElementById('returnImages').files.length === 0) {
                return showToast('Vui lòng tải lên hình ảnh minh chứng', 'danger');
            }

            // Thu thập các items được chọn
            const selectedItems = [];
            document.querySelectorAll('.return-item-checkbox:checked').forEach(cb => {
                const pid = cb.value;
                const qtyInput = document.getElementById(`return_qty_${pid}`);
                const price = cb.dataset.price;
                const name = cb.dataset.name;
                selectedItems.push({
                    product_id: pid,
                    name: name,
                    price: parseFloat(price),
                    quantity: parseInt(qtyInput.value)
                });
            });

            if (selectedItems.length === 0) {
                return showToast('Vui lòng chọn ít nhất một sản phẩm để trả lại', 'danger');
            }

            formData.append('items', JSON.stringify(selectedItems));

            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi...';

            try {
                const res = await fetch(`/orders/${orderId}/return`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                if (data.success) {
                    showToast('Đã gửi yêu cầu hoàn hàng thành công!', 'success');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast(data.message || 'Có lỗi xảy ra', 'danger');
                    btn.disabled = false;
                    btn.textContent = 'Gửi yêu cầu';
                }
            } catch (err) {
                showToast('Lỗi kết nối!', 'danger');
                btn.disabled = false;
                btn.textContent = 'Gửi yêu cầu';
            }
        });
    }
});

window.openReturnModal = function(orderId, itemsJson) {
    if (!returnModalInstance) return;
    document.getElementById('returnOrderId').value = orderId;
    document.getElementById('returnForm').reset();
    document.getElementById('returnImagePreview').innerHTML = '';

    const container = document.getElementById('returnItemsContainer');
    container.innerHTML = '';

    try {
        const items = JSON.parse(itemsJson);
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center border-bottom pb-2 mb-2';
            div.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input return-item-checkbox" type="checkbox" value="${item.product_id}" id="return_item_${item.product_id}" data-price="${item.price}" data-name="${item.name.replace(/"/g, '&quot;')}">
                    <label class="form-check-label d-flex align-items-center" for="return_item_${item.product_id}">
                        <img src="${item.image ? '/images/products/' + item.image : '/images/default.jpg'}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-left: 10px; margin-right: 10px;">
                        <div>
                            <div style="font-size: 14px;" class="fw-bold">${item.name}</div>
                            <div class="text-danger small">₫${parseInt(item.price).toLocaleString('vi-VN')}</div>
                        </div>
                    </label>
                </div>
                <div style="width: 100px;">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">SL</span>
                        <input type="number" class="form-control" id="return_qty_${item.product_id}" value="1" min="1" max="${item.max_quantity}" disabled>
                    </div>
                </div>
            `;
            container.appendChild(div);

            const cb = div.querySelector('.return-item-checkbox');
            const qtyInput = div.querySelector(`#return_qty_${item.product_id}`);
            cb.addEventListener('change', () => {
                qtyInput.disabled = !cb.checked;
            });
        });
    } catch (e) {
        console.error('Lỗi parse items', e);
        container.innerHTML = '<span class="text-danger">Không tải được sản phẩm</span>';
    }

    returnModalInstance.show();
};

window.previewReturnImages = function(input) {
    const preview = document.getElementById('returnImagePreview');
    preview.innerHTML = '';
    if (input.files.length === 0) return;
    if (input.files.length > 5) {
        showToast('Chỉ được tải lên tối đa 5 ảnh', 'danger');
        input.value = '';
        return;
    }
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width:60px; height:60px; object-fit:cover; border-radius:8px; border:2px solid #d8ede4;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
};

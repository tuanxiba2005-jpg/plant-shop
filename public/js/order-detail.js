document.addEventListener('DOMContentLoaded', () => {
    const btnCancel = document.getElementById('btnCancel');
    if(btnCancel) {
        btnCancel.addEventListener('click', async () => {
            // Lấy thông tin thanh toán từ dataset hoặc xử lý trước ở server, ở đây tạm thời dùng confirm đơn giản, 
            // Cần lưu ý EJS đã chèn logic <% if %> vào trong confirm, nên ta sẽ lấy thông báo từ data attribute.
            const message = btnCancel.dataset.confirmMessage || 'Bạn có chắc chắn muốn hủy đơn hàng này?';
            const orderId = btnCancel.dataset.orderId;
            
            if (!confirm(message)) return;
            
            try {
                const res = await fetch(`/orders/${orderId}/cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                    location.reload();
                } else {
                    alert(data.message || 'Lỗi khi hủy đơn hàng');
                }
            } catch (err) {
                alert('Có lỗi xảy ra, vui lòng thử lại sau.');
            }
        });
    }

    // Review Logic
    const reviewModalEl = document.getElementById('reviewModal');
    if(reviewModalEl) {
        const reviewModal = new bootstrap.Modal(reviewModalEl);
        let selectedTags = new Set();
        
        document.querySelectorAll('.btn-review').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('reviewProductId').value = btn.dataset.product;
                document.getElementById('reviewOrderId').value = btn.dataset.order;
                document.getElementById('reviewProductName').textContent = btn.dataset.name;
                
                // Reset
                document.getElementById('reviewRating').value = '';
                document.getElementById('reviewComment').value = '';
                updateStars(0);
                selectedTags.clear();
                updateTagsUI();
                
                reviewModal.show();
            });
        });

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

        function updateTagsUI() {
            document.querySelectorAll('.review-tag').forEach(tag => {
                tag.style.opacity = '0.5';
            });
        }

        document.getElementById('reviewForm').addEventListener('submit', async (e) => {
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
            } catch(err) {
                alert('Lỗi kết nối');
            }
        });
    }
});

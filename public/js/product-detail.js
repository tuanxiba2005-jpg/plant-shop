// Tăng giảm số lượng
document.getElementById('btnMinus')?.addEventListener('click', () => {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
});

document.getElementById('btnPlus')?.addEventListener('click', () => {
    const input = document.getElementById('quantity');
    const max = parseInt(input.max);
    if (parseInt(input.value) < max) {
        input.value = parseInt(input.value) + 1;
    }
});

// Thêm vào giỏ hàng với số lượng tùy chọn
document.querySelector('.btn-add-cart')?.addEventListener('click', async function () {
    const productId = this.dataset.id;
    const quantity = parseInt(document.getElementById('quantity').value);
    const res = await fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (data.success) {
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = data.cartCount;
        showToast('Đã thêm vào giỏ hàng!', 'success');
    } else {
        showToast('Vui lòng đăng nhập!', 'danger');
    }
});

// Fetch and render reviews
document.addEventListener('DOMContentLoaded', async () => {
    const btnCart = document.querySelector('.btn-add-cart');
    if (!btnCart) return; // Không có nút add cart nghĩa là lỗi UI hoặc không có product, nhưng thử lấy qua url
    const productId = btnCart.dataset.id || window.location.pathname.split('/').pop();

    try {
        const res = await fetch(`/orders/reviews/${productId}`);
        const data = await res.json();

        if (data.success) {
            renderReviews(data.stats, data.reviews);
        } else {
            document.getElementById('reviewsContent').innerHTML = '<div class="text-center text-muted py-3">Không thể tải đánh giá.</div>';
        }
    } catch (err) {
        document.getElementById('reviewsContent').innerHTML = '<div class="text-center text-muted py-3">Lỗi kết nối khi tải đánh giá.</div>';
    }
});

function renderReviews(stats, reviews) {
    const container = document.getElementById('reviewsContent');
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-5" style="background:#F2F5F3; border-radius:12px;">Chưa có đánh giá nào cho sản phẩm này.</div>';
        return;
    }

    const { avgRating, total, distribution } = stats;

    // Progress bar colors: 5 to 1
    const barColors = {
        5: '#198754', // Green
        4: '#8bc34a', // Light green
        3: '#cddc39', // Lime
        2: '#ffeb3b', // Yellow
        1: '#FFBF00'  // Amber
    };

    // Render Overview
    let overviewHTML = `
        <div class="row align-items-center mb-5 p-4 shadow-sm" style="background-color: #F9F8F6; border-radius: 12px;">
            <div class="col-md-4 text-center border-end border-light">
                <h1 class="display-3 fw-bold mb-0" style="color: #FFBF00;">${avgRating}</h1>
                <div class="fs-4 mb-2" style="color: #FFBF00;">
                    ${generateStars(avgRating)}
                </div>
                <p class="text-muted mb-0">${total} đánh giá</p>
            </div>
            <div class="col-md-8 px-4">
    `;

    for (let i = 5; i >= 1; i--) {
        const count = distribution[i] || 0;
        const percent = total > 0 ? (count / total) * 100 : 0;
        overviewHTML += `
            <div class="d-flex align-items-center mb-2">
                <div class="text-muted fw-bold me-2" style="width: 20px;">${i}</div>
                <i class="fas fa-star me-3" style="color: #FFBF00; font-size:12px;"></i>
                <div class="progress flex-grow-1" style="height: 10px; border-radius: 10px; background-color: #e9ecef;">
                    <div class="progress-bar" role="progressbar" style="width: ${percent}%; background-color: ${barColors[i]}; border-radius: 10px;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="text-muted ms-3 text-end" style="width: 40px; font-size: 13px;">${count}</div>
            </div>
        `;
    }
    overviewHTML += `</div></div><div class="review-list">`;

    // Render Reviews
    const tagStyles = {
        "🌿 Cây tươi khỏe": "color:#198754; background:#e8f5e9; border: 1px solid #198754;",
        "📦 Đóng gói cẩn thận": "color:#795548; background:#efebe9; border: 1px solid #795548;",
        "🚚 Giao hàng nhanh": "color:#0d6efd; background:#e3f2fd; border: 1px solid #0d6efd;",
        "🌟 Hình dáng đẹp": "color:#FFBF00; background:#fff8e1; border: 1px solid #FFBF00;"
    };

    let reviewsHTML = '';
    reviews.forEach(r => {
        const date = new Date(r.createdAt).toLocaleDateString('vi-VN');
        let tagsHTML = '';
        if (r.tags && r.tags.length > 0) {
            tagsHTML = '<div class="mt-3 d-flex flex-wrap gap-2">';
            r.tags.forEach(t => {
                const style = tagStyles[t] || "color:#6c757d; background:#f8f9fa; border: 1px solid #dee2e6;";
                tagsHTML += `<span class="badge rounded-pill" style="${style} padding: 6px 12px; font-weight: 500;">${t}</span>`;
            });
            tagsHTML += '</div>';
        }

        reviewsHTML += `
            <div class="card mb-4 shadow-sm border-0" style="background-color: #F2F5F3; border-radius: 12px;">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="d-flex align-items-center gap-3">
                            <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 45px; height: 45px; font-size: 18px;">
                                ${r.user_id?.name ? r.user_id.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h6 class="fw-bold mb-0">${r.user_id?.name || 'Khách hàng'}</h6>
                                <small class="text-muted">${date}</small>
                            </div>
                        </div>
                        <div style="color: #FFBF00; font-size: 15px;">
                            ${generateStars(r.rating)}
                        </div>
                    </div>
                    ${r.comment ? `<p class="mb-0 text-dark" style="line-height: 1.6;">${r.comment}</p>` : ''}
                    ${tagsHTML}
                </div>
            </div>
        `;
    });

    container.innerHTML = overviewHTML + reviewsHTML + '</div>';
}

function generateStars(rating) {
    let stars = '';
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    for (let i = 1; i <= 5; i++) {
        if (i <= full) stars += '<i class="fas fa-star"></i>';
        else if (i === full + 1 && half) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}
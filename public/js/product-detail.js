// ============================================================
// FILE: public/js/product-detail.js
// Premium Product Detail Page — Gallery, Lightbox, Reviews
// ============================================================

// ── Quantity Controls ───────────────────────────────────────
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

// ── Add to Cart ─────────────────────────────────────────────
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

// ── Buy Now ─────────────────────────────────────────────
document.querySelector('.pd-btn-buy')?.addEventListener('click', async function (e) {
    e.preventDefault();
    const btn = this;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btn.disabled = true;

    const productId = document.querySelector('.btn-add-cart').dataset.id;
    const quantity = parseInt(document.getElementById('quantity').value);
    try {
        const res = await fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity })
        });
        const data = await res.json();
        if (data.success) {
            window.location.href = '/orders/checkout';
        } else {
            showToast('Vui lòng đăng nhập để mua hàng!', 'danger');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    } catch (e) {
        showToast('Vui lòng đăng nhập!', 'danger');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
});

// ── Gallery Thumbnails ──────────────────────────────────────
document.querySelectorAll('.pd-thumb').forEach(thumb => {
    thumb.addEventListener('click', function () {
        const src = this.dataset.src;
        const mainImg = document.getElementById('mainImage');
        
        // Smooth fade transition
        mainImg.style.opacity = '0';
        setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
        }, 200);

        // Update active state
        document.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});

// Add transition style to main image
const mainImg = document.getElementById('mainImage');
if (mainImg) {
    mainImg.style.transition = 'opacity 0.2s ease';
}

// ── Lightbox ────────────────────────────────────────────────
let lightboxImages = [];
let lightboxIndex = 0;

document.getElementById('mainImageWrapper')?.addEventListener('click', () => {
    // Collect all image sources
    lightboxImages = [];
    document.querySelectorAll('.pd-thumb').forEach(thumb => {
        lightboxImages.push(thumb.dataset.src);
    });

    // Find current active index
    const activeThumb = document.querySelector('.pd-thumb.active');
    if (activeThumb) {
        lightboxIndex = lightboxImages.indexOf(activeThumb.dataset.src);
    }

    openLightbox();
});

function openLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    if (lightboxImages.length === 0) return;
    
    lightboxImg.src = lightboxImages[lightboxIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeLightbox = function () {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
};

window.lightboxNav = function (direction) {
    lightboxIndex += direction;
    if (lightboxIndex < 0) lightboxIndex = lightboxImages.length - 1;
    if (lightboxIndex >= lightboxImages.length) lightboxIndex = 0;
    document.getElementById('lightboxImg').src = lightboxImages[lightboxIndex];
};

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
});

// Close lightbox on backdrop click
document.getElementById('lightbox')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
});

// ── Fetch and Render Reviews ────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const productId = document.querySelector('.btn-add-cart')?.dataset.id
        || window.location.pathname.split('/').pop();
    if (!productId) return;

    try {
        const res = await fetch(`/orders/reviews/${productId}`);
        const data = await res.json();

        if (data.success) {
            // Update rating in hero
            updateHeroRating(data.stats);
            renderReviews(data.stats, data.reviews);
        } else {
            document.getElementById('reviewsContent').innerHTML =
                '<div class="text-center text-muted py-3">Không thể tải đánh giá.</div>';
        }
    } catch (err) {
        document.getElementById('reviewsContent').innerHTML =
            '<div class="text-center text-muted py-3">Lỗi kết nối khi tải đánh giá.</div>';
    }
});

function updateHeroRating(stats) {
    const starsEl = document.getElementById('pdStars');
    const countEl = document.getElementById('pdReviewCount');
    if (starsEl && stats) {
        starsEl.innerHTML = generateStars(stats.avgRating);
        starsEl.style.color = '#d4af37';
    }
    if (countEl && stats) {
        countEl.textContent = `(${stats.total} đánh giá)`;
    }
}

function renderReviews(stats, reviews) {
    const container = document.getElementById('reviewsContent');
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-5" style="background:#f8faf7; border-radius:16px;">Chưa có đánh giá nào cho sản phẩm này.</div>';
        return;
    }

    const { avgRating, total, distribution } = stats;
    const barColors = {
        5: '#2d6a4f', 4: '#52b788', 3: '#95d5b2', 2: '#f39c12', 1: '#e74c3c'
    };

    let overviewHTML = `
        <div class="row align-items-center mb-5 p-4" style="background:#f8faf7; border-radius:16px; border:1px solid #eaf4ef;">
            <div class="col-md-4 text-center border-end border-light">
                <h1 class="display-3 fw-bold mb-0" style="color:#d4af37;">${avgRating}</h1>
                <div class="fs-4 mb-2" style="color:#d4af37;">${generateStars(avgRating)}</div>
                <p class="text-muted mb-0">${total} đánh giá</p>
            </div>
            <div class="col-md-8 px-4">
    `;

    for (let i = 5; i >= 1; i--) {
        const count = distribution[i] || 0;
        const percent = total > 0 ? (count / total) * 100 : 0;
        overviewHTML += `
            <div class="d-flex align-items-center mb-2">
                <div class="text-muted fw-bold me-2" style="width:20px;">${i}</div>
                <i class="fas fa-star me-3" style="color:#d4af37; font-size:12px;"></i>
                <div class="progress flex-grow-1" style="height:8px; border-radius:10px; background-color:#e9ecef;">
                    <div class="progress-bar" role="progressbar"
                         style="width:${percent}%; background-color:${barColors[i]}; border-radius:10px;"></div>
                </div>
                <div class="text-muted ms-3 text-end" style="width:40px; font-size:13px;">${count}</div>
            </div>
        `;
    }
    overviewHTML += `</div></div><div class="review-list">`;

    const tagStyles = {
        "🌿 Cây tươi khỏe": "color:#2d6a4f; background:#e8f5e9; border:1px solid #2d6a4f;",
        "📦 Đóng gói cẩn thận": "color:#795548; background:#efebe9; border:1px solid #795548;",
        "🚚 Giao hàng nhanh": "color:#0d6efd; background:#e3f2fd; border:1px solid #0d6efd;",
        "🌟 Hình dáng đẹp": "color:#d4af37; background:#fff8e1; border:1px solid #d4af37;"
    };

    let reviewsHTML = '';
    reviews.forEach(r => {
        const date = new Date(r.createdAt).toLocaleDateString('vi-VN');
        let tagsHTML = '';
        if (r.tags && r.tags.length > 0) {
            tagsHTML = '<div class="mt-3 d-flex flex-wrap gap-2">';
            r.tags.forEach(t => {
                const style = tagStyles[t] || "color:#6c757d; background:#f8f9fa; border:1px solid #dee2e6;";
                tagsHTML += `<span class="badge rounded-pill" style="${style} padding:6px 12px; font-weight:500;">${t}</span>`;
            });
            tagsHTML += '</div>';
        }

        reviewsHTML += `
            <div class="card mb-4 shadow-sm border-0" style="background:#f8faf7; border-radius:16px;">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="d-flex align-items-center gap-3">
                            <div class="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                 style="width:45px; height:45px; font-size:18px; background:linear-gradient(135deg,#2d6a4f,#52b788);">
                                ${r.user_id?.name ? r.user_id.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h6 class="fw-bold mb-0">${r.user_id?.name || 'Khách hàng'}</h6>
                                <small class="text-muted">${date}</small>
                            </div>
                        </div>
                        <div style="color:#d4af37; font-size:15px;">${generateStars(r.rating)}</div>
                    </div>
                    ${r.comment ? `<p class="mb-0 text-dark" style="line-height:1.6;">${r.comment}</p>` : ''}
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
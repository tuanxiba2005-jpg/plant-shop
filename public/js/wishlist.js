async function removeWishlist(productId) {
    const res = await fetch('/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `product_id=${productId}`
    });
    const data = await res.json();
    if (data.success) {
        const el = document.getElementById('wish-' + productId);
        if (el) el.remove();
    }
}

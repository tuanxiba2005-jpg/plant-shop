// Mở modal sửa và điền dữ liệu vào form
document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function () {
        const id = this.dataset.id;
        document.getElementById('editName').value = this.dataset.name;
        document.getElementById('editPrice').value = this.dataset.price;
        document.getElementById('editStock').value = this.dataset.stock;
        document.getElementById('editDescription').value = this.dataset.description;
        document.getElementById('editCategory').value = this.dataset.category;
        document.getElementById('formEdit').action = `/admin/products/update/${id}`;
        new bootstrap.Modal(document.getElementById('modalEditProduct')).show();
    });
});

// Xóa sản phẩm
document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async function () {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        const id = this.dataset.id;
        const res = await fetch(`/admin/products/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            this.closest('tr').remove();
            showToast('Đã xóa sản phẩm!', 'success');
        }
});

function previewMultiImages(input, previewId) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    if (input.files.length === 0) return;

    const countLabel = document.createElement('small');
    countLabel.className = 'text-success w-100 mb-1';
    countLabel.textContent = `✅ Đã chọn ${input.files.length} ảnh`;
    preview.appendChild(countLabel);

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
}
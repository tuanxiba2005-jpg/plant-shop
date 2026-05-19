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
});
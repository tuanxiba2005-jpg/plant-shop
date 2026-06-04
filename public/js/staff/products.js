document.addEventListener('DOMContentLoaded', () => {
    const modalEditEl = document.getElementById('modalEdit');
    if (modalEditEl) {
        modalEditEl.addEventListener('show.bs.modal', function (e) {
            const btn = e.relatedTarget;
            document.getElementById('editName').value = btn.dataset.name;
            document.getElementById('editDescription').value = btn.dataset.description;
            document.getElementById('editPrice').value = btn.dataset.price;
            document.getElementById('editStock').value = btn.dataset.stock;
            document.getElementById('editCategory').value = btn.dataset.category;
            document.getElementById('editForm').action = `/staff/products/update/${btn.dataset.id}`;
        });
    }
});

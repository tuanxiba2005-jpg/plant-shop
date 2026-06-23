// Event delegation cho các nút trong bảng
document.addEventListener('click', async function(e) {
    // Xử lý nút Sửa
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
        const id = editBtn.dataset.id;
        document.getElementById('editName').value = editBtn.dataset.name;
        document.getElementById('editPrice').value = editBtn.dataset.price;
        document.getElementById('editStock').value = editBtn.dataset.stock;
        document.getElementById('editDescription').value = editBtn.dataset.description;
        document.getElementById('editCategory').value = editBtn.dataset.category;
        document.getElementById('formEdit').action = `/admin/products/update/${id}`;
        new bootstrap.Modal(document.getElementById('modalEditProduct')).show();
    }

    // Xử lý nút Xóa
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        const id = deleteBtn.dataset.id;
        const res = await fetch(`/admin/products/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            deleteBtn.closest('tr').remove();
            showToast('Đã xóa sản phẩm!', 'success');
        }
    }
});

// Xử lý form submit bằng AJAX để không phải load lại trang
function handleAjaxForm(formId, modalId, successMessage) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const res = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            
            if (data.success) {
                // Đóng modal
                bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
                showToast(successMessage, 'success');
                
                // Cập nhật lại HTML của bảng mà không load lại trang
                const htmlRes = await fetch(window.location.href);
                const htmlText = await htmlRes.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                
                // Lấy phần tbody mới và thay thế
                const newTbody = doc.querySelector('table tbody');
                const oldTbody = document.querySelector('table tbody');
                if (newTbody && oldTbody) {
                    oldTbody.innerHTML = newTbody.innerHTML;
                }
                
                form.reset();
            } else {
                showToast(data.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (err) {
            showToast('Lỗi kết nối server', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

handleAjaxForm('formAddProduct', 'modalAddProduct', 'Đã thêm sản phẩm thành công!');
handleAjaxForm('formEdit', 'modalEditProduct', 'Đã cập nhật sản phẩm!');

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
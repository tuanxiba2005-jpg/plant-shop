let deleteId = null;

// ---- Bộ lọc ----
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active', 'btn-success');
            b.classList.add('btn-outline-secondary');
        });
        this.classList.add('active', 'btn-success');
        this.classList.remove('btn-outline-secondary');

        const filter = this.dataset.filter;
        document.querySelectorAll('#usersBody tr').forEach(row => {
            const role = row.dataset.role;
            const blocked = row.dataset.blocked === 'true';
            if (filter === 'all') row.style.display = '';
            else if (filter === 'user') row.style.display = role === 'user' ? '' : 'none';
            else if (filter === 'staff') row.style.display = role === 'staff' ? '' : 'none';
            else if (filter === 'blocked') row.style.display = blocked ? '' : 'none';
        });
    });
});

// ---- Đổi role ----
document.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async function () {
        const id = this.dataset.id;
        const role = this.value;
        const res = await fetch(`/admin/users/${id}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Đã cập nhật vai trò!', 'success');
            // Cập nhật data-role của row để filter hoạt động đúng
            this.closest('tr').dataset.role = role;
        } else {
            showToast(data.message || 'Lỗi!', 'danger');
        }
    });
});

// ---- Thêm người dùng ----
const btnCreate = document.getElementById('btnCreate');
if(btnCreate) {
    btnCreate.addEventListener('click', async () => {
        const name = document.getElementById('createName').value.trim();
        const email = document.getElementById('createEmail').value.trim();
        const password = document.getElementById('createPassword').value;
        const role = document.getElementById('createRole').value;
        const errEl = document.getElementById('createError');

        if (!name || !email || !password) {
            errEl.textContent = 'Vui lòng điền đầy đủ thông tin!';
            errEl.classList.remove('d-none');
            return;
        }
        if (password.length < 6) {
            errEl.textContent = 'Mật khẩu tối thiểu 6 ký tự!';
            errEl.classList.remove('d-none');
            return;
        }

        const res = await fetch('/admin/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Đã thêm người dùng!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalCreate')).hide();
            setTimeout(() => location.reload(), 800);
        } else {
            errEl.textContent = data.message || 'Lỗi!';
            errEl.classList.remove('d-none');
        }
    });
}

// ---- Mở modal sửa ----
document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function () {
        document.getElementById('editId').value = this.dataset.id;
        document.getElementById('editName').value = this.dataset.name;
        document.getElementById('editEmail').value = this.dataset.email;
        document.getElementById('editPassword').value = '';
        document.getElementById('editError').classList.add('d-none');
    });
});

// ---- Lưu sửa ----
const btnEdit = document.getElementById('btnEdit');
if(btnEdit) {
    btnEdit.addEventListener('click', async () => {
        const id = document.getElementById('editId').value;
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const password = document.getElementById('editPassword').value;
        const errEl = document.getElementById('editError');

        if (!name || !email) {
            errEl.textContent = 'Vui lòng điền đầy đủ thông tin!';
            errEl.classList.remove('d-none');
            return;
        }

        const res = await fetch(`/admin/users/${id}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Đã cập nhật!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalEdit')).hide();
            setTimeout(() => location.reload(), 800);
        } else {
            errEl.textContent = data.message || 'Lỗi!';
            errEl.classList.remove('d-none');
        }
    });
}

// ---- Block / Unblock ----
document.querySelectorAll('.btn-toggle-block').forEach(btn => {
    btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        const res = await fetch(`/admin/users/${id}/toggle-block`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast('Đã cập nhật trạng thái!', 'success');
            setTimeout(() => location.reload(), 800);
        } else {
            showToast(data.message || 'Lỗi!', 'danger');
        }
    });
});

// ---- Xóa ----
document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function () {
        deleteId = this.dataset.id;
        document.getElementById('deleteName').textContent = this.dataset.name;
        new bootstrap.Modal(document.getElementById('modalDelete')).show();
    });
});

const btnConfirmDelete = document.getElementById('btnConfirmDelete');
if(btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
        if (!deleteId) return;
        const res = await fetch(`/admin/users/${deleteId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Đã xóa người dùng!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalDelete')).hide();
            setTimeout(() => location.reload(), 800);
        } else {
            showToast(data.message || 'Lỗi!', 'danger');
        }
    });
}
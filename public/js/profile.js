document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar-menu a[data-target]');
    const tabContents = document.querySelectorAll('.tab-pane');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');
            
            // Hide all tabs
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Show target tab
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if(targetElement) {
                targetElement.style.display = 'block';
            }
        });
    });

    // Handle eye icon for password toggling
    window.togglePwd = function(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // Live search for orders
    const searchInput = document.getElementById('searchInput');
    const tableRows = document.querySelectorAll('#historyTable tbody tr[data-search]');
    if(searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            tableRows.forEach(row => {
                const searchString = row.getAttribute('data-search');
                if(searchString.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Remove from wishlist function
    window.removeFromWishlist = async function(productId) {
        if(!confirm('Bạn có chắc muốn bỏ yêu thích sản phẩm này?')) return;
        try {
            const res = await fetch('/wishlist/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId })
            });
            const data = await res.json();
            if(data.success) {
                location.reload();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch(err) {
            console.error(err);
            alert('Lỗi kết nối!');
        }
    };
});

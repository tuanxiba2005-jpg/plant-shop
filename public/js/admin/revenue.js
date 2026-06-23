document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo biểu đồ
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Cấu hình gradient cho Bar chart
    const gradientBar = ctx.createLinearGradient(0, 0, 0, 400);
    gradientBar.addColorStop(0, 'rgba(26, 107, 60, 0.9)'); // --primary
    gradientBar.addColorStop(1, 'rgba(26, 107, 60, 0.4)');

    const revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: window.chartInitData?.labels || [],
            datasets: [
                {
                    label: 'Doanh thu (VNĐ)',
                    data: window.chartInitData?.revenue || [],
                    backgroundColor: gradientBar,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Số đơn hàng',
                    data: window.chartInitData?.orders || [],
                    type: 'line',
                    borderColor: '#f5a623', // --accent
                    backgroundColor: '#f5a623',
                    borderWidth: 3,
                    tension: 0.3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#f5a623',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { family: 'Inter', size: 13 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#111827',
                    bodyColor: '#4b5563',
                    borderColor: 'rgba(0,0,0,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.datasetIndex === 0) {
                                label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.raw);
                            } else {
                                label += context.raw + ' đơn';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter' } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(0,0,0,0.04)', borderDash: [5, 5] },
                    ticks: {
                        font: { family: 'Inter' },
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000) + ' Tr';
                            if (value >= 1000) return (value / 1000) + ' K';
                            return value;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { font: { family: 'Inter' }, stepSize: 1 }
                }
            }
        }
    });

    // 2. Xử lý Date Filter Pills
    const filterPills = document.querySelectorAll('.date-filter-pill');
    const customDateContainer = document.getElementById('customDateContainer');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const applyCustomDateBtn = document.getElementById('applyCustomDate');
    const currentFilterLabel = document.getElementById('currentFilterLabel');

    function setActivePill(pill) {
        filterPills.forEach(p => p.classList.remove('active'));
        if (pill) pill.classList.add('active');
    }

    function calculateDateRange(type) {
        const to = new Date();
        const from = new Date();
        
        switch(type) {
            case 'today':
                from.setHours(0,0,0,0);
                break;
            case '7days':
                from.setDate(to.getDate() - 6);
                break;
            case '30days':
                from.setDate(to.getDate() - 29);
                break;
            case 'thisMonth':
                from.setDate(1);
                break;
            case 'thisYear':
                from.setMonth(0, 1);
                break;
        }
        return { from, to };
    }

    function formatDateForInput(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    async function fetchRevenueData(from, to, labelText) {
        try {
            const url = `/admin/revenue?from=${from.toISOString()}&to=${to.toISOString()}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            const result = await response.json();
            
            if (result.success) {
                // Update Metric Cards
                document.getElementById('metricTotalRevenue').textContent = new Intl.NumberFormat('vi-VN').format(result.data.totalRevenue || 0) + 'đ';
                document.getElementById('metricReturned').textContent = result.data.statusStats['return'] || 0;
                document.getElementById('metricCancelled').textContent = result.data.statusStats['cancelled'] || 0;
                document.getElementById('metricDelivered').textContent = result.data.statusStats['delivered'] || 0;
                document.getElementById('metricProcessing').textContent = (result.data.statusStats['pending'] || 0) + (result.data.statusStats['confirmed'] || 0) + (result.data.statusStats['shipping'] || 0);

                // Update Chart
                revenueChart.data.labels = result.data.chart.labels;
                revenueChart.data.datasets[0].data = result.data.chart.revenue;
                revenueChart.data.datasets[1].data = result.data.chart.orders;
                revenueChart.update();

                // Update Top Products (optional, but good if we also filter it)
                updateTopProductsTable(result.data.topProducts);

                // Update Label
                currentFilterLabel.textContent = labelText;
                
                // Fetch new Top Customers
                fetchTopCustomers();
            }
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu doanh thu:', err);
            // Có thể thêm toast thông báo lỗi ở đây
        }
    }

    function updateTopProductsTable(products) {
        const tbody = document.getElementById('topProductsTbody');
        if (!tbody) return;
        
        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Chưa có dữ liệu sản phẩm trong thời gian này</td></tr>';
            return;
        }

        let html = '';
        products.forEach((p, index) => {
            let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
            html += `
                <tr>
                    <td>${medal}</td>
                    <td class="fw-medium">${p.name}</td>
                    <td><span class="badge bg-light text-dark border">${p.totalQty}</span></td>
                    <td class="fw-bold" style="color: var(--primary);">${new Intl.NumberFormat('vi-VN').format(p.revenue)}đ</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const type = pill.dataset.filter;
            setActivePill(pill);
            
            if (type === 'custom') {
                customDateContainer.classList.remove('d-none');
                return;
            } else {
                customDateContainer.classList.add('d-none');
                const range = calculateDateRange(type);
                fetchRevenueData(range.from, range.to, pill.textContent.trim());
            }
        });
    });

    applyCustomDateBtn.addEventListener('click', () => {
        if (!fromDateInput.value || !toDateInput.value) {
            alert('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc');
            return;
        }
        const from = new Date(fromDateInput.value);
        const to = new Date(toDateInput.value);
        if (from > to) {
            alert('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }
        
        fetchRevenueData(from, to, `${formatDateForInput(from)} đến ${formatDateForInput(to)}`);
    });

    // 3. Xử lý Top Customers
    const topCustomersLimit = document.getElementById('topCustomersLimit');
    
    async function fetchTopCustomers() {
        const limit = topCustomersLimit ? topCustomersLimit.value : 5;
        try {
            const response = await fetch(`/admin/revenue/top-customers?limit=${limit}`);
            const result = await response.json();
            
            if (result.success) {
                const tbody = document.getElementById('topCustomersTbody');
                if (!tbody) return;

                if (!result.data || result.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có dữ liệu khách hàng</td></tr>';
                    return;
                }

                let html = '';
                result.data.forEach((c, index) => {
                    let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span class="text-muted fw-bold">${index + 1}</span>`;
                    const initial = c.name ? c.name.charAt(0).toUpperCase() : '?';
                    
                    html += `
                        <tr class="customer-row">
                            <td class="text-center">${medal}</td>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="avatar-circle">${initial}</div>
                                    <div>
                                        <div class="fw-bold text-dark">${c.name}</div>
                                        <div class="text-muted" style="font-size: 12px;">${c.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-center"><span class="badge bg-light text-dark border">${c.ordersCount}</span></td>
                            <td class="text-end fw-bold" style="color: var(--primary);">${new Intl.NumberFormat('vi-VN').format(c.totalSpent)}đ</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-light border btn-view-user" title="Chi tiết"><i class="ti ti-eye"></i></button>
                            </td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu khách hàng:', err);
        }
    }

    if (topCustomersLimit) {
        topCustomersLimit.addEventListener('change', fetchTopCustomers);
    }

    // Tải dữ liệu ban đầu cho khách hàng
    fetchTopCustomers();

    // 4. Xuất PDF bằng html2pdf
    const btnExportPdf = document.getElementById('btnExportPdf');
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            // Tạm ẩn các thành phần không cần thiết khi in
            const filterRow = document.querySelector('.filter-row');
            if (filterRow) filterRow.style.display = 'none';
            btnExportPdf.style.display = 'none';

            const element = document.getElementById('pdfContentArea');
            const opt = {
                margin:       10,
                filename:     `Bao_cao_doanh_thu_${new Date().getTime()}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Đổi text title
            const originalTitle = document.title;
            document.title = 'Bao_cao_doanh_thu';

            // Dùng html2pdf
            html2pdf().set(opt).from(element).save().then(() => {
                // Khôi phục UI
                if (filterRow) filterRow.style.display = '';
                btnExportPdf.style.display = '';
                document.title = originalTitle;
            });
        });
    }

    // Chọn sẵn "Tháng này" nếu chưa có dữ liệu chart cụ thể
    // Thay vì chọn sẵn, ta có thể trigger click vào 30 ngày hoặc tháng này để load dữ liệu đầu tiên
    // Nếu load trang lần đầu chartData từ controller rỗng, ta kích hoạt fetch data
    const firstPill = document.querySelector('[data-filter="thisMonth"]');
    if (firstPill && (!window.chartInitData || window.chartInitData.revenue.length === 0)) {
        firstPill.click();
    }
});
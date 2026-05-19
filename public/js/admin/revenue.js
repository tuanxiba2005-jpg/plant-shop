// Vẽ biểu đồ doanh thu
const ctx = document.getElementById('revenueChart');
if (ctx && window.revenueData) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: window.revenueData.map(m => `Tháng ${m.month}`),
            datasets: [
                {
                    label: 'Doanh thu (đ)',
                    data: window.revenueData.map(m => m.revenue),
                    backgroundColor: 'rgba(45, 106, 79, 0.7)',
                    borderColor: '#2d6a4f',
                    borderWidth: 2,
                    borderRadius: 5,
                    yAxisID: 'y'
                },
                {
                    label: 'Số đơn hàng',
                    data: window.revenueData.map(m => m.orders),
                    type: 'line',
                    borderColor: '#52b788',
                    backgroundColor: 'rgba(82, 183, 136, 0.2)',
                    borderWidth: 2,
                    pointRadius: 5,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return ' Doanh thu: ' + parseInt(context.raw).toLocaleString('vi-VN') + 'đ';
                            }
                            return ' Số đơn: ' + context.raw;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        callback: val => parseInt(val).toLocaleString('vi-VN') + 'đ'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}
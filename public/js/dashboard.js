document.addEventListener('DOMContentLoaded', function () {
    const AUTH_TOKEN_KEY = 'iot_auth_token';
    const INDEX_URL = 'index.html';

    // Kiểm tra: nếu không có token, quay về trang index
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
        window.location.replace(INDEX_URL);
        return;
    }

    // Xử lý nút Đăng xuất
    document.getElementById('logout-btn').addEventListener('click', function () {
        confirm('Bạn có chắc chắn muốn đăng xuất không?') &&
            (localStorage.removeItem(AUTH_TOKEN_KEY), window.location.replace(INDEX_URL));
    });
});

//  Khởi tạo Biểu đồ
document.addEventListener('DOMContentLoaded', () => {
    // Biểu đồ
    const ctx = document.getElementById('historicalChart').getContext('2d');
    var defaultChartData = {
        labels: [],
        datasets: [{
            label: 'Chưa có dữ liệu',
            data: [],
            borderColor: '#f0f0f0ff',
            tension: 0.3,
            fill: true,
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            pointRadius: 3
        }]
    };
    var historicalChart = new Chart(ctx, {
        type: 'line', data: defaultChartData, options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Dropdown click
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async function (e) {
            e.preventDefault();
            const sensorType = this.getAttribute('data-sensor');
            const btn = document.getElementById('chart-selector-btn');
            let label, color, unit;
            switch (sensorType) {
                case 'temperature': label = 'Nhiệt Độ'; color = '#dc3545'; unit = '°C'; break;
                case 'humidity': label = 'Độ Ẩm'; color = '#0d6efd'; unit = '%'; break;
                case 'pressure': label = 'Áp Suất'; color = '#ffc107'; unit = 'hPa'; break;
                case 'altitude': label = 'Độ Cao'; color = '#198754'; unit = 'm'; break;
                default: return;
            }
            btn.textContent = label;

            // Lấy dữ liệu từ server
            const response = await fetch(`http://localhost:5000/api/sensordata/history?type=${sensorType}`);
            const result = await response.json();

            if (result.success) {
                const data = result.data.reverse();
                historicalChart.data.labels = data.map(d => new Date(d.Timestamp).toLocaleTimeString());
                historicalChart.data.datasets[0].data = data.map(d => d.Value);
                historicalChart.data.datasets[0].label = `${label} (${unit})`;
                historicalChart.data.datasets[0].borderColor = color;
                historicalChart.update();
            }
        });
    });
});


// cập nhật dữ liệu hiện tại
async function updateCurrentData() {
    const response = await fetch('http://localhost:5000/api/sensordata/latest');
    const result = await response.json();

    if (result.success) {
        const latest = {};
        result.data.forEach(item => latest[item.Type] = item);

        document.getElementById('current-temp').textContent = `${latest.temperature?.Value ?? '-'} °C`;
        document.getElementById('temp-last-updated').textContent = `${formatTimestamp(latest.temperature?.Timestamp) ?? '...'}`;

        document.getElementById('current-humi').textContent = `${latest.humidity?.Value ?? '-'} %`;
        document.getElementById('humi-last-updated').textContent = `${formatTimestamp(latest.humidity?.Timestamp) ?? '...'}`;

        document.getElementById('current-pres').textContent = `${latest.pressure?.Value ?? '-'} hPa`;
        document.getElementById('pres-last-updated').textContent = `${formatTimestamp(latest.pressure?.Timestamp) ?? '...'}`;

        document.getElementById('current-alti').textContent = `${latest.altitude?.Value ?? '-'} m`;
        document.getElementById('alti-last-updated').textContent = `${formatTimestamp(latest.altitude?.Timestamp) ?? '...'}`;
    }
}

// Hàm format timestamp gọn lại: "dd/mm/yyyy hh:mm:ss"
function formatTimestamp(ts) {
    if (!ts) return '-';
    const date = new Date(ts);
    return `${date.getDate().toString().padStart(2, '0')}/` +
        `${(date.getMonth() + 1).toString().padStart(2, '0')}/` +
        `${date.getFullYear()} ` +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}`;
}


// Cập nhật dữ liệu lần đầu và thiết lập cập nhật tự động (ví dụ: mỗi 5 giây)
updateCurrentData();
setInterval(updateCurrentData, 5000); 
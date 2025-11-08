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

// 1. Khởi tạo Biểu đồ (Sử dụng dữ liệu tĩnh ban đầu)
const ctx = document.getElementById('historicalChart').getContext('2d');
const defaultChartData = {
    labels: ['1h trước', '45m trước', '30m trước', '15m trước', 'Hiện tại'],
    datasets: [{
        label: 'Nhiệt Độ (°C)',
        data: [27.5, 28.0, 28.5, 28.3, 28.5],
        borderColor: '#dc3545',
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        pointRadius: 3
    }]
};

const historicalChart = new Chart(ctx, {
    type: 'line',
    data: defaultChartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false
            }
        }
    }
});

// 2. Chức năng cập nhật Biểu đồ
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function (e) {
        e.preventDefault();
        const sensorType = this.getAttribute('data-sensor');
        const btn = document.getElementById('chart-selector-btn');

        let label, color, unit;

        switch (sensorType) {
            case 'temp': label = 'Nhiệt Độ'; color = '#dc3545'; unit = '°C'; break;
            case 'humi': label = 'Độ Ẩm'; color = '#0d6efd'; unit = '%'; break;
            case 'pres': label = 'Áp Suất'; color = '#ffc107'; unit = 'hPa'; break;
            case 'alti': label = 'Độ Cao'; color = '#198754'; unit = 'm'; break;
            default: return;
        }

        btn.textContent = label;

        // **TODO: Ở đây bạn sẽ gọi API backend để lấy dữ liệu lịch sử (SensorData) theo Type**
        // Ví dụ: fetch(`/api/sensordata/history?type=${sensorType}`)

        // Cập nhật biểu đồ (Sử dụng dữ liệu giả định để minh họa)
        const mockData = {
            'temp': [27.5, 28.0, 28.5, 28.3, 28.5],
            'humi': [60, 62, 65, 63, 65.2],
            'pres': [1010, 1011, 1012.3, 1012, 1012.3],
            'alti': [54.5, 55.0, 55.5, 54.8, 55.0]
        };

        historicalChart.data.datasets[0].label = `${label} (${unit})`;
        historicalChart.data.datasets[0].data = mockData[sensorType];
        historicalChart.data.datasets[0].borderColor = color;
        historicalChart.data.datasets[0].backgroundColor = color.replace(')', ', 0.1)').replace('rgb', 'rgba');
        historicalChart.update();
    });
});

// 3. Hàm giả lập cập nhật dữ liệu hiện tại
function updateCurrentData() {
    // **TODO: Gọi API backend để lấy dữ liệu hiện tại từ SensorData (TOP 1) cho mỗi Type**
    // Ví dụ: fetch('/api/sensordata/latest')

    const latest = {
        temp: { value: (Math.random() * 2 + 27).toFixed(1), time: new Date().toLocaleTimeString() },
        humi: { value: (Math.random() * 5 + 60).toFixed(1), time: new Date().toLocaleTimeString() },
        pres: { value: (Math.random() * 5 + 1010).toFixed(1), time: new Date().toLocaleTimeString() },
        alti: { value: (Math.random() * 1 + 54).toFixed(1), time: new Date().toLocaleTimeString() }
    };

    document.getElementById('current-temp').textContent = `${latest.temp.value} °C`;
    document.getElementById('temp-last-updated').textContent = `Cập nhật: ${latest.temp.time}`;

    document.getElementById('current-humi').textContent = `${latest.humi.value} %`;
    document.getElementById('humi-last-updated').textContent = `Cập nhật: ${latest.humi.time}`;

    document.getElementById('current-pres').textContent = `${latest.pres.value} hPa`;
    document.getElementById('pres-last-updated').textContent = `Cập nhật: ${latest.pres.time}`;

    document.getElementById('current-alti').textContent = `${latest.alti.value} m`;
    document.getElementById('alti-last-updated').textContent = `Cập nhật: ${latest.alti.time}`;
}

// Cập nhật dữ liệu lần đầu và thiết lập cập nhật tự động (ví dụ: mỗi 5 giây)
updateCurrentData();
setInterval(updateCurrentData, 5000); 
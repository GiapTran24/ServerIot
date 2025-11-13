const AUTH_TOKEN_KEY = 'iot_auth_token';
const INDEX_URL = 'index.html';
var gDeviceID = null;

async function fetchDeviceList() {
    if (!window.deviceList) {
        try {
            const res = await fetch('http://localhost:5000/api/devices');
            if (!res.ok) throw new Error('Không thể lấy danh sách thiết bị');
            const devices = await res.json();

            // Lưu vào biến toàn cục để web khác dùng
            window.deviceList = devices.map(d => ({
                id: d.ID,
                device_id: d.device_id,
                name: d.Name,
                status: d.Status
            }));

            console.log('📦 Danh sách thiết bị:', window.deviceList);

        } catch (err) {
            console.error('❌ Lỗi khi lấy danh sách thiết bị:', err);
        }
    }
}

// 🧩 Lấy trạng thái hiện tại từ API
    async function fetchDeviceStatus() {
        try {
            const res = await fetch(`http://localhost:5000/api/devices/${deviceId}`);
            if (!res.ok) throw new Error('Không lấy được trạng thái thiết bị');
            const data = await res.json();
            currentStatus = data.status || 'OFF';
            updateButtonUI();
        } catch (err) {
            console.error(err);
        }
    }

    
// cập nhật dữ liệu hiện tại
async function updateCurrentData() {
    const response = await fetch('http://localhost:5000/api/sensordata/latest');
    const result = await response.json();

    if (result.success) {
        const latest = {};
        result.data.forEach(item => latest[item.Type] = item);

        document.getElementById('current-temp').textContent = `${latest.temperature?.Value ?? '-'} °C`;

        document.getElementById('current-humi').textContent = `${latest.humidity?.Value ?? '-'} %`;

        document.getElementById('current-pres').textContent = `${latest.pressure?.Value ?? '-'} hPa`;

        document.getElementById('current-alti').textContent = `${latest.altitude?.Value ?? '-'} m`;
    }
}
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${h}:${m}:${s}`;
}


document.addEventListener('DOMContentLoaded', function () {
    // Kiểm tra: nếu không có token, quay về trang index
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
        window.location.replace(INDEX_URL);
        return;
    }

    // Tải danh sách thiết bị
    fetchDeviceList().then(() => {
        // Cập nhật dropdown thiết bị
        const deviceSelect = document.getElementById('deviceSelect');
        deviceSelect.innerHTML = '';

        // Sử dụng dữ liệu từ biến toàn cục nếu có
        const devices = window.deviceList;
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = `${device.name}`;
            deviceSelect.appendChild(option);
        });

        const randomIndex = Math.floor(Math.random() * devices.length);
        deviceSelect.selectedIndex = randomIndex;
        gDeviceID = devices[randomIndex].id;
        console.log('🔔 Thiết bị được chọn:', gDeviceID);
    });

    // Cập nhật ngay khi load và sau đó mỗi giây
    updateClock();
    setInterval(updateClock, 1000);

    // Xử lý nút Đăng xuất
    document.getElementById('logout-btn').addEventListener('click', function () {
        confirm('Bạn có chắc chắn muốn đăng xuất không?') &&
            (localStorage.removeItem(AUTH_TOKEN_KEY), window.location.replace(INDEX_URL));
    });
});

// Hiển thị tên tài khoản trên navbar
document.addEventListener('DOMContentLoaded', () => {
    const userAccountElem = document.getElementById('user-account');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        try {
            const payloadBase64 = token.split('.')[1];
            const payloadJson = atob(payloadBase64);
            const payload = JSON.parse(payloadJson);
            userAccountElem.textContent = payload.username || 'Accounts';
        } catch (err) {
            console.error('❌ Lỗi khi giải mã token:', err);
            userAccountElem.textContent = 'Accounts';
        }
    } else {
        userAccountElem.textContent = 'Accounts';
    }
});




// change device select
document.getElementById('deviceSelect').addEventListener('change', async function() {
    gDeviceID = parseInt(this.value);

    // 1. Cập nhật trạng thái nút Bật/Tắt
    await fetchDeviceStatus();

    // 2. Cập nhật dữ liệu hiện tại
    await updateCurrentData();

    // 3. Cập nhật biểu đồ (nếu muốn tự động lấy lại dữ liệu sensor đang hiển thị)
    const btn = document.getElementById('chart-selector-btn');
    if (btn && btn.getAttribute('data-sensor')) {
        const sensorType = btn.getAttribute('data-sensor');
        updateChart(sensorType);
    }
});







// Dieu khien thiet bi:
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-toggle');
    const updateData = document.getElementById('btn-sync');

    // 🧠 Giả sử ID thiết bị là 1 (hoặc bạn lấy động từ DB hay localStorage)
    const deviceId = 1;
    let currentStatus = 'OFF'; // Mặc định ban đầu

    // Hàm cập nhật giao diện
    function updateButtonUI() {
        if (currentStatus === 'ON') {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-danger');
            btn.innerHTML = '<i class="fas fa-toggle-off me-2"></i> Thiết bị đang tắt';
        } else {
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-success');
            btn.innerHTML = '<i class="fas fa-toggle-on me-2"></i> Đang hoạt động';
        }
    }

    // nhan nut yeu cau cap nhat du lieu:
    updateData.addEventListener('click', async () => {
        await updateCurrentData();
        alert('Dữ liệu hiện tại đã được cập nhật!');
    });

    // 🧩 Khi nhấn nút Bật/Tắt
    btn.addEventListener('click', async () => {
        const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';

        try {
            const res = await fetch(`http://localhost:5000/api/devices/${deviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
            const result = await res.json();

            console.log(result.message);
            currentStatus = newStatus;
            updateButtonUI();
        } catch (err) {
            console.error(err);
            alert('Có lỗi khi cập nhật trạng thái thiết bị');
        }
    });

    // Gọi 1 lần khi load trang để hiển thị trạng thái hiện tại
    fetchDeviceStatus();
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

    // history table
});

function formatTimestamp(ts) {
    if (!ts) return '-';
    const date = new Date(ts);

    // Format theo múi giờ Việt Nam
    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        // day: '2-digit',
        // month: '2-digit',
        // year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit'
    }).format(date);
}
updateCurrentData();
setInterval(updateCurrentData, 10000);









// Tìm kiếm và hiển thị dữ liệu đã lọc
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('data-filter-form');
    const tableBody = document.getElementById('resultsTableBody');

    // Hàm format timestamp về dạng HH:mm:ss dd/MM/yyyy
    function formatTimestamp(ts) {
        const date = new Date(ts);
        return new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    // Xử lý khi submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Lấy giá trị từ form
        const date = document.getElementById('filterDate').value;
        const start = document.getElementById('filterTimeStart').value;
        const end = document.getElementById('filterTimeEnd').value;
        const type = document.getElementById('filterSensorType').value;

        // Hiển thị trạng thái đang tải
        tableBody.innerHTML = `
            <tr><td colspan="4" class="text-center text-primary p-4">
                <i class="fas fa-spinner fa-spin me-2"></i>Đang tải dữ liệu...
            </td></tr>
        `;

        try {
            // Gọi API backend
            const res = await fetch(`http://localhost:5000/api/sensordata/filter?date=${date}&start=${start}&end=${end}&type=${type}`);
            if (!res.ok) throw new Error("Lỗi khi tải dữ liệu từ server");
            const data = await res.json();

            // Nếu không có dữ liệu
            if (!data || data.length === 0) {
                tableBody.innerHTML = `
                    <tr><td colspan="4" class="text-center text-muted p-4">
                        Không có dữ liệu trong khoảng thời gian này.
                    </td></tr>
                `;
                return;
            }

            // Tạo nội dung bảng
            tableBody.innerHTML = data.map(item => `
                <tr>
                    <td>${formatTimestamp(item.timestamp)}</td>
                    <td>${item.type}</td>
                    <td>${item.value.toFixed(2)}</td>
                    <td>${item.unit || '-'}</td>
                </tr>
            `).join('');

        } catch (err) {
            console.error(err);
            tableBody.innerHTML = `
                <tr><td colspan="4" class="text-center text-danger p-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>Lỗi khi tải dữ liệu.
                </td></tr>
            `;
        }
    });
});

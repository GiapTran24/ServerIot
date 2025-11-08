async function fetchData() {
    const res = await fetch('/api/sensordata');
    const data = await res.json();
    const tbody = document.querySelector('#sensorTable tbody');
    tbody.innerHTML = '';
    data.forEach(d => {
        const row = `<tr>
            <td>${d.device}</td>
            <td>${d.type}</td>
            <td>${d.value}</td>
            <td>${d.timestamp}</td>
        </tr>`;
        tbody.innerHTML += row;
    });

    const ctx = document.getElementById('sensorChart').getContext('2d');
    const labels = data.map(d => d.timestamp);
    const values = data.map(d => d.value);

    if(window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Sensor Value',
                data: values,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        }
    });
}

setInterval(fetchData, 5000);
fetchData();

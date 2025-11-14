const express = require('express');
const bonjour = require('bonjour')();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const sensorRoutes = require('./routes/sensors');
const sensorDataRoutes = require('./routes/sensorData');

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/sensordata', sensorDataRoutes);

// ⭐ Cổng server
const PORT = process.env.PORT || 5000;

// ⭐ BẮT BUỘC phải listen server trước
const server = app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại cổng ${PORT}`);
    
    // ⭐ Chỉ publish mDNS sau khi server đã chạy
    bonjour.publish({
        name: 'espserver',
        type: 'http',
        port: PORT,
    });

    console.log("🌐 mDNS ready → truy cập: http://espserver.local:" + PORT);
});

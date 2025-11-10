const express = require('express');
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const SensorData = require('../models/sensorData');
const db = require('../db');

exports.getLatest = async (req, res) => {
  try {
    const data = await SensorData.getLatestData();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const type = req.query.type;
    if (!type) return res.status(400).json({ success: false, message: 'Thiếu type' });

    const data = await SensorData.getHistoryByType(type);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

exports.getAll = async (req, res) => {
    try {
        const data = await SensorData.getAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { sensor_id, value } = req.body;
    try {
        const id = await SensorData.create(sensor_id, value);
        res.json({ id, sensor_id, value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createFromDevice = async (req, res) => {
  try {
    const { device_id, device_name, ...data } = req.body;

    if (!device_id) {
      return res.status(400).json({ success: false, message: "Thiếu device_id" });
    }

    const result = await SensorData.createFromDevice(device_id, device_name, data);

    res.status(201).json({
      success: true,
      message: "Dữ liệu được lưu thành công",
      deviceId: result.deviceId,
      insertedData: result.insertIds,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await SensorData.delete(id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFilteredData = async (req, res) => {
    try {
        const { date, start, end, type } = req.query;

        // Ghép thành khoảng thời gian đầy đủ
        const startTime = `${date} ${start}:00`;
        const endTime = `${date} ${end}:00`;

        let query = `
            SELECT sd.Timestamp AS timestamp, s.Type AS type, sd.Value AS value, s.Unit AS unit
            FROM SensorData sd
            JOIN Sensors s ON sd.SensorID = s.ID
            WHERE sd.Timestamp BETWEEN ? AND ?
        `;
        const params = [startTime, endTime];

        if (type !== 'all') {
            query += ` AND s.Type = ?`;
            params.push(type);
        }

        query += ` ORDER BY sd.Timestamp ASC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
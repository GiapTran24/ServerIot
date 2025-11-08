const db = require('../db');

exports.getAll = async () => {
    const [rows] = await db.query('SELECT sd.id, s.type, sd.value, sd.timestamp, d.name as device FROM SensorData sd JOIN Sensors s ON sd.sensor_id = s.id JOIN Devices d ON s.device_id = d.id ORDER BY sd.timestamp DESC');
    return rows;
};

exports.create = async (sensor_id, value) => {
    const [result] = await db.query('INSERT INTO sensordata(sensor_id, value) VALUES (?, ?)', [sensor_id, value]);
    return result.insertId;
};

exports.delete = async (id) => {
    await db.query('DELETE FROM SensorData WHERE id = ?', [id]);
};

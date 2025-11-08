const SensorData = require('../models/SensorData');

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

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await SensorData.delete(id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

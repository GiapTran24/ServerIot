const Sensor = require('../models/Sensor');

exports.getAll = async (req, res) => {
    try {
        const sensors = await Sensor.getAll();
        res.json(sensors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { device_id, type, unit } = req.body;
    try {
        const id = await Sensor.create(device_id, type, unit);
        res.json({ id, device_id, type, unit });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

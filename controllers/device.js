const Device = require('../models/device');

exports.getAll = async (req, res) => {
    try {
        const devices = await Device.getAll();
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.get = async (req, res) => {
    const { id } = req.params;
    try {
        const device = await Device.get(id);
        res.json(device);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { name } = req.body;
    try {
        const id = await Device.create(name);
        res.json({ id, name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await Device.updateStatus(id, status);
        res.json({ message: 'Device updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
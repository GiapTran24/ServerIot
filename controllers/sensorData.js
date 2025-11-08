const SensorData = require('../models/sensorData');

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

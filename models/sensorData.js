const db = require('../db');

exports.getLatestData = async (deviceId) => {
  const [rows] = await db.query(`
    SELECT s.Type, s.Unit, sd.Value, sd.Timestamp
    FROM Sensors s
    JOIN SensorData sd ON sd.SensorID = s.ID
    WHERE s.DeviceID = ?
      AND sd.ID = (
        SELECT MAX(ID)
        FROM SensorData
        WHERE SensorID = s.ID
      )
  `, [deviceId]);

  return rows;
};


exports.getHistoryByType = async (deviceId, type) => {
  const [rows] = await db.query(`
    SELECT s.Type, s.Unit, sd.Value, sd.Timestamp
    FROM SensorData sd
    JOIN Sensors s ON sd.SensorID = s.ID
    WHERE s.DeviceID = ?
      AND s.Type = ?
    ORDER BY sd.Timestamp DESC
    LIMIT 10
  `, [deviceId, type]);

  return rows;
};


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

//Hàm chính: nhận dữ liệu từ ESP32
exports.createFromDevice = async (device_id, device_name, data) => {
  try {
    // 1️⃣ Kiểm tra xem thiết bị có tồn tại không
    const [deviceRows] = await db.query("SELECT * FROM Devices WHERE device_id = ?", [device_id]);
    let deviceId = device_id;

    if (deviceRows.length === 0) {
      // Thiết bị chưa có → tạo mới
      const [insertDevice] = await db.query(
        "INSERT INTO Devices (device_id, Name) VALUES (?, ?)",
        [device_id, device_name || `ESP32_${device_id}`] 
      );
      deviceId = insertDevice.insertId || device_id;
      console.log(`🆕 Tạo mới thiết bị ID=${deviceId}`);
    }

    // 2️⃣ Lấy danh sách sensors hiện có của thiết bị
    const [sensors] = await db.query("SELECT * FROM Sensors WHERE DeviceID = ?", [deviceId]);
    const existingTypes = sensors.map(s => s.Type.toLowerCase());

    // 3️⃣ Danh sách cảm biến cần có (theo dữ liệu ESP32 gửi)
    const sensorTypes = Object.keys(data); // ["temperature", "humidity", "pressure", "altitude"]

    // 4️⃣ Tạo cảm biến mới nếu chưa có
    for (const type of sensorTypes) {
      if (!existingTypes.includes(type)) {
        await db.query(
          "INSERT INTO Sensors (DeviceID, Type, Unit) VALUES (?, ?, ?)",
          [deviceId, type, getUnit(type)]
        );
        console.log(`🆕 Tạo cảm biến mới: ${type}`);
      }
    }

    // 5️⃣ Ghi dữ liệu
    const [allSensors] = await db.query("SELECT * FROM Sensors WHERE DeviceID = ?", [deviceId]);
    const insertIds = [];

    for (const sensor of allSensors) {
      const type = sensor.Type.toLowerCase();
      if (data[type] !== undefined && data[type] !== null) {
        const [result] = await db.query(
          "INSERT INTO SensorData (SensorID, Value) VALUES (?, ?)",
          [sensor.ID, data[type]]
        );
        insertIds.push(result.insertId);
      }
    }

    return { deviceId, insertIds };
  } catch (error) {
    console.error("❌ Lỗi khi lưu dữ liệu từ ESP32:", error);
    throw error;
  }
};

// ⚙️ Hàm phụ: xác định đơn vị cho từng loại cảm biến
function getUnit(type) {
  switch (type.toLowerCase()) {
    case "temperature":
      return "°C";
    case "humidity":
      return "%";
    case "pressure":
      return "hPa";
    case "altitude":
      return "m";
    default:
      return "";
  }
}
const db = require('../db');

exports.getAll = async () => {
    const [rows] = await db.query('SELECT * FROM Sensors');
    return rows;
};

exports.create = async (device_id, type, unit) => {
    const [result] = await db.query('INSERT INTO Sensors(device_id, type, unit) VALUES (?, ?, ?)', [device_id, type, unit]);
    return result.insertId;
};

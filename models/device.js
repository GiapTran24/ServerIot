const db = require('../db');

exports.getAll = async () => {
    const [rows] = await db.query('SELECT * FROM Devices');
    return rows;
};
exports.getDevice = async (id) => {
    const [rows] = await db.query('SELECT * FROM Devices WHERE device_id = ?', [id]);
    return rows;
};

exports.create = async (name) => {
    const [result] = await db.query('INSERT INTO Devices(name) VALUES (?)', [name]);
    return result.insertId;
};

exports.updateStatus = async (id, status) => {
    await db.query('UPDATE Devices SET status = ? WHERE id = ?', [status, id]);
};

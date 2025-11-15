const db = require('../db');

exports.getAll = async () => {
    const [rows] = await db.query('SELECT * FROM Devices');
    return rows;
};

exports.get = async (id) => {
    const [rows] = await db.query('SELECT * FROM Devices WHERE ID = ?', [id]);
    return rows[0];
};

exports.getStatusByDeviceId = async (deviceId) => {
    const [rows] = await db.query(
        "SELECT Status FROM Devices WHERE ID = ?",
        [deviceId]
    );
    return rows.length ? rows[0] : null;
};

exports.create = async (name) => {
    const [result] = await db.query('INSERT INTO Devices(name) VALUES (?)', [name]);
    return result.insertId;
};

exports.updateStatus = async (id, status) => {
    await db.query('UPDATE Devices SET status = ? WHERE id = ?', [status, id]);
};

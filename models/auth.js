const db = require('../db');

const Account = {
  // Tìm user theo username
  findByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM Accounts WHERE Username = ?', [username]);
    return rows[0];
  },

  // Tìm user theo email
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM Accounts WHERE Email = ?', [email]);
    return rows[0];
  },

  // Tạo user mới
  create: async (username, email, passwordHash) => {
    await db.query(
      'INSERT INTO Accounts (Username, Email, PasswordHash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
  }
};

module.exports = Account;
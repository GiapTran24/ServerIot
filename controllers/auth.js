const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Account = require('../models/auth');

// Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    const existingUser = await Account.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
    }

    const existingEmail = await Account.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await Account.create(username, email, passwordHash);

    res.json({ success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' });
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký.' });
  }
};

// Đăng nhập tài khoản
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu tên đăng nhập hoặc mật khẩu.' });
    }

    const user = await Account.findByUsername(username);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const token = jwt.sign(
      { id: user.ID, username: user.Username, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      message: 'Đăng nhập thành công!'
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập.' });
  }
};

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

/* ===== MongoDB 连接 ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

/* ===== 用户模型 ===== */
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password_hash: String,
  role: { type: String, default: 'admin' }
});
const User = mongoose.model('User', UserSchema);

/* ===== 初始化管理员 ===== */
(async () => {
  const exist = await User.findOne({ username: 'admin' });
  if (!exist) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password_hash: hash,
      role: 'admin'
    });
    console.log('✅ 默认管理员已创建：admin / admin123');
  }
})();

/* ===== 登录接口 ===== */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.json({ error: '用户名或密码错误' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.json({ error: '用户名或密码错误' });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, role: user.role });
});

/* ===== 健康检查 ===== */
app.get('/', (_, res) => {
  res.send('✅ MNA Business System API is running');
});

/* ===== 启动 ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));

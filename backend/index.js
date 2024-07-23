const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// NODE_ENVに基づいて適切な.envファイルを読み込む
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const express = require('express');
const session = require('express-session');
const PGSession = require('connect-pg-simple')(session);
const cors = require('cors');
const path = require('path');
const moment = require('moment-timezone');
const authRoutes = require('./routes/authRoutes');
const commonRoutes = require('./routes/commonRoutes');
const artistRoutes = require('./routes/artistRoutes');
const eventRoutes = require('./routes/eventRoutes');
const castingRoutes = require('./routes/castingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const messageArtistRoutes = require('./routes/messageArtistRoutes');
const db = require('./db');
const cron = require('node-cron');
const pool = require('./db');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// 日本時間をデフォルトのタイムゾーンとして設定
moment.tz.setDefault('Asia/Tokyo');

app.use(session({
  store: new PGSession({
    pool: db,
    tableName: 'sessions',
    pruneSessionInterval: 60 * 60 * 24
  }),
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// 1日に1回、古いメッセージ画像を削除するジョブを設定
cron.schedule('0 0 * * *', async () => {
  console.log('Running cron job to delete old message images');
  try {
      const result = await pool.query(
          'SELECT id, file_name FROM message_images WHERE expires_at < NOW()'
      );
      const oldImages = result.rows;

      for (const image of oldImages) {
          const filePath = path.join(__dirname, 'public/messages', image.file_name);
          if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
          }

          await pool.query(
              'DELETE FROM message_images WHERE id = $1',
              [image.id]
          );
      }

      console.log(`Deleted ${oldImages.length} old images`);
  } catch (error) {
      console.error('Error deleting old message images:', error);
  }
});

// 静的ファイルの提供
app.use('/images/flyers', express.static(path.join(__dirname, 'public/flyers')));
app.use('/images/upload-temp', express.static(path.join(__dirname, 'public/upload_temp')));
app.use('/images/admin_profiles', express.static(path.join(__dirname, 'public/admin_profiles')));
app.use('/images/artist_profiles', express.static(path.join(__dirname, 'public/artist_profiles')));
app.use('/images/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/images/placeholders', express.static(path.join(__dirname, 'public/placeholders')));
app.use('/images/messages', express.static(path.join(__dirname, 'public/messages')));

// ルートを使用する
app.use('/api', authRoutes);
app.use('/api', commonRoutes);
app.use('/api', artistRoutes);
app.use('/api', eventRoutes);
app.use('/api', castingRoutes);
app.use('/api', messageRoutes);
app.use('/api', messageArtistRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket設定
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.set('io', io);

app.post('/api/send-message', (req, res) => {
  const { artistId, content, adminUserId } = req.body;

  // クライアントに新しいメッセージを送信
  io.emit('message', JSON.stringify({ artistId, content, adminUserId }));

  console.log('Message sent:', { artistId, content, adminUserId });  // デバッグログを追加

  res.status(200).send({ success: true });
});

app.get('/api/test-connection', (req, res) => {
  console.log('Test connection endpoint hit');
  res.status(200).json({ message: 'Connection successful!' });
});

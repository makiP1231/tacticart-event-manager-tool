const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL;
const ADMIN_PROFILE_IMAGE_PATH = process.env.ADMIN_PROFILE_IMAGE_PATH;
const ARTIST_PROFILE_IMAGE_PATH = process.env.ARTIST_PROFILE_IMAGE_PATH;
const FLYER_IMAGE_PATH = process.env.FLYER_IMAGE_PATH;
const MESSAGE_IMAGE_PATH = process.env.MESSAGE_IMAGE_PATH;

if (!API_URL) {
  throw new Error('API_URL environment variable is not set');
}
if (!ADMIN_PROFILE_IMAGE_PATH) {
  throw new Error('ADMIN_PROFILE_IMAGE_PATH environment variable is not set');
}
if (!ARTIST_PROFILE_IMAGE_PATH) {
  throw new Error('ARTIST_PROFILE_IMAGE_PATH environment variable is not set');
}
if (!FLYER_IMAGE_PATH) {
  throw new Error('FLYER_IMAGE_PATH environment variable is not set');
}
if (!MESSAGE_IMAGE_PATH) {
  throw new Error('MESSAGE_IMAGE_PATH environment variable is not set');
}

const MAX_IMAGE_WIDTH = 2000;
const MAX_IMAGE_HEIGHT = 2000;

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('画像ファイルのみ（jpeg、jpg、png）が許可されています'));
    }
});

const resizeImage = async (buffer) => {
    return await sharp(buffer)
        .rotate()
        .resize({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT, fit: 'inside' })
        .toBuffer();
};

const ensureDirectoryExists = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// メッセージの取得エンドポイント（分割取得対応）
router.get('/artist/messages/:offset/:limit', async (req, res) => {
    const artistId = req.session.userId;
    const offset = parseInt(req.params.offset);
    const limit = parseInt(req.params.limit);
    
    try {
        const messages = await pool.query(
            `SELECT m.id, m.artist_id, m.message_type, 
                    COALESCE(am.content, am2.content) AS content,
                    COALESCE(am.message_format, am2.message_format) AS message_format,
                    COALESCE(am.image_id, am2.image_id) AS image_id,
                    am.admin_user_id,
                    mi.file_name AS image_file_name,
                    m.created_at AT TIME ZONE 'Asia/Tokyo' as created_at,
                    m.is_read,
                    ahc.event_uuid,
                    e.name as event_name,
                    e.performance_type AS event_performance_type,
                    e.genre AS event_genre,
                    e.event_date AS event_date,
                    e.start_time AS event_start_time,
                    e.venue AS event_venue,
                    e.flyer_front_url AS event_flyer_front_url,
                    au.full_name AS admin_full_name,
                    au.nickname AS admin_nickname,
                    (SELECT 1 FROM admin_nickname_permissions p WHERE p.admin_user_id = am.admin_user_id AND p.artist_id = m.artist_id) AS is_nickname_allowed
             FROM messages m
             LEFT JOIN admin_messages am ON m.id = am.message_id
             LEFT JOIN artist_messages am2 ON m.id = am2.message_id
             LEFT JOIN message_images mi ON COALESCE(am.image_id, am2.image_id) = mi.id
             LEFT JOIN artist_hold_casting ahc ON am.hold_casting_id = ahc.id
             LEFT JOIN events e ON ahc.event_uuid = e.event_uuid
             LEFT JOIN admin_users au ON am.admin_user_id = au.id
             WHERE m.artist_id = $1 AND (am.message_id IS NOT NULL OR am2.message_id IS NOT NULL)
             ORDER BY m.created_at DESC
             OFFSET $2 LIMIT $3`,
            [artistId, offset, limit]
        );

        res.json({ messages: messages.rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});



//アーティスト側が管理者のメッセージを既読にするエンドポイント
router.post('/artist/messages/is-read', async (req, res) => {
    const artistId = req.session.userId;
    try {
        const result = await pool.query(
            'UPDATE messages SET is_read = TRUE WHERE artist_id = $1 AND message_type = \'admin_message\' AND is_read = FALSE RETURNING id',
            [artistId]
        );

        // 既読にされたメッセージのIDを取得
        const readMessageIds = result.rows.map(row => row.id);

        // WebSocketで管理者に通知
        if (readMessageIds.length > 0) {
            const io = req.app.get('io');
            io.emit('messages-read', { artistId, readMessageIds });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Server error', details: error.message });
    }
});

// 新しいメッセージの取得エンドポイント
router.get('/artist/messages/new/:lastCreatedAt', async (req, res) => {
    const artistId = req.session.userId;
    const { lastCreatedAt } = req.params;
    try {
        const messages = await pool.query(
            `SELECT m.id, m.artist_id, m.message_type, 
                    COALESCE(am.content, am2.content) AS content,
                    COALESCE(am.message_format, am2.message_format) AS message_format,
                    COALESCE(am.image_id, am2.image_id) AS image_id,
                    am.admin_user_id,
                    mi.file_name AS image_file_name,
                    m.created_at AT TIME ZONE 'Asia/Tokyo' as created_at,
                    m.is_read
             FROM messages m
             LEFT JOIN admin_messages am ON m.id = am.message_id
             LEFT JOIN artist_messages am2 ON m.id = am2.message_id
             LEFT JOIN message_images mi ON COALESCE(am.image_id, am2.image_id) = mi.id
             WHERE m.artist_id = $1 AND m.created_at > $2 AND (am.message_id IS NOT NULL OR am2.message_id IS NOT NULL)
             ORDER BY m.created_at`,
            [artistId, new Date(lastCreatedAt).toISOString()]
        );

        res.json({ messages: messages.rows });
    } catch (error) {
        console.error('Error fetching new messages:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// アーティストがテキストメッセージを送信するエンドポイント
router.post('/artist/messages/text', async (req, res) => {
    const artistId = req.session.userId;
    const { content } = req.body;

    if (!content.trim()) {
        return res.status(400).json({ message: 'Content is empty' });
    }

    try {
        const newMessage = await pool.query(
            'INSERT INTO messages (id, artist_id, message_type, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [uuidv4(), artistId, 'artist_message']
        );

        await pool.query(
            'INSERT INTO artist_messages (id, message_id, content, message_format) VALUES ($1, $2, $3, $4)',
            [uuidv4(), newMessage.rows[0].id, content, 'text']
        );

        // artistsテーブルのlast_message_timeを更新
        await pool.query(
            'UPDATE artists SET last_message_time = NOW() WHERE artist_id = $1',
            [artistId]
        );

        // WebSocketを通じてメッセージを送信
        req.app.get('io').emit('new_message', { artistId });

        res.json({ message: newMessage.rows[0] });
    } catch (error) {
        console.error('Error sending text message:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// アーティストが画像を送信するエンドポイント（ソケット対応）
router.post('/artist/messages/images', upload.array('images', 5), async (req, res) => {
    const artistId = req.session.userId;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
        for (const file of files) {
            const imageId = uuidv4();
            const filePath = path.join(__dirname, '..', 'public/messages', imageId + path.extname(file.originalname));
            const resizedBuffer = await resizeImage(file.buffer);

            ensureDirectoryExists(filePath); // ディレクトリの存在を確認し、存在しない場合は作成する

            fs.writeFileSync(filePath, resizedBuffer);

            // 画像のデータベース保存
            await pool.query(
                'INSERT INTO message_images (id, file_name, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL \'1 week\')',
                [imageId, imageId + path.extname(file.originalname)]
            );

            const newMessage = await pool.query(
                'INSERT INTO messages (id, artist_id, message_type, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
                [uuidv4(), artistId, 'artist_message']
            );

            await pool.query(
                'INSERT INTO artist_messages (id, message_id, content, message_format, image_id) VALUES ($1, $2, $3, $4, $5)',
                [uuidv4(), newMessage.rows[0].id, '', 'image', imageId]
            );

            // artistsテーブルのlast_message_timeを更新
            await pool.query(
                'UPDATE artists SET last_message_time = NOW() WHERE artist_id = $1',
                [artistId]
            );

            // WebSocketを通じてメッセージを送信
            req.app.get('io').emit('new_message', { artistId });
        }

        res.json({ message: 'Images uploaded successfully' });
    } catch (error) {
        console.error('Error sending image message:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;

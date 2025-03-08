const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const sharp = require('sharp');
const fs = require('fs');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });

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

const MAX_IMAGE_WIDTH = 2000; // リサイズ後の最大幅
const MAX_IMAGE_HEIGHT = 2000; // リサイズ後の最大高さ

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
        .rotate() // 画像の向きを自動的に修正
        .resize({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT, fit: 'inside' })
        .toBuffer();
};

const ensureDirectoryExists = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// ニックネームの許可を取得するエンドポイント
router.get('/admin/nickname-permissions/:artistId', async (req, res) => {
    const { artistId } = req.params;
    try {
        const result = await pool.query(
            'SELECT admin_user_id FROM admin_nickname_permissions WHERE artist_id = $1',
            [artistId]
        );
        const permissions = result.rows.map(row => row.admin_user_id);
        res.json({ permissions });
    } catch (error) {
        console.error('Error fetching nickname permissions:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// ニックネームの許可を更新するエンドポイント
router.post('/admin/nickname-permission', async (req, res) => {
    const { artistId } = req.body;
    const adminUserId = req.session.adminUserId;  // 現在の管理者IDをセッションから取得
    try {
        await pool.query(
            'INSERT INTO admin_nickname_permissions (id, admin_user_id, artist_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [uuidv4(), adminUserId, artistId]
        );
        res.json({ message: 'ニックネーム許可が更新されました' });
    } catch (error) {
        console.error('Error updating nickname permission:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// ニックネームの許可を削除するエンドポイント
router.delete('/admin/nickname-permission', async (req, res) => {
    const { artistId } = req.body;
    const adminUserId = req.session.adminUserId;  // 現在の管理者IDをセッションから取得
    try {
        await pool.query(
            'DELETE FROM admin_nickname_permissions WHERE admin_user_id = $1 AND artist_id = $2',
            [adminUserId, artistId]
        );
        res.json({ message: 'ニックネーム許可が削除されました' });
    } catch (error) {
        console.error('Error deleting nickname permission:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// 管理者名を取得するエンドポイント
router.get('/admin/name/:adminUserId', async (req, res) => {
    const { adminUserId } = req.params;
    try {
        const result = await pool.query(
            `SELECT full_name, username, nickname 
             FROM admin_users 
             WHERE id = $1`, 
            [adminUserId]
        );

        if (result.rows.length > 0) {
            const adminUser = result.rows[0];
            res.json({
                fullName: adminUser.full_name,
                username: adminUser.username,
                nickname: adminUser.nickname
            });
        } else {
            res.status(404).json({ message: 'Admin user not found' });
        }
    } catch (error) {
        console.error('Error fetching admin name:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// 現在の管理者と選択されたアーティストのニックネーム許可情報を取得するエンドポイント
router.get('/admin/nickname-permission-status/:artistId', async (req, res) => {
    const { artistId } = req.params;
    const adminUserId = req.session.adminUserId;
    try {
        const result = await pool.query(
            'SELECT 1 FROM admin_nickname_permissions WHERE admin_user_id = $1 AND artist_id = $2',
            [adminUserId, artistId]
        );
        const isAllowed = result.rows.length > 0;
        res.json({ isAllowed });
    } catch (error) {
        console.error('Error fetching nickname permission status:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// メッセージの取得エンドポイント（ページネーション対応）
router.get('/messages/:artistId/:offset/:limit', async (req, res) => {
    const { artistId, offset, limit } = req.params;
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
                    ahc.base_event_uuid AS event_uuid,
                    e.name AS event_name,
                    e.genre AS event_genre,
                    e.performance_type AS event_performance_type,
                    e.event_date AS event_date,
                    e.start_time AS event_start_time,
                    e.venue AS event_venue,
                    e.flyer_front_url AS event_flyer_front_url,
                    e.performance_flag AS event_performance_flag,
                    e.original_event_uuid AS event_original_event_uuid,
                    e.use_existing_flyers AS event_use_existing_flyers,
                    (SELECT 1 FROM admin_nickname_permissions p WHERE p.admin_user_id = am.admin_user_id AND p.artist_id = m.artist_id) AS is_nickname_allowed
             FROM messages m
             LEFT JOIN admin_messages am ON m.id = am.message_id
             LEFT JOIN artist_messages am2 ON m.id = am2.message_id
             LEFT JOIN message_images mi ON COALESCE(am.image_id, am2.image_id) = mi.id
             LEFT JOIN artist_hold_casting ahc ON am.hold_casting_id = ahc.id
             LEFT JOIN events e ON ahc.base_event_uuid = e.event_uuid
             WHERE m.artist_id = $1 AND (am.message_id IS NOT NULL OR am2.message_id IS NOT NULL)
             ORDER BY m.created_at DESC
             LIMIT $2 OFFSET $3`,
            [artistId, parseInt(limit), parseInt(offset)]
        );

        res.json({ messages: messages.rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// 管理者側の新しいメッセージを取得するエンドポイント
router.get('/admin/messages/new/:artistId/:lastCreatedAt', async (req, res) => {
    const { artistId, lastCreatedAt } = req.params;
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
                    ahc.base_event_uuid AS event_uuid,
                    e.name as event_name,
                    (SELECT 1 FROM admin_nickname_permissions p WHERE p.admin_user_id = am.admin_user_id AND p.artist_id = m.artist_id) AS is_nickname_allowed
             FROM messages m
             LEFT JOIN admin_messages am ON m.id = am.message_id
             LEFT JOIN artist_messages am2 ON m.id = am2.message_id
             LEFT JOIN message_images mi ON COALESCE(am.image_id, am2.image_id) = mi.id
             LEFT JOIN artist_hold_casting ahc ON am.hold_casting_id = ahc.id
             LEFT JOIN events e ON ahc.base_event_uuid = e.event_uuid
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

// 管理者がテキストメッセージを送信するエンドポイント
router.post('/admin/messages/text', async (req, res) => {
    if (!req.session.adminUserId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { content, artistId } = req.body;

    if (!content.trim()) {
        return res.status(400).json({ message: 'Content is empty' });
    }

    try {
        const newMessage = await pool.query(
            'INSERT INTO messages (id, artist_id, message_type, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [uuidv4(), artistId, 'admin_message']
        );

        await pool.query(
            'INSERT INTO admin_messages (id, message_id, content, message_format, admin_user_id) VALUES ($1, $2, $3, $4, $5)',
            [uuidv4(), newMessage.rows[0].id, content, 'text', req.session.adminUserId]
        );

        // artistsテーブルのlast_message_timeを更新
        await pool.query(
            'UPDATE artists SET last_message_time = NOW() WHERE artist_id = $1',
            [artistId]
        );

        // WebSocketで通知
        req.app.get('io').emit('new_message', { artistId });

        res.json({ message: newMessage.rows[0] });
    } catch (error) {
        console.error('Error sending text message:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// 管理者が画像を送信するエンドポイント
router.post('/admin/messages/images', upload.array('images', 5), async (req, res) => {
    if (!req.session.adminUserId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { artistId } = req.body;
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
                [uuidv4(), artistId, 'admin_message']
            );

            await pool.query(
                'INSERT INTO admin_messages (id, message_id, content, message_format, image_id, admin_user_id) VALUES ($1, $2, $3, $4, $5, $6)',
                [uuidv4(), newMessage.rows[0].id, '', 'image', imageId, req.session.adminUserId]
            );

            // artistsテーブルのlast_message_timeを更新
            await pool.query(
                'UPDATE artists SET last_message_time = NOW() WHERE artist_id = $1',
                [artistId]
            );

            // WebSocketで通知
            req.app.get('io').emit('new_message', { artistId, message: newMessage.rows[0] });
        }

        res.json({ message: 'Images uploaded successfully' });
    } catch (error) {
        console.error('Error sending image message:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// アーティストのメッセージを既読にするエンドポイント
router.post('/admin/messages/is-read', async (req, res) => {
    const { artistId } = req.body;
    const adminUserId = req.session.adminUserId;
    try {
        const result = await pool.query(
            'UPDATE messages SET is_read = TRUE WHERE artist_id = $1 AND message_type = \'artist_message\' AND is_read = FALSE RETURNING id',
            [artistId]
        );

        // 既読にされたメッセージのIDを取得
        const readMessageIds = result.rows.map(row => row.id);

        // WebSocketでアーティストに通知
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

// 古いメッセージ画像を削除するジョブを追加
cron.schedule('0 0 * * *', async () => {
    console.log('Running cron job to delete old message images');
    try {
        const result = await pool.query(
            'SELECT id, file_name FROM message_images WHERE expires_at < NOW()'
        );
        const oldImages = result.rows;

        for (const image of oldImages) {
            const filePath = path.join(__dirname, '..', 'public/messages', image.file_name);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await pool.query(
                'DELETE FROM message_images WHERE id = $1',
                [image.id]
            );

            // メッセージのimage_idをNULLに更新
            await pool.query(
                'UPDATE admin_messages SET image_id = NULL WHERE image_id = $1',
                [image.id]
            );

            await pool.query(
                'UPDATE artist_messages SET image_id = NULL WHERE image_id = $1',
                [image.id]
            );
        }

        console.log(`Deleted ${oldImages.length} old images`);
    } catch (error) {
        console.error('Error deleting old message images:', error);
    }
});

// 管理者ユーザー情報を取得するエンドポイント
router.get('/admin/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id, username, full_name, nickname FROM admin_users WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching admin user details:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});

// artistsテーブルからパート情報を含むアーティストデータを取得するエンドポイント
router.get('/admin/artists-with-parts', async (req, res) => {
    try {
        // メッセージが存在するアーティストを更新順で取得
        const artistsWithMessages = await pool.query(`
            SELECT a.*, 
                   MAX(m.created_at) as last_message,
                   (SELECT p.short_name FROM parts p WHERE p.value = a.parts[1]) as part_short_name,
                   (SELECT p.label FROM parts p WHERE p.value = a.parts[1]) as part_label,
                   array_agg(p.short_name) as part_short_names,
                   array_agg(p.label) as part_labels,
                   (SELECT array_agg(agr.group_id) FROM artist_group_relations agr WHERE agr.artist_id = a.artist_id) as group_ids,
                   (SELECT COUNT(*) FROM messages m WHERE m.artist_id = a.artist_id AND m.is_read = false AND m.message_type != 'admin_message') as unread_messages
            FROM artists a
            LEFT JOIN messages m ON a.artist_id = m.artist_id
            LEFT JOIN unnest(a.parts) part_value ON true
            LEFT JOIN parts p ON p.value = part_value
            WHERE a.email IS NOT NULL
            GROUP BY a.artist_id
            HAVING MAX(m.created_at) IS NOT NULL
            ORDER BY last_message DESC
        `);

        // メッセージが存在しないアーティストをpartsのsort_order順で取得
        const artistsWithoutMessages = await pool.query(`
            SELECT a.*, 
                   NULL as last_message,
                   (SELECT p.short_name FROM parts p WHERE p.value = a.parts[1]) as part_short_name,
                   (SELECT p.label FROM parts p WHERE p.value = a.parts[1]) as part_label,
                   array_agg(p.short_name) as part_short_names,
                   array_agg(p.label) as part_labels,
                   (SELECT array_agg(agr.group_id) FROM artist_group_relations agr WHERE agr.artist_id = a.artist_id) as group_ids,
                   0 as unread_messages
            FROM artists a
            LEFT JOIN unnest(a.parts) part_value ON true
            LEFT JOIN parts p ON p.value = part_value
            LEFT JOIN messages m ON a.artist_id = m.artist_id
            WHERE a.email IS NOT NULL AND m.artist_id IS NULL
            GROUP BY a.artist_id
            ORDER BY (SELECT p.sort_order FROM parts p WHERE p.value = a.parts[1]) ASC
        `);

        // 結果を結合
        const artists = [...artistsWithMessages.rows, ...artistsWithoutMessages.rows];

        res.json({ success: true, artists });
    } catch (error) {
        console.error('Error fetching artists:', error);
        res.status(500).json({ success: false, message: 'Server error', details: error.message });
    }
});

// 管理者がアーティストのメッセージを既読にするエンドポイント
router.post('/admin/messages/read', async (req, res) => {
    const { messageId } = req.body;
    try {
        const result = await pool.query(
            'SELECT message_type FROM messages WHERE id = $1',
            [messageId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const messageType = result.rows[0].message_type;

        if (messageType === 'artist_message') { // アーティストのメッセージのみ既読にする
            await pool.query(
                'UPDATE messages SET is_read = TRUE WHERE id = $1',
                [messageId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating message read status:', error);
        res.status(500).json({ success: false, message: 'Server error', details: error.message });
    }
});

// アーティストが管理者のメッセージを既読にするエンドポイント
router.post('/artist/messages/read', async (req, res) => {
    const { messageId } = req.body;
    try {
        const result = await pool.query(
            'SELECT message_type FROM messages WHERE id = $1',
            [messageId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const messageType = result.rows[0].message_type;

        if (messageType === 'admin_message') { // 管理者のメッセージのみ既読にする
            await pool.query(
                'UPDATE messages SET is_read = TRUE WHERE id = $1',
                [messageId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating message read status:', error);
        res.status(500).json({ success: false, message: 'Server error', details: error.message });
    }
});

module.exports = router;

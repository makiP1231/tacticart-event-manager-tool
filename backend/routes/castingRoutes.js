const express = require('express');
const router = express.Router();
const pool = require('../db'); // 確実に正しいDB接続を確認
const { v4: uuidv4 } = require('uuid');

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

// 仮押さえ情報とそれに関連するメッセージを保存するエンドポイント
router.post('/casting/hold-casting', async (req, res) => {
    const { eventId, artistIds, dates, compensation, message } = req.body;
    const fee = compensation ? compensation : null;

    try {
        await pool.query('BEGIN'); // トランザクション開始

        const holdCastingId = uuidv4();

        // 仮押さえ情報を保存
        await pool.query(
            `INSERT INTO artist_hold_casting (id, event_uuid, fee, message)
             VALUES ($1, $2, $3, $4)`,
            [holdCastingId, eventId, fee, message]
        );

        // 日程情報を保存
        for (const date of dates) {
            await pool.query(
                `INSERT INTO hold_dates (id, hold_casting_id, hold_date, note)
                 VALUES ($1, $2, $3, $4)`,
                [uuidv4(), holdCastingId, date.date, date.note]
            );
        }

        // アーティストIDと仮押さえIDを関連付ける
        for (const artistId of artistIds) {
            await pool.query(
                `INSERT INTO hold_casting_artists (id, hold_casting_id, artist_id, status)
                 VALUES ($1, $2, $3, 'pending')`,
                [uuidv4(), holdCastingId, artistId]
            );

            // artistsテーブルのlast_message_timeを更新
            await pool.query(
                `UPDATE artists SET last_message_time = NOW() WHERE artist_id = $1`,
                [artistId]
            );

            // メッセージをmessagesテーブルに保存
            const messageId = uuidv4();
            await pool.query(
                `INSERT INTO messages (id, artist_id, message_type, created_at)
                 VALUES ($1, $2, 'admin_message', NOW())`,
                [messageId, artistId]
            );

            // メッセージをadmin_messagesテーブルに保存
            await pool.query(
                `INSERT INTO admin_messages (id, message_id, message_format, hold_casting_id)
                 VALUES ($1, $2, 'announce_hold', $3)`,
                [uuidv4(), messageId, holdCastingId]
            );
        }

        await pool.query('COMMIT'); // トランザクションをコミット
        res.status(201).json({ message: '仮押さえと関連メッセージが正常に送信されました' });
    } catch (error) {
        await pool.query('ROLLBACK'); // トランザクションをロールバック
        console.error('Error submitting hold casting and message:', error);
        res.status(500).json({ message: '仮押さえの送信に失敗しました', error: error.message });
    }
});


// 仮押さえ申請済みのアーティストとそのステータスを取得するエンドポイント
router.get('/events/:eventId/hold-artists-statuses', async (req, res) => {
    const { eventId } = req.params;
    try {
        const result = await pool.query(
            `SELECT artist_id, status FROM hold_casting_artists 
             WHERE hold_casting_id IN (
                 SELECT id FROM artist_hold_casting WHERE event_uuid = $1
             )`,
            [eventId]
        );
        const artistsStatus = result.rows.map(row => ({ artist_id: row.artist_id, status: row.status }));
        res.json(artistsStatus);
    } catch (error) {
        console.error('Error fetching hold artists statuses:', error);
        res.status(500).json({ message: 'Failed to fetch hold artists statuses', error: error.message });
    }
});



module.exports = router;

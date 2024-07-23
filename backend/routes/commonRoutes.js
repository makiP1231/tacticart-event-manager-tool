const express = require('express');
const path = require('path'); // ここでpathをインポート
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env.development') }); // dotenvの設定を次に移動
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const pool = require('../db');
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');

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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// プロフィールデータを取得するエンドポイント
router.get('/admin/profile', authenticateAdmin, async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const result = await pool.query('SELECT username, full_name, position, nickname, email, profile_picture FROM admin_users WHERE id = $1', [req.session.userId]);
        if (result.rows.length > 0) {
            const profileData = result.rows[0];
            if (profileData.profile_picture) {
                profileData.profile_picture_url = `${API_URL}${ADMIN_PROFILE_IMAGE_PATH}/${profileData.profile_picture}`;
            } else {
                profileData.profile_picture_url = null;
            }
            res.json(profileData);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});


// 管理者用ーアーティスト登録
router.post('/register-artist', async (req, res) => {
    const { name, parts } = req.body;  // 'parts' は配列であることを想定
    const artistId = uuidv4();

    try {
        const result = await pool.query(
            'INSERT INTO artists (artist_id, name, parts) VALUES ($1, $2, $3) RETURNING *',
            [artistId, name, parts]  // 'parts' は配列として直接挿入
        );
        console.log('Database insert result:', result.rows[0]);
        res.json({ success: true, artist: result.rows[0] });
    } catch (error) {
        console.error('Artist registration error:', error);
        res.status(500).json({ success: false, message: 'Database error', error });
    }
});


// 管理者用ーアーティスト一覧を取得するエンドポイント
router.get('/admin/artists', async (req, res) => {
    console.log('Received request for /admin/artists');  // デバッグログを追加
    try {
        const results = await pool.query('SELECT * FROM artists');
        res.json({ success: true, artists: results.rows });
    } catch (error) {
        console.error('Error fetching artists:', error.message);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});


// 管理者用ーアーティスト詳細を取得するエンドポイント
router.get('/admin/artists/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM artists WHERE artist_id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ success: false, message: 'Artist not found' });
        }
    } catch (error) {
        console.error('Error fetching artist details:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});

// 管理者用ーアーティスト情報を更新するエンドポイント
router.post('/admin/artists/:id/update', async (req, res) => {
    const { id } = req.params;
    const { name, parts } = req.body;
    try {
        await pool.query(
            'UPDATE artists SET name = $1, parts = $2 WHERE artist_id = $3',
            [name, parts, id]
        );
        res.json({ message: 'アーティスト情報が更新されました' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});

// 管理者用メモを保存するエンドポイント
router.post('/admin/artists/:id/note', async (req, res) => {
    const { id } = req.params;
    const { admin_note } = req.body;
    try {
        const result = await pool.query(
            'UPDATE artists SET admin_note = $1 WHERE artist_id = $2 RETURNING *',
            [admin_note, id]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ success: false, message: 'Artist not found' });
        }
    } catch (error) {
        console.error('Error saving admin note:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});

// 管理者ダッシュボード用アーティスト個人詳細ページ
router.get('/get-artist/:artistId', async (req, res) => {
    const { artistId } = req.params;
    try {
        const result = await pool.query('SELECT name, email FROM artists WHERE artist_id = $1', [artistId]);
        if (result.rows.length > 0) {
            const artist = result.rows[0];
            const isRegistered = !!artist.email; // emailがnullまたはundefinedでなければtrue
            res.json({ success: true, artistName: artist.name, isRegistered });
        } else {
            res.status(404).json({ success: false, message: "Artist not found" });
        }
    } catch (error) {
        console.error('Error retrieving artist:', error);
        res.status(500).json({ success: false, message: 'Database error', error });
    }
});


// グループ一覧を取得するエンドポイント
router.get('/artist-groups', async (req, res) => {
    try {
        const groups = await pool.query('SELECT * FROM artist_groups');
        res.json(groups.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});

// 新しいグループを作成するエンドポイント
router.post('/groups/create', async (req, res) => {
    const { groupName } = req.body;
    try {
        const newGroup = await pool.query(
            'INSERT INTO artist_groups (group_name) VALUES ($1) RETURNING *', 
            [groupName]
        );
        res.json(newGroup.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'サーバーエラーが発生しました', error: err });
    }
});

// グループ名を変更するエンドポイント
router.post('/groups/rename', async (req, res) => {
    const { groupId, newGroupName } = req.body;
    try {
        const result = await pool.query(
            'UPDATE artist_groups SET group_name = $1 WHERE group_id = $2 RETURNING *',
            [newGroupName, groupId]
        );
        console.log('Update result:', result);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'グループが見つかりませんでした' });
        }
    } catch (error) {
        console.error('Error renaming group:', error);
        res.status(500).json({ message: 'グループ名の変更に失敗しました', error: error.message });
    }
});



// グループを削除するエンドポイント
router.delete('/groups/delete/:groupId', async (req, res) => {
    const { groupId } = req.params;
    try {
        // トランザクションを開始
        await pool.query('BEGIN');

        // グループに含まれるアーティストを削除
        await pool.query('DELETE FROM artist_group_relations WHERE group_id = $1', [groupId]);

        // グループ自体を削除
        await pool.query('DELETE FROM artist_groups WHERE group_id = $1', [groupId]);

        // トランザクションをコミット
        await pool.query('COMMIT');

        res.status(200).json({ message: 'グループを削除しました。' });
    } catch (error) {
        // エラーハンドリング
        await pool.query('ROLLBACK');
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'グループの削除に失敗しました。', error: error.message });
    }
});


// グループにアーティストを追加するエンドポイント
router.post('/groups/add-artist', async (req, res) => {
    const { artistId, groupId } = req.body;
    try {
        const newRelation = await pool.query(
            'INSERT INTO artist_group_relations (artist_id, group_id) VALUES ($1, $2) RETURNING *',
            [artistId, groupId]
        );
        res.json(newRelation.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});

// グループにアーティストをまとめて追加するエンドポイント
router.post('/groups/add-multiple-artists', async (req, res) => {
    const { artistIds, groupId } = req.body;
    try {
        await pool.query('BEGIN');
        for (const artistId of artistIds) {
            await pool.query(
                'INSERT INTO artist_group_relations (artist_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [artistId, groupId]
            );
        }
        await pool.query('COMMIT');
        res.status(200).json({ message: 'Artists added to group successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error adding artists to group:', error);
        res.status(500).json({ message: 'Failed to add artists to group', error: error.message });
    }
});




// グループからアーティストを削除するエンドポイント
router.post('/groups/remove-artist', async (req, res) => {
    const { artistId, groupId } = req.body;
    try {
        const result = await pool.query(
            'DELETE FROM artist_group_relations WHERE artist_id = $1 AND group_id = $2 RETURNING *',
            [artistId, groupId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});

// グループからアーティストをまとめて削除するエンドポイント
router.post('/groups/remove-multiple-artists', async (req, res) => {
    const { artistIds, groupId } = req.body;
    try {
        await pool.query('BEGIN');
        for (const artistId of artistIds) {
            await pool.query('DELETE FROM artist_group_relations WHERE artist_id = $1 AND group_id = $2', [artistId, groupId]);
        }
        await pool.query('COMMIT');
        res.status(200).json({ message: 'Artists removed from group successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error removing artists from group:', error);
        res.status(500).json({ message: 'Failed to remove artists from group', error: error.message });
    }
});




// グループに含まれるアーティストを取得するエンドポイント
router.get('/groups/:groupId/artists', async (req, res) => {
    const { groupId } = req.params;
    try {
        const result = await pool.query(
            'SELECT artist_id FROM artist_group_relations WHERE group_id = $1',
            [groupId]
        );
        res.json({ artists: result.rows.map(row => row.artist_id) });
    } catch (err) {
        console.error('Error fetching artists for group:', err.message); // 詳細なエラーログを追加
        res.status(500).json({ message: 'サーバーエラーが発生しました', error: err.message }); // エラーメッセージを含める
    }
});



// パート一覧を取得するエンドポイント
router.get('/parts', async (req, res) => {
    try {
        const parts = await pool.query('SELECT * FROM parts ORDER BY sort_order');
        res.json(parts.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// パートの状況を更新してリストを取得
router.get('/update-and-fetch-parts', async (req, res) => {
    try {
        // パートの使用状況を更新
        await pool.query(`
            WITH usage_stats AS (
                SELECT unnest(parts) AS part, COUNT(*) AS usage_count
                FROM artists
                GROUP BY unnest(parts)
            )
            UPDATE parts
            SET deletable = (usage_stats.usage_count = 0)
            FROM usage_stats
            WHERE parts.value = usage_stats.part;

            UPDATE parts
            SET deletable = true
            WHERE value NOT IN (SELECT unnest(parts) FROM artists);
        `);

        // 更新後のパートリストを取得
        const { rows } = await pool.query(`
            SELECT id, label, value, deletable, sort_order
            FROM parts
            ORDER BY sort_order;
        `);

        // パートリストをレスポンスとして返す
        res.json({ success: true, parts: rows });
    } catch (error) {
        console.error('Error updating and fetching parts:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// パートの削除エンドポイント
router.post('/parts/delete', async (req, res) => {
    const { id } = req.body;
    try {
        const result = await pool.query(
            'DELETE FROM parts WHERE id = $1 AND deletable = TRUE RETURNING *',
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});

// 新しいパートを追加するエンドポイント
router.post('/parts/add', async (req, res) => {
    const { label, value, deletable, sort_order } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO parts (label, value, deletable, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
            [label, value, deletable, sort_order]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});

// パートの順序を入れ替えるエンドポイント
router.post('/parts/reorder', async (req, res) => {
    const { partId, direction } = req.body; // direction: 'up' または 'down'
    try {
        await pool.query('BEGIN');
        const queryResult = await pool.query('SELECT sort_order FROM parts WHERE id = $1', [partId]);
        const sortOrder = queryResult.rows[0].sort_order;
        const newSortOrder = direction === 'up' ? sortOrder - 1 : sortOrder + 1;

        // 順序を交換する
        await pool.query('UPDATE parts SET sort_order = $1 WHERE sort_order = $2', [sortOrder, newSortOrder]);
        await pool.query('UPDATE parts SET sort_order = $2 WHERE id = $1', [partId, newSortOrder]);

        await pool.query('COMMIT');
        res.json({ success: true, message: 'Part order updated successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error reordering parts:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});


// ジャンルを取得するエンドポイント
router.get('/genres', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT g.*, 
                   CASE WHEN e.genre IS NOT NULL THEN true ELSE false END AS is_used
            FROM genres g
            LEFT JOIN events e ON g.value = e.genre
            GROUP BY g.id, e.genre
            ORDER BY g.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ message: 'Failed to fetch genres', error: error.message });
    }
});


// ジャンルを追加するエンドポイント
router.post('/genres', async (req, res) => {
    const { label, value, color } = req.body;
    try {
        await pool.query('INSERT INTO genres (label, value, color) VALUES ($1, $2, $3)', [label, value, color]);
        res.status(201).json({ message: 'Genre added successfully' });
    } catch (error) {
        console.error('Error adding genre:', error);
        res.status(500).json({ message: 'Failed to add genre', error: error.message });
    }
});

// ジャンルを編集するエンドポイント
router.put('/genres/:id', async (req, res) => {
    const { id } = req.params;
    const { label, value, color } = req.body;
    try {
        const result = await pool.query(
            'UPDATE genres SET label = $1, value = $2, color = $3 WHERE id = $4 RETURNING *',
            [label, value, color, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating genre:', error);
        res.status(500).json({ message: 'Failed to update genre', error: error.message });
    }
});
// ジャンルを削除するエンドポイント
router.delete('/genres/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // ジャンルが使用されているか確認
        const genreResult = await pool.query('SELECT value FROM genres WHERE id = $1', [id]);
        if (genreResult.rows.length === 0) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        const genreValue = genreResult.rows[0].value;
        const eventResult = await pool.query('SELECT * FROM events WHERE genre = $1', [genreValue]);
        if (eventResult.rows.length > 0) {
            return res.status(400).json({ message: 'Genre is used in events and cannot be deleted' });
        }

        // ジャンルを削除
        await pool.query('DELETE FROM genres WHERE id = $1', [id]);
        res.status(200).json({ message: 'Genre deleted successfully' });
    } catch (error) {
        console.error('Error deleting genre:', error);
        res.status(500).json({ message: 'Failed to delete genre', error: error.message });
    }
});

// オプション一覧を取得するエンドポイント
router.get('/event-options', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM event_options');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching event options:', error);
        res.status(500).json({ message: 'Failed to fetch event options', error: error.message });
    }
});

// オプションを追加するエンドポイント
router.post('/event-options', async (req, res) => {
    const { option_name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO event_options (option_name) VALUES ($1) RETURNING *',
            [option_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding event option:', error);
        res.status(500).json({ message: 'Failed to add event option', error: error.message });
    }
});

// オプションを削除するエンドポイント
router.delete('/event-options/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM event_options WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length > 0) {
            res.json({ message: 'Event option deleted successfully' });
        } else {
            res.status(404).json({ message: 'Event option not found' });
        }
    } catch (error) {
        console.error('Error deleting event option:', error);
        res.status(500).json({ message: 'Failed to delete event option', error: error.message });
    }
});

module.exports = router;
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


// アーティストサイドバーの通知バッチ用専用エンドポイント
router.get('/artist/offer-count', async (req, res) => {
    const artistId = req.session.artistUserId;
    if (!artistId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
      const result = await pool.query(
        `
        SELECT COUNT(*) AS count FROM (
          SELECT 
            hc.id,
            hc.is_multiple_events,
            MAX(ha.status) AS single_status,
            SUM(CASE WHEN ha.status = 'pending' THEN 1 ELSE 0 END) AS pending_count
          FROM artist_hold_casting hc
          JOIN hold_casting_artists ha ON hc.id = ha.hold_casting_id
          WHERE ha.artist_id = $1
          GROUP BY hc.id, hc.is_multiple_events
          HAVING (
            (hc.is_multiple_events = false AND MAX(ha.status) = 'pending')
            OR (hc.is_multiple_events = true AND SUM(CASE WHEN ha.status = 'pending' THEN 1 ELSE 0 END) > 0)
          )
        ) sub;
        `,
        [artistId]
      );
      const count = result.rows[0].count;
      res.json({ count });
    } catch (error) {
      console.error("Error fetching offer count:", error);
      res.status(500).json({ message: "Failed to fetch offer count", error: error.message });
    }
  });
  

  // 本契約件数取得エンドポイント（アーティスト用）
router.get('/artist/contract-count', async (req, res) => {
    const artistId = req.session.artistUserId;
    if (!artistId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
      const result = await pool.query(
        `
        SELECT COUNT(*) AS count
        FROM contract_artists
        WHERE artist_id = $1 AND status = 'pending'
        `,
        [artistId]
      );
      const count = result.rows[0].count;
      res.json({ count });
    } catch (error) {
      console.error("Error fetching contract count:", error);
      res.status(500).json({ message: "Failed to fetch contract count", error: error.message });
    }
  });
  
  


// アーティストが管理者から発行された登録URLからメールアドレスとパスワードの設定をしログインをするエンドポイント
router.post('/setup-artist/:artistId', async (req, res) => {
    const { artistId } = req.params;
    const { email, password } = req.body;

    // メールアドレスの重複確認
    const existingArtist = await pool.query('SELECT * FROM artists WHERE email = $1', [email]);
    if (existingArtist.rows.length > 0) {
        return res.status(409).json({ success: false, message: "このメールアドレスは既に使用されています。" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'UPDATE artists SET email = $1, password = $2 WHERE artist_id = $3 RETURNING *',
            [email, hashedPassword, artistId]
        );
        req.session.userId = result.rows[0].artist_id;
        req.session.role = 'artist';
        res.json({ success: true, message: "Artist account setup and logged in successfully." });
    } catch (error) {
        console.error('Artist setup and login error:', error);
        res.status(500).json({ success: false, message: 'Database error', error });
    }
});


// アーティストログイン処理
router.post('/artist-login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM artists WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const artist = result.rows[0];
        const isValid = await bcrypt.compare(password, artist.password);
        if (isValid) {
          // アーティストログイン情報をセッションに保存
          req.session.artistUserId = artist.artist_id;
          req.session.artistRole = 'artist';
          req.session.artistPermissions = artist.role; // 権限レベル
  
          res.json({ success: true, message: `Logged in successfully as ${artist.name}`, userType: 'artist' });
        } else {
          res.status(401).json({ success: false, message: "Invalid password" });
        }
      } else {
        res.status(404).json({ success: false, message: "Email not found" });
      }
    } catch (error) {
      console.error('Artist login error:', error);
      res.status(500).json({ success: false, message: "Database error", error });
    }
  });
  
  
  // アーティストログアウト処理
  router.post('/artist-logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Artist logout error:', err);
        res.status(500).json({ success: false, message: "Artist logout failed", error: err });
      } else {
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Artist logged out successfully", redirect: '/artist-login' });
      }
    });
  });


// アーティスト詳細を取得するエンドポイント
router.get('/artists/:id', async (req, res) => {
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

// アーティストプロフィール画像アップロードエンドポイント
router.put('/artists/profile-picture', upload.single('profilePicture'), async (req, res) => {
    // const { userId } = req.session;  // ここを修正
    const userId = req.session.artistUserId;       // 修正後

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filename = `profile_${userId}_${Date.now()}.jpg`;
    const outputPath = path.join(__dirname, '../public/artist_profiles', filename);

    try {
        // 古いプロフィール画像を削除
        const oldImage = await pool.query('SELECT profile_picture FROM artists WHERE artist_id = $1', [userId]);
        if (oldImage.rows[0].profile_picture) {
            const oldImagePath = path.join(__dirname, '../public/artist_profiles', oldImage.rows[0].profile_picture);
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error('Error deleting old profile picture:', err);
                }
            });
        }

        // 新しい画像を保存
        await sharp(req.file.buffer)
            .resize(200, 200)
            .toFile(outputPath);

        // データベースを更新
        await pool.query(
            'UPDATE artists SET profile_picture = $1 WHERE artist_id = $2',
            [filename, userId]
        );

        res.json({ success: true, profilePicture: filename });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// プロフィール画像を削除するエンドポイント
router.delete('/artists/profile-picture', async (req, res) => {
    // if (!req.session.userId) {  // ここを修正
    if (!req.session.artistUserId) {               // 修正後
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // const artistId = req.session.userId;         // ここを修正
    const artistId = req.session.artistUserId;     // 修正後

    try {
        const oldImage = await pool.query('SELECT profile_picture FROM artists WHERE artist_id = $1', [artistId]);
        if (oldImage.rows.length > 0 && oldImage.rows[0].profile_picture) {
            const oldImagePath = path.join(__dirname, '../public/artist_profiles', oldImage.rows[0].profile_picture);
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error('Error deleting old profile picture:', err);
                    return res.status(500).json({ success: false, message: 'Failed to delete old profile picture' });
                }
            });

            await pool.query('UPDATE artists SET profile_picture = NULL WHERE artist_id = $1', [artistId]);

            res.json({ success: true, message: 'Profile picture deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'No profile picture found' });
        }
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// プロフィールを更新するエンドポイント
router.put('/artists/profile', async (req, res) => {
    // if (!req.session.userId) {  // ここを修正
    if (!req.session.artistUserId) {               // 修正後
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // const artistId = req.session.userId;         // ここを修正
    const artistId = req.session.artistUserId;     // 修正後

    const {
        name, parts, email, gender, birth_year, birth_month, birth_day, company_name,
        phone_number, twitter_url, instagram_url, facebook_url,
        hp_url, bio, notes, youtube_url
    } = req.body;

    try {
        // メールアドレスの重複確認
        const emailCheck = await pool.query(
            'SELECT * FROM artists WHERE email = $1 AND artist_id != $2',
            [email, artistId]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ success: false, message: "このメールアドレスは既に使用されています。" });
        }

        await pool.query(
            `UPDATE artists SET 
            name = $1, parts = $2, email = $3, gender = $4, birth_year = $5, birth_month = $6, birth_day = $7,
            company_name = $8, phone_number = $9, twitter_url = $10, instagram_url = $11,
            facebook_url = $12, hp_url = $13, bio = $14, notes = $15, youtube_url = $16
            WHERE artist_id = $17`,
            [
                name,
                parts,
                email,
                gender,
                birth_year,
                birth_month,
                birth_day,
                company_name,
                phone_number,
                twitter_url,
                instagram_url,
                facebook_url,
                hp_url,
                bio,
                notes,
                youtube_url,
                artistId
            ]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});



module.exports = router;
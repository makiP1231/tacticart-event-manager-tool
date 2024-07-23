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

const ADMIN_PROFILE_IMAGE_PATH = process.env.ADMIN_PROFILE_IMAGE_PATH || '/images/admin_profiles';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// セッション情報の確認
router.get('/session', (req, res) => {
    console.log('Session check for user ID:', req.session.userId);
    if (req.session.userId) {
        res.json({ isLoggedIn: true, userId: req.session.userId, role: req.session.role });
    } else {
        res.status(401).json({ isLoggedIn: false });
    }
});

// 管理者アカウント作成エンドポイント
router.post('/admin/setup',  async (req, res) => {
    const { username, password, role } = req.body;
    const full_name = '';
    const position = '';
    const nickname = '';
    const email = '';
    const profile_picture = '';
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO admin_users (username, password, role, full_name, position, nickname, email, profile_picture) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [username, hashedPassword, role, full_name, position, nickname, email, profile_picture]
        );
        res.json({ success: true, admin: result.rows[0] });
    } catch (error) {
        console.error('Admin setup error:', error.message);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});

// 管理者プロフィール画像一時アップロードエンドポイント
router.post('/admin/upload-temp',  upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    res.status(200).json({ filePath: `/images/upload_temp/${req.file.filename}` });
});

// 管理者プロフィール画像アップロードエンドポイント
router.put('/admin/profile-picture', upload.single('profilePicture'), async (req, res) => {
    const { userId } = req.session;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const oldPictureQuery = await pool.query('SELECT profile_picture FROM admin_users WHERE id = $1', [userId]);
    const oldPicture = oldPictureQuery.rows[0].profile_picture;
    const filename = `profile_${userId}_${Date.now()}.jpg`;
    const outputPath = path.join(__dirname, `../public${ADMIN_PROFILE_IMAGE_PATH}`, filename);

    try {
        await sharp(req.file.buffer)
            .resize(200, 200)
            .toFile(outputPath);

        await pool.query(
            'UPDATE admin_users SET profile_picture = $1 WHERE id = $2',
            [filename, userId]
        );

        if (oldPicture) {
            const oldPath = path.join(__dirname, `../public${ADMIN_PROFILE_IMAGE_PATH}`, oldPicture);
            fs.unlink(oldPath, (err) => {
                if (err) {
                    console.error('Failed to delete old profile picture:', err);
                }
            });
        }

        res.json({ success: true, message: 'Profile picture updated', profilePicture: filename });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// 管理者プロフィール更新エンドポイント
router.put('/admin/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { full_name, position, nickname, email } = req.body;

    try {
        const result = await pool.query(
            'UPDATE admin_users SET full_name = $1, position = $2, nickname = $3, email = $4 WHERE id = $5 RETURNING *',
            [full_name, position, nickname, email, req.session.userId]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// 管理者ログイン処理
router.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
                req.session.userId = user.id;
                req.session.role = 'admin';
                res.json({ success: true, message: "Admin logged in successfully" });
            } else {
                res.status(401).json({ success: false, message: "Invalid password" });
            }
        } else {
            res.status(404).json({ success: false, message: "Admin not found" });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: "Database error", error });
    }
});

// 管理者ログアウト処理
router.post('/admin-logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Admin logout error:', err);
            res.status(500).json({ success: false, message: "Admin logout failed", error: err });
        } else {
            res.clearCookie('connect.sid');
            res.json({ success: true, message: "Admin logged out successfully", redirect: '/admin-login' });
        }
    });
});

module.exports = router;

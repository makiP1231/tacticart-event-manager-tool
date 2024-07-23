const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env.development') });
const multer = require('multer');
const router = express.Router();
const pool = require('../db');
const sharp = require('sharp');
const fs = require('fs');
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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function processImage(file, folder) {
    const filename = uuidv4() + path.extname(file.originalname); // ファイル名にUUIDを使用
    const outputPath = path.join(__dirname, '..', 'public', folder, filename); // 正しいパスを設定

    const { width, height } = await sharp(file.buffer).metadata();

    const isLandscape = width > height;
    const resizeOptions = isLandscape ? { width: 800 } : { height: 800 };

    // 画像のリサイズと保存
    await sharp(file.buffer)
        .resize(resizeOptions) // 長辺を800pxにリサイズ
        .toFile(outputPath);

    return filename;
}

router.post('/events', upload.fields([{ name: 'flyerFront' }, { name: 'flyerBack' }]), async (req, res) => {
    let {
        name, genre, event_date, open_time, start_time, organizer, operator,
        performance_type, venue, use_existing_flyers, original_event_uuid, performance_flag,
        additionalDates, program, selectedOptions, casts, event_overview, ticket_info
    } = req.body;

    event_date = event_date || null;
    open_time = open_time || null;
    start_time = start_time || null;
    original_event_uuid = original_event_uuid || null;

    try {
        selectedOptions = selectedOptions ? JSON.parse(selectedOptions) : null;
    } catch (e) {
        console.error('Failed to parse selectedOptions:', e);
        return res.status(400).json({ message: 'Invalid selected options format.' });
    }

    const eventUUID = uuidv4();
    try {
        const flyerFrontPath = req.files['flyerFront'] && !use_existing_flyers
            ? await processImage(req.files['flyerFront'][0], 'flyers')
            : null;
        const flyerBackPath = req.files['flyerBack'] && !use_existing_flyers
            ? await processImage(req.files['flyerBack'][0], 'flyers')
            : null;

        const newEvent = await pool.query(
            'INSERT INTO events (event_uuid, name, genre, event_date, open_time, start_time, organizer, operator, performance_type, venue, flyer_front_url, flyer_back_url, original_event_uuid, use_existing_flyers, performance_flag, program, selected_options, event_overview, ticket_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *',
            [eventUUID, name, genre, event_date, open_time, start_time, organizer, operator, performance_type, venue, flyerFrontPath, flyerBackPath, original_event_uuid, use_existing_flyers, performance_flag, program, JSON.stringify(selectedOptions), event_overview, ticket_info]
        );

        if (additionalDates) {
            const parsedAdditionalDates = JSON.parse(additionalDates);
            for (const { date, description, additional_date_title } of parsedAdditionalDates) {
                await pool.query(
                    'INSERT INTO events_other_date (event_uuid, additional_date, description, additional_date_title) VALUES ($1, $2, $3, $4)',
                    [eventUUID, date, description, additional_date_title]
                );
            }
        }

        if (casts) {
            const parsedCasts = JSON.parse(casts);
            for (const { role, name } of parsedCasts) {
                await pool.query(
                    'INSERT INTO event_casts (event_uuid, cast_role, cast_name) VALUES ($1, $2, $3)',
                    [eventUUID, role, name]
                );
            }
        }

        res.json(newEvent.rows[0]);
    } catch (err) {
        console.error('Failed to create event:', err);
        res.status(500).json({ message: 'Server error', details: err.message });
    }
});



router.get('/event-options', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM event_options ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Failed to fetch event options:', err);
        res.status(500).json({ message: 'Server error', details: err.message });
    }
});



// イベントの詳細を追加する
router.post('/details', async (req, res) => {
    const { event_id } = req.body;  // リクエストからイベントIDを取得

    try {
        const result = await pool.query(
            'INSERT INTO event_details (event_id) VALUES ($1) RETURNING *',
            [event_id]  // イベントIDをevent_detailsテーブルに挿入
        );
        res.status(201).json({ success: true, detail: result.rows[0] });
    } catch (error) {
        console.error('Error adding event detail:', error.message);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});

// 登録されたイベントの一覧を取得
router.get('/events', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM events');
        res.json({ events: results.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// 登録されたイベントの一覧を取得
router.get('/events/upcoming', async (req, res) => {
    try {
        const results = await pool.query(
            'SELECT * FROM events WHERE event_date >= CURRENT_DATE OR event_date IS NULL ORDER BY event_date IS NULL, event_date'
        );
        res.json({ events: results.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/events/past', async (req, res) => {
    try {
        const results = await pool.query(
            'SELECT * FROM events WHERE event_date < CURRENT_DATE ORDER BY event_date DESC'
        );
        res.json({ events: results.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// イベント登録ページ用の初回イベントの情報を取得
router.get('/events/first-upcoming', async (req, res) => {
    try {
        const results = await pool.query(
            'SELECT * FROM events WHERE (event_date >= CURRENT_DATE OR event_date IS NULL) AND performance_flag = $1 ORDER BY event_date IS NULL, event_date',
            ['first']  // 'first'は初回公演を意味するフラグです
        );
        res.json({ events: results.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// イベントの詳細情報を取得するエンドポイント
router.get('/events/:eventUuid', async (req, res) => {
    const { eventUuid } = req.params;
    try {
        const eventResult = await pool.query(
            'SELECT * FROM events WHERE event_uuid = $1',
            [eventUuid]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const event = eventResult.rows[0];

        const additionalDatesResult = await pool.query(
            'SELECT * FROM events_other_date WHERE event_uuid = $1',
            [eventUuid]
        );

        const castsResult = await pool.query(
            'SELECT * FROM event_casts WHERE event_uuid = $1',
            [eventUuid]
        );

        event.additional_dates = additionalDatesResult.rows;
        event.casts = castsResult.rows;

        res.json({ event });
    } catch (error) {
        console.error('Error retrieving event details:', error.message);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
});


// イベントの更新エンドポイント
router.put('/events/:eventId', upload.none(), async (req, res) => {
    const { eventId } = req.params;
    const {
        name, genre, event_date, open_time, start_time, organizer, operator,
        performance_type, venue, performance_flag, program, selectedOptions, event_overview, ticket_info,
        additionalDates, casts, use_existing_flyers
    } = req.body;

    // 空の日付データをnullに変換
    const validEventDate = event_date || null;
    const validOpenTime = open_time || null;
    const validStartTime = start_time || null;

    let selectedOptionsParsed = null;
    try {
        selectedOptionsParsed = selectedOptions ? JSON.parse(selectedOptions) : null;
    } catch (e) {
        console.error('Failed to parse selectedOptions:', e);
        return res.status(400).json({ message: 'Invalid selected options format.' });
    }

    try {
        const updatedEvent = await pool.query(
            `UPDATE events 
             SET name = $1, genre = $2, event_date = $3, open_time = $4, start_time = $5, 
                 organizer = $6, operator = $7, performance_type = $8, venue = $9, 
                 performance_flag = $10, program = $11, selected_options = $12, 
                 event_overview = $13, ticket_info = $14, use_existing_flyers = $15
             WHERE event_uuid = $16 RETURNING *`,
            [name, genre, validEventDate, validOpenTime, validStartTime, organizer, operator, performance_type, venue, performance_flag, program, JSON.stringify(selectedOptionsParsed), event_overview, ticket_info, use_existing_flyers, eventId]
        );

        // 追加日程の更新
        await pool.query('DELETE FROM events_other_date WHERE event_uuid = $1', [eventId]);
        if (additionalDates) {
            const parsedAdditionalDates = JSON.parse(additionalDates);
            for (const { additional_date, description, additional_date_title } of parsedAdditionalDates) {
                await pool.query(
                    'INSERT INTO events_other_date (event_uuid, additional_date, description, additional_date_title) VALUES ($1, $2, $3, $4)',
                    [eventId, additional_date || null, description, additional_date_title]
                );
            }
        }

        // 出演者情報の更新
        await pool.query('DELETE FROM event_casts WHERE event_uuid = $1', [eventId]);
        if (casts) {
            const parsedCasts = JSON.parse(casts);
            for (const { cast_role, cast_name } of parsedCasts) {
                await pool.query(
                    'INSERT INTO event_casts (event_uuid, cast_role, cast_name) VALUES ($1, $2, $3)',
                    [eventId, cast_role, cast_name]
                );
            }
        }

        // 名前が変更された場合、関連イベントの名前も変更
        if (performance_flag === 'first') {
            await pool.query(
                'UPDATE events SET name = $1 WHERE original_event_uuid = $2',
                [name, eventId]
            );
        }

        res.json({ success: true, event: updatedEvent.rows[0] });
    } catch (err) {
        console.error('Error updating event:', err.message);
        res.status(500).json({ message: 'Server error', details: err.message });
    }
});



// フライヤーを削除するエンドポイント
router.post('/events/:eventId/delete-flyer', async (req, res) => {
    const { eventId } = req.params;
    const { flyerType } = req.body;
    const column = flyerType === 'flyerFront' ? 'flyer_front_url' : 'flyer_back_url';

    try {
        const result = await pool.query(
            `SELECT ${column} FROM events WHERE event_uuid = $1`,
            [eventId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const flyerPath = result.rows[0][column];
        if (flyerPath) {
            const filePath = path.join(__dirname, '../public/flyers', flyerPath);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting flyer file:', err);
                    return res.status(500).json({ message: 'Failed to delete flyer file' });
                }
            });
        }

        await pool.query(
            `UPDATE events SET ${column} = NULL WHERE event_uuid = $1`,
            [eventId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting flyer:', error.message);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// フライヤーを更新するエンドポイント
router.post('/events/:eventId/update-flyer', upload.fields([{ name: 'flyerFront' }, { name: 'flyerBack' }]), async (req, res) => {
    const { eventId } = req.params;
    const flyerFrontFile = req.files['flyerFront'] ? req.files['flyerFront'][0] : null;
    const flyerBackFile = req.files['flyerBack'] ? req.files['flyerBack'][0] : null;
  
    try {
      let flyerFrontPath = null;
      let flyerBackPath = null;
  
      if (flyerFrontFile) {
        flyerFrontPath = await processImage(flyerFrontFile, 'flyers');
        await pool.query(
          'UPDATE events SET flyer_front_url = $1 WHERE event_uuid = $2',
          [flyerFrontPath, eventId]
        );
      }
  
      if (flyerBackFile) {
        flyerBackPath = await processImage(flyerBackFile, 'flyers');
        await pool.query(
          'UPDATE events SET flyer_back_url = $1 WHERE event_uuid = $2',
          [flyerBackPath, eventId]
        );
      }
  
      res.json({ success: true, flyerUrl: flyerFrontPath || flyerBackPath });
    } catch (err) {
      console.error('Error updating flyer:', err.message);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  });


// イベントの削除エンドポイント
router.delete('/events/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        // イベントのフライヤー情報を取得
        const flyerResult = await pool.query('SELECT flyer_front_url, flyer_back_url FROM events WHERE event_uuid = $1', [eventId]);
        if (flyerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const { flyer_front_url, flyer_back_url } = flyerResult.rows[0];

        // フライヤー画像の削除
        const deleteFlyer = (flyerPath) => {
            if (flyerPath) {
                const filePath = path.join(__dirname, '../public/flyers', flyerPath);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting flyer file:', err);
                    }
                });
            }
        };

        deleteFlyer(flyer_front_url);
        deleteFlyer(flyer_back_url);

        // キャスティング情報の削除
        await pool.query('DELETE FROM casting_info WHERE event_id = $1', [eventId]);
        // 出演者情報の削除
        await pool.query('DELETE FROM event_casts WHERE event_uuid = $1', [eventId]);
        // 追加日程の削除
        await pool.query('DELETE FROM events_other_date WHERE event_uuid = $1', [eventId]);

        // イベントの削除
        const result = await pool.query('DELETE FROM events WHERE event_uuid = $1 RETURNING *', [eventId]);
        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Event and associated information deleted successfully' });
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error deleting event:', error.message);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});



// キャスティング情報とイベント名を取得して表示
router.get('/events/:eventId/castings', async (req, res) => {
    const { eventId } = req.params;
    try {
        const eventInfo = await pool.query(
            'SELECT name FROM events WHERE event_uuid = $1',
            [eventId]
        );
        const result = await pool.query(
            'SELECT * FROM event_casting_info WHERE event_uuid = $1 ORDER BY sort_order',
            [eventId]
        );
        res.json({ event: eventInfo.rows[0].name, castings: result.rows });
    } catch (error) {
        console.error('Error fetching castings and event info:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// キャスティング情報を更新（新規追加および順序の変更を含む）
router.post('/events/:eventId/castings/update', async (req, res) => {
    const { eventId } = req.params;
    const castings = req.body;

    try {
        await pool.query('BEGIN'); // トランザクションを開始
        await pool.query('DELETE FROM event_casting_info WHERE event_uuid = $1', [eventId]); // 既存のデータを削除

        for (const [index, casting] of castings.entries()) {
            await pool.query(
                'INSERT INTO event_casting_info (event_uuid, part, number, memo, sort_order) VALUES ($1, $2, $3, $4, $5)',
                [eventId, casting.part, casting.number, casting.memo, index + 1] // 順序を配列のインデックスに基づいて保存
            );
        }

        await pool.query('COMMIT'); // コミット
        res.json({ message: 'Castings updated successfully' });
    } catch (error) {
        await pool.query('ROLLBACK'); // ロールバック
        console.error('Error updating castings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// イベントの追加日程を取得するエンドポイント
router.get('/events/:eventUuid/additional-dates', async (req, res) => {
    const { eventUuid } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM events_other_date WHERE event_uuid = $1',
            [eventUuid]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching additional dates:', error.message);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});











module.exports = router;

// routes/castingRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

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

// 仮押さえオファーの回答無しで期限が切れたもののステータスを期限切れに更新
cron.schedule('0 0 * * *', async () => {
  console.log('Running cron job to update expired hold casting statuses');
  try {
    // pendingなオファーのうち、response_deadline が過ぎたものを expired に更新するクエリ
    const updateResult = await pool.query(`
      UPDATE hold_casting_artists
      SET status = 'expired'
      WHERE status = 'pending'
        AND hold_casting_id IN (
          SELECT id FROM artist_hold_casting
          WHERE response_deadline IS NOT NULL
            AND response_deadline < NOW()
        );
    `);
    console.log(`Expired statuses updated: ${updateResult.rowCount} records`);
  } catch (error) {
    console.error('Error updating expired statuses:', error);
  }
});



// 仮押さえ情報とそれに関連するメッセージを保存するエンドポイント
router.post('/casting/hold-casting', async (req, res) => {
  // 新しく追加する回答期限（responseDeadline）を受け取る
  const {
    artistIds,
    artistFees,
    artistMessages,
    events,
    message,
    subject,
    isAllEventsRequired,
    responseDeadline  // ← ここを追加
  } = req.body;

  const isMultipleEvents = events.length > 1;

  try {
    await pool.query('BEGIN'); // トランザクション開始

    const holdCastingId = uuidv4();
    const baseEventUuid = events[0].eventId; // 最初のイベントID

    // 仮押さえ情報を保存（response_deadlineカラムを追加）
    await pool.query(
      `INSERT INTO artist_hold_casting
        (id, subject, message, is_multiple_events, is_all_events_required, base_event_uuid, response_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        holdCastingId,
        subject,
        message,
        isMultipleEvents,
        isAllEventsRequired,
        baseEventUuid,
        responseDeadline // ここに格納
      ]
    );

    // メッセージを一括で送信（日本時間に変換）
    for (const artistId of artistIds) {
      const messageId = uuidv4(); // 各アーティストごとにユニークなIDを生成
      await pool.query(
        `INSERT INTO messages (id, artist_id, message_type, created_at)
         VALUES ($1, $2, 'admin_message', NOW() AT TIME ZONE 'Asia/Tokyo')`,
        [messageId, artistId]
      );

      // メッセージをadmin_messagesテーブルに保存
      await pool.query(
        `INSERT INTO admin_messages (id, message_id, message_format, hold_casting_id)
         VALUES ($1, $2, 'announce_hold', $3)`,
        [uuidv4(), messageId, holdCastingId]
      );
    }

    // イベントとアーティストの関連付け
    for (const event of events) {
      const { eventId, dates } = event;

      // hold_dates へのINSERT（日本時間に変換しなくても、ここは日付のみ）
      for (const date of dates) {
        await pool.query(
          `INSERT INTO hold_dates (id, hold_casting_id, hold_date, note, event_uuid)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), holdCastingId, date.date, date.note, eventId]
        );
      }

      // hold_casting_artists へのINSERT（created_atをJSTで登録）
      for (const artistId of artistIds) {
        await pool.query(
          `INSERT INTO hold_casting_artists (id, hold_casting_id, artist_id, status, event_uuid, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW() AT TIME ZONE 'Asia/Tokyo')`,
          [uuidv4(), holdCastingId, artistId, 'pending', eventId]
        );
      }
    }

    // アーティストの報酬情報と個別メッセージを保存（重複排除）
    const savedArtistIds = new Set();
    for (const artistId of artistIds) {
      if (!savedArtistIds.has(artistId)) {
        await pool.query(
          `INSERT INTO artist_hold_details (id, hold_casting_id, artist_id, fee, individual_message)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), holdCastingId, artistId, artistFees[artistId] || 0, artistMessages[artistId] || '']
        );
        savedArtistIds.add(artistId);
      }
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
             WHERE event_uuid = $1`,
            [eventId]
        );
        const artistsStatus = result.rows.map(row => ({ artist_id: row.artist_id, status: row.status }));
        res.json(artistsStatus);
    } catch (error) {
        console.error('Error fetching hold artists statuses:', error);
        res.status(500).json({ message: 'Failed to fetch hold artists statuses', error: error.message });
    }
});


// 未開催の仮押さえ履歴を取得するAPI (e.event_date >= CURRENT_DATE)
router.get('/admin/hold-requests/upcoming', async (req, res) => {
  try {
    const query = `
      SELECT
        hca.id AS hold_casting_artist_id,
        hc.id AS hold_casting_id,
        e.event_uuid,
        e.name AS event_name,
        e.performance_type,
        a.name AS artist_name,
        a.parts,
        hca.status,
        hc.created_at,
        hc.response_deadline  
      FROM hold_casting_artists hca
      JOIN events e ON hca.event_uuid = e.event_uuid
      JOIN artists a ON hca.artist_id = a.artist_id
      JOIN artist_hold_casting hc ON hca.hold_casting_id = hc.id
      WHERE e.event_date >= CURRENT_DATE
      ORDER BY hc.created_at DESC
    `;
    const result = await pool.query(query);
    return res.json({ success: true, holdRequests: result.rows });
  } catch (error) {
    console.error('Error fetching upcoming hold requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming hold requests',
      error: error.message,
    });
  }
});

  
// 期間指定で仮押さえ履歴を取得するAPI
router.get('/admin/hold-requests/period', async (req, res) => {
    try {
        const { start_date, end_date, eventId } = req.query;
        console.log('[DEBUG] /admin/hold-requests/period', { start_date, end_date, eventId });

        if (!start_date && !end_date) {
            return res.status(400).json({
                success: false,
                message: 'At least one of start_date or end_date is required',
            });
        }

        // JSTからUTCに変換する関数
        const parseLocalDate = (ymdString, isEnd) => {
            const timePart = isEnd ? 'T23:59:59.999+09:00' : 'T00:00:00.000+09:00';
            const dateInJST = new Date(ymdString + timePart);
            const utcTime = dateInJST.getTime() - (9 * 60 * 60 * 1000);
            return new Date(utcTime).toISOString();
        };

        let query = `
            SELECT 
                hca.id AS hold_casting_artist_id,
                hc.id AS hold_casting_id,
                e.event_uuid,
                e.name AS event_name,
                e.performance_type,
                a.name AS artist_name,
                a.parts,
                hca.status,
                hc.created_at,
                hc.response_deadline
            FROM hold_casting_artists hca
            JOIN events e ON hca.event_uuid = e.event_uuid
            JOIN artists a ON hca.artist_id = a.artist_id
            JOIN artist_hold_casting hc ON hca.hold_casting_id = hc.id
        `;

        let params = [];
        let conditions = [];

        if (start_date) {
            conditions.push(`hc.created_at >= $${params.length + 1}`);
            params.push(parseLocalDate(start_date, false));
        }

        if (end_date) {
            conditions.push(`hc.created_at <= $${params.length + 1}`);
            params.push(parseLocalDate(end_date, true));
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += ` ORDER BY hc.created_at DESC LIMIT 1000;`;

        console.log('[DEBUG] Final Query:', query, params);

        const result = await pool.query(query, params);
        
        res.json({ success: true, holdRequests: result.rows });
    } catch (error) {
        console.error('Error fetching hold requests by period:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hold requests by period',
            error: error.message,
        });
    }
});



router.get('/admin/event-list', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT event_uuid, name 
            FROM events 
            WHERE event_date >= CURRENT_DATE
            ORDER BY name ASC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching event list:', error);
        res.status(500).json({ message: 'Failed to fetch event list' });
    }
});


// 仮押さえオファーの詳細情報を取得するエンドポイント
router.get('/admin/hold-casting-detail/:holdCastingArtistId', async (req, res) => {
  const { holdCastingArtistId } = req.params;
  
  try {
      const result = await pool.query(
          `SELECT 
              hc.subject, 
              hc.message, 
              ahd.individual_message, 
              ahd.fee, 
              hc.created_at, 
              hc.response_deadline,  -- 追加: 募集期限
              e.name AS event_name, 
              e.performance_type, 
              a.name AS artist_name, 
              a.artist_id, 
              hca.status,
              JSON_AGG(json_build_object('hold_date', hd.hold_date, 'note', hd.note)) AS event_dates
           FROM hold_casting_artists hca
           JOIN artist_hold_casting hc ON hc.id = hca.hold_casting_id
           JOIN hold_dates hd ON hc.id = hd.hold_casting_id AND hca.event_uuid = hd.event_uuid  
           JOIN events e ON e.event_uuid = hd.event_uuid
           JOIN artists a ON a.artist_id = hca.artist_id  
           JOIN artist_hold_details ahd ON hc.id = ahd.hold_casting_id AND a.artist_id = ahd.artist_id
           WHERE hca.id = $1
           GROUP BY 
              hc.id, 
              hc.response_deadline,  -- 追加: GROUP BYに追加
              e.name, 
              e.performance_type, 
              a.name, 
              a.artist_id, 
              hca.status, 
              ahd.individual_message, 
              ahd.fee`,
          [holdCastingArtistId]
      );
      
      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Hold casting not found' });
      }
      
      res.json(result.rows[0]);
  } catch (error) {
      console.error('Error fetching hold casting details:', error);
      res.status(500).json({ message: 'Failed to fetch hold casting details', error: error.message });
  }
});



router.post('/admin/cancel-hold-casting', async (req, res) => {
    const { holdCastingId, artistId } = req.body;  // holdCastingId と artistId をリクエストボディから取得

    try {
        // まず、hold_casting_artists テーブルから hold_casting_id を取得する
        const holdCastingArtistResult = await pool.query(
            `SELECT hold_casting_id 
             FROM hold_casting_artists 
             WHERE id = $1 AND artist_id = $2`,  // artist_id でフィルタリングを追加
            [holdCastingId, artistId]  // artistId を追加して特定のアーティストに限定
        );

        if (holdCastingArtistResult.rows.length === 0) {
            return res.status(404).json({ message: '指定された仮押さえが見つかりませんでした' });
        }

        const { hold_casting_id } = holdCastingArtistResult.rows[0];

        // artist_hold_casting テーブルから is_multiple_events, is_all_events_required を取得
        const holdCastingResult = await pool.query(
            `SELECT is_multiple_events, is_all_events_required 
             FROM artist_hold_casting 
             WHERE id = $1`,
            [hold_casting_id]
        );

        if (holdCastingResult.rows.length === 0) {
            return res.status(404).json({ message: 'artist_hold_casting のデータが見つかりませんでした' });
        }

        const { is_multiple_events, is_all_events_required } = holdCastingResult.rows[0];

        // 複数イベントかつすべてのイベントが必要な場合
        if (is_multiple_events && is_all_events_required) {
            // 特定のアーティストのすべてのイベントに対する hold_casting_artists レコードをキャンセル
            await pool.query(
                `UPDATE hold_casting_artists
                 SET status = 'cancelled'
                 WHERE hold_casting_id = $1 AND artist_id = $2`,  // artist_id に基づいて特定のアーティストを絞る
                [hold_casting_id, artistId]  // artistId を追加
            );
        } else {
            // 特定の hold_casting_artists レコードのみキャンセル
            await pool.query(
                `UPDATE hold_casting_artists
                 SET status = 'cancelled'
                 WHERE id = $1 AND artist_id = $2`,  // artist_id でフィルタリングを追加
                [holdCastingId, artistId]  // artistId を追加
            );
        }

        res.status(200).json({ message: '仮押さえ申請がキャンセルされました' });
    } catch (error) {
        console.error('仮押さえキャンセル処理でエラーが発生しました:', error);
        res.status(500).json({ message: 'キャンセル処理中にエラーが発生しました', error: error.message });
    }
});





router.get('/admin/contract-details/:requestId', async (req, res) => {
    const { requestId } = req.params;
    try {
        const result = await pool.query(`
            SELECT a.name AS artistName, e.name AS eventName, ahd.fee, ahd.individual_message AS message
            FROM artist_hold_casting hc
            JOIN artist_hold_details ahd ON hc.id = ahd.hold_casting_id
            JOIN artists a ON ahd.artist_id = a.id
            JOIN events e ON hc.base_event_uuid = e.event_uuid
            WHERE hc.id = $1
        `, [requestId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching contract details:', error);
        res.status(500).json({ message: 'Failed to fetch contract details' });
    }
});

// approved のアーティストとその報酬情報を取得するAPI
router.get('/admin/approved-artists/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
      const query = `
        SELECT DISTINCT ON (a.artist_id)
          a.artist_id, 
          a.name, 
          a.parts,
          hca.id AS "holdCastingArtistId",
          COALESCE(ahd.fee, 0) AS fee
        FROM hold_casting_artists hca
        JOIN artists a ON hca.artist_id = a.artist_id
        LEFT JOIN artist_hold_details ahd 
          ON hca.hold_casting_id = ahd.hold_casting_id 
         AND a.artist_id = ahd.artist_id
        WHERE hca.event_uuid = $1
          AND hca.status = 'approved'
        ORDER BY a.artist_id, hca.created_at DESC
      `;
      const result = await pool.query(query, [eventId]);
      res.json({ success: true, artists: result.rows });
    } catch (error) {
      console.error('Error fetching approved artists for event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approved artists',
        error: error.message
      });
    }
  });
  
  
  


// 本契約フォームから契約を送信するエンドポイント
router.post('/admin/submit-contract', async (req, res) => {
  const { event_uuid, additionalInfo, selectedArtists } = req.body;

  try {
    await pool.query('BEGIN'); // トランザクション開始

    // 1️⃣ 本契約情報を `contracts` に登録 (contractsテーブルに created_at, updated_at は不要)
    const contractId = uuidv4();
    await pool.query(
      `
      INSERT INTO contracts
        (contract_id, event_uuid, venue, transfer_info, cancel_policy, remarks, contact_person, contact, additional_usage_clause, rehearsal_venue)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        contractId,
        event_uuid,
        additionalInfo.venue,
        additionalInfo.transfer_info,
        additionalInfo.cancel_policy,
        additionalInfo.remarks || '',
        additionalInfo.contact_person || '',
        additionalInfo.contact || '',
        additionalInfo.additional_usage_clause || '',
        additionalInfo.rehearsal_venue || '',
      ]
    );

    // 2️⃣ 各アーティストごとの契約を `contract_artists` に登録 (ここだけ created_at, updated_at を使う)
    for (const artist of selectedArtists) {
      const artistContractId = uuidv4();
      await pool.query(
        `
        INSERT INTO contract_artists
          (id, contract_id, artist_id, fee, hold_casting_artist_id, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
        [
          artistContractId,
          contractId,
          artist.artist_id,
          artist.fee,
          artist.holdCastingArtistId || null,
        ]
      );

      // 3️⃣ 仮押さえステータスを更新（承認済みの場合のみ）
      if (artist.holdCastingArtistId) {
        await pool.query(
          `
          UPDATE hold_casting_artists
          SET status = 'contract_sent'
          WHERE id = $1
          `,
          [artist.holdCastingArtistId]
        );
      }
    }

    // 4️⃣ スケジュール情報を `contract_schedule` に登録 (ここも created_at, updated_at は不要)
    for (const schedule of additionalInfo.schedule) {
      const scheduleId = uuidv4();
      await pool.query(
        `
        INSERT INTO contract_schedule
          (id, contract_id, schedule_date, note, start_time, end_time)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        `,
        [
          scheduleId,
          contractId,
          schedule.date,
          schedule.note,
          schedule.startTime,
          schedule.endTime,
        ]
      );
    }

    await pool.query('COMMIT'); // トランザクションをコミット
    res.status(201).json({ success: true, message: '本契約が正常に送信されました。' });
  } catch (error) {
    await pool.query('ROLLBACK'); // 失敗時はロールバック
    console.error('Error submitting contract:', error);
    res.status(500).json({ success: false, message: '本契約の送信に失敗しました。', error: error.message });
  }
});

  

/**
 * 本契約履歴を取得するAPI
 * 未開催のイベント（＝e.event_date >= CURRENT_DATE）に紐づく contract_artists レコードを返す
 */
router.get('/admin/contracts/upcoming', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          ca.id AS contract_artist_id,       -- contract_artistsテーブルのID (一意)
          ca.contract_id,                    -- 同一contractsをまとめるID
          ca.artist_id,
          a.name AS artist_name,
          a.parts,
          COALESCE(ca.status, 'unknown') AS status,
          ca.updated_at AS sent_at,         -- updated_atを履歴時刻として扱う
          c.event_uuid,
          e.name AS event_name,
          e.performance_type
        FROM contract_artists ca
        JOIN contracts c ON ca.contract_id = c.contract_id
        JOIN events e ON c.event_uuid = e.event_uuid
        LEFT JOIN artists a ON ca.artist_id = a.artist_id
        WHERE e.event_date >= CURRENT_DATE
        ORDER BY ca.updated_at DESC;
      `);
  
      res.json({ success: true, contracts: result.rows });
    } catch (error) {
      console.error('Error fetching upcoming contract history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming contract history',
        error: error.message
      });
    }
  });
  
  /**
   * 期間指定（start_date ～ end_date）の契約履歴を取得するAPI
   * max 1000件まで。
   */
  router.get('/admin/contracts/period', async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
  
      if (!start_date && !end_date) {
        return res.status(400).json({
          success: false,
          message: 'At least one of start_date or end_date is required'
        });
      }
  
      // JSTからUTCに変換する関数
      const parseLocalDate = (ymdString, isEnd) => {
        const timePart = isEnd ? 'T23:59:59.999+09:00' : 'T00:00:00.000+09:00';
        const dateInJST = new Date(ymdString + timePart);
        // JST→UTCへミリ秒換算して調整
        const utcTime = dateInJST.getTime() - (9 * 60 * 60 * 1000);
        return new Date(utcTime).toISOString();
      };
  
      let query = `
        SELECT
          ca.id AS contract_artist_id,
          ca.contract_id,
          ca.artist_id,
          a.name AS artist_name,
          a.parts,
          COALESCE(ca.status, 'unknown') AS status,
          ca.updated_at AS sent_at,  -- updated_atを履歴時刻として扱う
          c.event_uuid,
          e.name AS event_name,
          e.performance_type
        FROM contract_artists ca
        JOIN contracts c ON ca.contract_id = c.contract_id
        JOIN events e ON c.event_uuid = e.event_uuid
        LEFT JOIN artists a ON ca.artist_id = a.artist_id
      `;
  
      let params = [];
      let conditions = [];
  
      // start_date があれば
      if (start_date) {
        conditions.push(`ca.updated_at >= $${params.length + 1}`);
        params.push(parseLocalDate(start_date, false));
      }
      // end_date があれば
      if (end_date) {
        conditions.push(`ca.updated_at <= $${params.length + 1}`);
        params.push(parseLocalDate(end_date, true));
      }
  
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
  
      query += ' ORDER BY ca.updated_at DESC LIMIT 1000;';
  
      console.log('[DEBUG] Final Query:', query, params);
  
      const result = await pool.query(query, params);
  
      res.json({ success: true, contracts: result.rows });
    } catch (error) {
      console.error('Error fetching contract history by period:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contract history by period',
        error: error.message
      });
    }
  });
  
// 本契約詳細を取得するエンドポイント
router.get('/admin/contract-detail/:contractArtistId', async (req, res) => {
  const { contractArtistId } = req.params;

  try {
    // 1) contract_artists から該当の契約アーティスト情報を取得
    const contractArtistResult = await pool.query(`
      SELECT 
        ca.id AS contract_artist_id,
        ca.contract_id,
        ca.artist_id,
        ca.fee,
        ca.status,
        a.name AS artist_name,
        a.parts AS artist_parts,  -- パートのJSON文字列 or 配列
        a.email,
        a.phone_number AS phone
      FROM contract_artists ca
      JOIN artists a ON ca.artist_id = a.artist_id
      WHERE ca.id = $1
    `, [contractArtistId]);

    if (contractArtistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contract artist not found.' });
    }
    const contractArtist = contractArtistResult.rows[0];

    // 2) contracts と events を JOIN して、本契約＆イベント情報を取得
    const contractResult = await pool.query(`
      SELECT 
        c.contract_id,
        c.event_uuid,
        c.venue,
        c.transfer_info,
        c.cancel_policy,
        c.remarks,
        c.contact_person,
        c.contact,
        c.additional_usage_clause,
        c.rehearsal_venue,
        e.name AS event_name,
        e.event_date,
        e.venue AS event_venue,
        e.open_time,
        e.start_time,
        e.selected_options,
        e.performance_type
      FROM contracts c
      JOIN events e ON c.event_uuid = e.event_uuid
      WHERE c.contract_id = $1
    `, [contractArtist.contract_id]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }
    const contract = contractResult.rows[0];

    // イベントのオプションをパース
    let parsedOptions = [];
    if (contract.selected_options) {
      try {
        if (typeof contract.selected_options === 'string') {
          parsedOptions = JSON.parse(contract.selected_options);
        } else if (Array.isArray(contract.selected_options)) {
          parsedOptions = contract.selected_options;
        }
      } catch (e) {
        console.error('Error parsing selected_options:', e);
      }
    }

    // 3) contract_schedule からスケジュール一覧を取得
    const scheduleResult = await pool.query(`
      SELECT 
        id,
        schedule_date,
        note,
        start_time,
        end_time
      FROM contract_schedule
      WHERE contract_id = $1
      ORDER BY schedule_date ASC
    `, [contractArtist.contract_id]);
    const schedules = scheduleResult.rows;

    // 4) 同じ event_uuid を持つその他の契約アーティスト一覧を取得
    const otherArtistsResult = await pool.query(`
      SELECT 
        ca.id AS contract_artist_id,
        ca.fee,
        ca.status,
        a.name AS artist_name,
        a.parts AS artist_parts
      FROM contract_artists ca
      JOIN contracts c ON ca.contract_id = c.contract_id
      JOIN artists a ON ca.artist_id = a.artist_id
      WHERE c.event_uuid = $1
        AND ca.id <> $2
      ORDER BY ca.created_at ASC
    `, [contract.event_uuid, contractArtistId]);
    const otherContractArtists = otherArtistsResult.rows;

    // 5) contract_artist_responses から最新のレコードを取得（作成日時順に降順で1件）
    const responseResult = await pool.query(`
      SELECT *
      FROM contract_artist_responses
      WHERE contract_artist_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [contractArtistId]);
    const contractResponse = responseResult.rows.length > 0 ? responseResult.rows[0] : null;

    return res.json({
      success: true,
      data: {
        contractArtist,
        contract: {
          ...contract,
          options: parsedOptions
        },
        schedule: schedules,
        contractArtists: otherContractArtists,
        contractResponse
      },
    });
  } catch (error) {
    console.error('Error fetching contract detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contract detail', error: error.message });
  }
});



module.exports = router;

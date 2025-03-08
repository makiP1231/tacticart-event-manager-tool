const express = require('express');
const router = express.Router();
const pool = require('../db');
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





// ログインしているアーティストの仮押さえキャスティング情報を取得するエンドポイント
router.get('/artist/hold-castings', async (req, res) => {
    const artistId = req.session.artistUserId;
  
    if (!artistId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      const result = await pool.query(
        `SELECT 
            hc.id, 
            hc.subject, 
            hc.created_at,
            hc.response_deadline,
            hc.is_multiple_events,
            hc.is_all_events_required,
            COALESCE(
              JSON_AGG(
                json_build_object('event_uuid', e.event_uuid, 'status', ha.status)
              ) FILTER (WHERE e.event_uuid IS NOT NULL),
              '[]'::json
            ) AS events
         FROM artist_hold_casting hc
         JOIN hold_casting_artists ha ON hc.id = ha.hold_casting_id
         JOIN events e ON ha.event_uuid = e.event_uuid
         WHERE ha.artist_id = $1
         GROUP BY hc.id, hc.response_deadline, hc.is_multiple_events, hc.is_all_events_required
         ORDER BY hc.created_at DESC`,
        [artistId]
      );
  
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching artist hold castings:', error);
      res.status(500).json({ message: 'Failed to fetch artist hold castings', error: error.message });
    }
  });
  


// 仮押さえオファーの詳細情報を取得するエンドポイント
router.get('/artist/offer-details/:offerID', async (req, res) => {
    const artistId = req.session.artistUserId;
    const { offerID } = req.params;

    if (!artistId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const offerDetailsResult = await pool.query(
            `SELECT 
                hc.id, 
                hc.subject, 
                hc.created_at,
                hc.message, 
                hc.is_multiple_events, 
                hc.is_all_events_required, 
                hc.response_deadline, 
                ahd.fee, 
                ahd.individual_message, 
                ha.status, 
                hc.base_event_uuid
             FROM artist_hold_casting hc
             JOIN hold_casting_artists ha ON hc.id = ha.hold_casting_id AND ha.event_uuid = hc.base_event_uuid
             JOIN artist_hold_details ahd ON hc.id = ahd.hold_casting_id
             WHERE hc.id = $1 AND ahd.artist_id = $2`,
            [offerID, artistId]
        );

        if (offerDetailsResult.rows.length === 0) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        const eventsResult = await pool.query(
            `SELECT 
                e.event_uuid, 
                e.name, 
                e.flyer_front_url, 
                e.performance_type, 
                e.use_existing_flyers, 
                e.original_event_uuid, 
                e.genre,
                hd.hold_date, 
                hd.note, 
                ha.status
             FROM events e
             JOIN hold_dates hd ON e.event_uuid = hd.event_uuid
             JOIN hold_casting_artists ha ON e.event_uuid = ha.event_uuid
             WHERE hd.hold_casting_id = $1 AND ha.artist_id = $2
             ORDER BY e.event_date ASC`,
            [offerID, artistId]
        );

        const groupedEvents = eventsResult.rows.reduce((acc, row) => {
            if (!acc[row.event_uuid]) {
                acc[row.event_uuid] = {
                    event_uuid: row.event_uuid,
                    name: row.name,
                    flyer_front_url: row.flyer_front_url,
                    performance_type: row.performance_type,
                    use_existing_flyers: row.use_existing_flyers,
                    original_event_uuid: row.original_event_uuid,
                    genre: row.genre,
                    dates: [],
                    status: row.status
                };
            }
            acc[row.event_uuid].dates.push({ hold_date: row.hold_date, note: row.note });
            return acc;
        }, {});

        const eventsWithFlyers = await Promise.all(
            Object.values(groupedEvents).map(async event => {
                if (event.use_existing_flyers && event.original_event_uuid) {
                    const originalEventResult = await pool.query(
                        `SELECT flyer_front_url FROM events WHERE event_uuid = $1`,
                        [event.original_event_uuid]
                    );
                    if (originalEventResult.rows.length > 0) {
                        event.flyer_front_url = originalEventResult.rows[0].flyer_front_url;
                    }
                }
                return event;
            })
        );

        res.json({
            ...offerDetailsResult.rows[0],
            events: eventsWithFlyers
        });
    } catch (error) {
        console.error('Error fetching offer details:', error);
        res.status(500).json({ message: 'Failed to fetch offer details', error: error.message });
    }
});



// 仮押さえオファーへの応答を送信するエンドポイント
router.post('/artist/respond-offer', async (req, res) => {
    const artistId = req.session.artistUserId;
    const { offerID, status, eventID } = req.body;

    if (!artistId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        if (eventID) {
            await pool.query(
                `UPDATE hold_casting_artists
                 SET status = $1
                 WHERE hold_casting_id = $2 AND artist_id = $3 AND event_uuid = $4`,
                [status, offerID, artistId, eventID]
            );
        } else {
            await pool.query(
                `UPDATE hold_casting_artists
                 SET status = $1
                 WHERE hold_casting_id = $2 AND artist_id = $3`,
                [status, offerID, artistId]
            );
        }

        res.status(200).json({ message: 'Response submitted successfully' });
    } catch (error) {
        console.error('Error responding to offer:', error);
        res.status(500).json({ message: 'Failed to respond to offer', error: error.message });
    }
});




// ログインしているアーティストの本契約一覧を全件取得するエンドポイント（上限1000件）
router.get('/artist/contracts', async (req, res) => {
    const artistId = req.session.artistUserId;
    if (!artistId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  
    try {
      const result = await pool.query(
        `
        SELECT
          ca.id AS contract_artist_id,
          ca.contract_id,
          ca.fee,
          ca.status,
          ca.updated_at AS contract_received_at, -- 受信日時として利用
          c.event_uuid,
          e.name AS event_name,
          e.performance_type,
          e.event_date,
          e.venue AS event_venue
        FROM contract_artists ca
        JOIN contracts c ON ca.contract_id = c.contract_id
        JOIN events e ON c.event_uuid = e.event_uuid
        WHERE ca.artist_id = $1
        ORDER BY ca.updated_at DESC
        LIMIT 1000
        `,
        [artistId]
      );
  
      return res.json({
        success: true,
        contracts: result.rows,
      });
    } catch (error) {
      console.error('Error fetching artist contracts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch artist contracts',
        error: error.message,
      });
    }
  });
  

// 期間指定で本契約一覧を取得するエンドポイント（イベント日程で検索、上限1000件）
router.get('/artist/contracts/period', async (req, res) => {
    const artistId = req.session.artistUserId;
    if (!artistId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
      const { start_date, end_date } = req.query;
      if (!start_date && !end_date) {
        return res.status(400).json({
          success: false,
          message: 'At least one of start_date or end_date is required'
        });
      }
      const params = [artistId];
      let conditions = "WHERE ca.artist_id = $1";
      if (start_date) {
        params.push(start_date);
        conditions += ` AND e.event_date >= $${params.length}`;
      }
      if (end_date) {
        params.push(end_date);
        conditions += ` AND e.event_date <= $${params.length}`;
      }
      const query = `
        SELECT
          ca.id AS contract_artist_id,
          ca.contract_id,
          ca.fee,
          ca.status,
          ca.updated_at AS contract_received_at,
          c.event_uuid,
          e.name AS event_name,
          e.performance_type,
          e.event_date,
          e.venue AS event_venue
        FROM contract_artists ca
        JOIN contracts c ON ca.contract_id = c.contract_id
        JOIN events e ON c.event_uuid = e.event_uuid
        ${conditions}
        ORDER BY e.event_date DESC
        LIMIT 1000
      `;
      const result = await pool.query(query, params);
      return res.json({
        success: true,
        contracts: result.rows,
      });
    } catch (error) {
      console.error('Error fetching contracts by period:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch contracts by period',
        error: error.message,
      });
    }
  });


  
// アーティスト用本契約詳細情報取得エンドポイント
router.get('/artist/contract-detail/:contractArtistId', async (req, res) => {
    const artistId = req.session.artistUserId;
    const { contractArtistId } = req.params;
  
    if (!artistId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      // 1) 契約アーティスト情報を取得
      const contractArtistResult = await pool.query(
        `SELECT 
            ca.id AS contract_artist_id,
            ca.fee,
            ca.status,
            ca.updated_at AS contract_sent_at, -- 受信日時として利用
            c.contract_id,
            c.event_uuid::text AS event_uuid,  
            c.venue,            -- 本契約で指定した会場名
            c.rehearsal_venue,  -- 追加：リハーサル会場
            c.transfer_info,
            c.cancel_policy,
            c.remarks,
            c.additional_usage_clause,  -- 追加：二次コンテンツ利用について
            c.contact_person,
            c.contact
          FROM contract_artists ca
          JOIN contracts c ON ca.contract_id = c.contract_id
          WHERE ca.id = $1
            AND ca.artist_id = $2`,
        [contractArtistId, artistId]
      );
      if (contractArtistResult.rows.length === 0) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      const contractArtist = contractArtistResult.rows[0];
  
      // 2) イベント情報（イベント名、日程、会場、open_time, start_time, selected_options, casts など）を取得
      const eventResult = await pool.query(
        `SELECT 
            name AS event_name,
            event_date,
            venue AS event_venue,
            performance_type,
            open_time,
            start_time,
            selected_options,
            program
          FROM events
          WHERE event_uuid = $1`,
        [contractArtist.event_uuid]
      );
      const eventData = eventResult.rows[0] || {};
  
      // selected_options が存在すればJSONパースして配列化（DBがtext型の場合）
      if (eventData.selected_options) {
        try {
          eventData.selected_options = JSON.parse(eventData.selected_options);
        } catch (err) {
          console.error('Error parsing selected_options:', err);
          eventData.selected_options = [];
        }
      } else {
        eventData.selected_options = [];
      }
  
      // 2-2) 出演者情報（event_casts）を取得
      const castsResult = await pool.query(
        `SELECT 
            cast_role,
            cast_name
          FROM event_casts
          WHERE event_uuid = $1`,
        [contractArtist.event_uuid]
      );
      eventData.casts = castsResult.rows; // casts の配列として追加
  
      // 3) 契約スケジュール情報を取得（複数日程がある場合）
      const scheduleResult = await pool.query(
        `SELECT 
            schedule_date,
            note,
            start_time,
            end_time
          FROM contract_schedule
          WHERE contract_id = $1
          ORDER BY schedule_date ASC`,
        [contractArtist.contract_id]
      );
      const schedule = scheduleResult.rows;
  
      return res.json({
        success: true,
        data: {
          contractArtist,
          event: eventData,
          schedule,
        },
      });
    } catch (error) {
      console.error('Error fetching artist contract detail:', error);
      return res.status(500).json({
        message: 'Failed to fetch artist contract detail',
        error: error.message,
      });
    }
  });
  

  //アーティストが本契約に回答してステータスを更新するエンドポイント
  router.post('/artist/respond-contract', async (req, res) => {
    const artistId = req.session.artistUserId;
    if (!artistId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    const { contractArtistId, status, response_reason, recontract_request } = req.body;
  
    if (!contractArtistId || !status) {
      return res.status(400).json({ message: '必須のパラメータが不足しています' });
    }
  
    // status の値は "agreed" または "disagreed" のみ許容する
    if (status !== 'agreed' && status !== 'disagreed') {
      return res.status(400).json({ message: '無効な status の値です' });
    }
  
    try {
      if (status === 'agreed') {
        // 同意の場合は、contract_artists の status を更新するだけ
        await pool.query(
          `UPDATE contract_artists
           SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND artist_id = $3`,
          [status, contractArtistId, artistId]
        );
      } else if (status === 'disagreed') {
        // 非同意の場合は、response_reason と recontract_request の情報が必要
        if (typeof response_reason !== 'string' || typeof recontract_request !== 'boolean') {
          return res.status(400).json({ message: '非同意の場合、理由と再契約希望の有無が正しく指定されている必要があります' });
        }
        // 新たに contract_artist_responses テーブルに情報を保存
        await pool.query(
          `INSERT INTO contract_artist_responses (contract_artist_id, response_reason, recontract_request)
           VALUES ($1, $2, $3)`,
          [contractArtistId, response_reason, recontract_request]
        );
        // 同時に contract_artists の status を更新
        await pool.query(
          `UPDATE contract_artists
           SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND artist_id = $3`,
          [status, contractArtistId, artistId]
        );
      }
  
      return res.json({ message: '回答を送信しました' });
    } catch (error) {
      console.error('Error responding to contract:', error);
      return res.status(500).json({ message: '回答の送信に失敗しました', error: error.message });
    }
  });

  

module.exports = router;
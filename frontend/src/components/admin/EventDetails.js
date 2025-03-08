import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventDetail.css';

const API_URL = process.env.REACT_APP_API_URL;
const FLYER_IMAGE_PATH = process.env.REACT_APP_FLYER_IMAGE_PATH;

function EventDetails() {
  const [eventData, setEventData] = useState(null);
  const [flyerUrls, setFlyerUrls] = useState({ front: null, back: null });
  const [currentFlyerIndex, setCurrentFlyerIndex] = useState(0); // 0: front, 1: back
  const [showFlyerPopup, setShowFlyerPopup] = useState(false);
  const [genres, setGenres] = useState([]);
  const { eventId } = useParams();
  const navigate = useNavigate();

  // 公演区分の日本語変換用マッピング
  const performanceTypeJapanese = {
    single: '単発公演',
    first: '初回公演',
    additional: '追加公演'
  };

  // --- 新規追加: 会場名リンク用の状態 ---
  const [venueLink, setVenueLink] = useState(null);

  useEffect(() => {
    fetchEventDetails();
    fetchGenres();
  }, [eventId]);

  // イベント詳細取得（追加公演かつフライヤー再利用の場合はオリジナルのフライヤー情報を取得）
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      // selected_options を配列に変換
      const options = data.event.selected_options;
      data.event.selected_options = Array.isArray(options)
        ? options
        : JSON.parse(options || '[]');

      setEventData(data.event);

      // 追加公演かつフライヤー再利用ならオリジナルイベントのフライヤー情報を使用
      if (
        data.event.performance_flag === 'additional' &&
        data.event.use_existing_flyers &&
        data.event.original_event_uuid
      ) {
        await fetchOriginalEventFlyer(data.event.original_event_uuid);
      } else {
        setFlyerUrls({
          front: data.event.flyer_front_url
            ? `${API_URL}${FLYER_IMAGE_PATH}${data.event.flyer_front_url}`
            : null,
          back: data.event.flyer_back_url
            ? `${API_URL}${FLYER_IMAGE_PATH}${data.event.flyer_back_url}`
            : null
        });
      }
      // --- 新規追加: 会場名リンクのロジック ---
      if (data.event.venue) {
        fetchVenueNames(data.event.venue);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const fetchOriginalEventFlyer = async (originalEventUuid) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${originalEventUuid}`);
      if (!response.ok) {
        throw new Error('Network response was not ok when fetching original event');
      }
      const data = await response.json();
      setFlyerUrls({
        front: data.event.flyer_front_url
          ? `${API_URL}${FLYER_IMAGE_PATH}${data.event.flyer_front_url}`
          : null,
        back: data.event.flyer_back_url
          ? `${API_URL}${FLYER_IMAGE_PATH}${data.event.flyer_back_url}`
          : null
      });
    } catch (error) {
      console.error('Error fetching original event flyer:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_URL}/api/genres`);
      const data = await response.json();
      setGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  // --- 新規追加: venues/names APIを呼び出して、会場名とIDを取得し、完全一致するかチェック ---
  const fetchVenueNames = async (venueName) => {
    try {
      const response = await fetch(`${API_URL}/api/venues/names`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const matched = data.venues.find(v => v.name === venueName);
      if (matched) {
        setVenueLink(`/admin-dashboard/venues/${matched.id}`);
      } else {
        setVenueLink(null);
      }
    } catch (error) {
      console.error('Error fetching venue names:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '未設定';
    return timeString.slice(0, 5);
  };

  const translateGenre = (genre) => {
    const genreData = genres.find(
      (g) => g.value.toLowerCase() === genre.toLowerCase()
    );
    return genreData ? genreData.label : genre;
  };

  // スライドショー：現在のフライヤー画像を返す
  const getCurrentFlyerUrl = () => {
    // front/back が存在するものだけ配列にする
    const flyerArray = [flyerUrls.front, flyerUrls.back].filter((url) => url !== null);
    if (flyerArray.length === 0) return null;
    // currentFlyerIndex を 0 or 1 として配列から取得
    return flyerArray[currentFlyerIndex % flyerArray.length];
  };

  // フライヤー表示エリア
  const renderFlyerSection = () => {
    const hasFront = Boolean(flyerUrls.front);
    const hasBack = Boolean(flyerUrls.back);
    const currentUrl = getCurrentFlyerUrl();

    return (
      <div className="flyer-section">
        <div className="flyer-slide">
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Event Flyer"
              className="flyer-image"
              onClick={() => setShowFlyerPopup(true)}
            />
          ) : (
            <p>フライヤーがありません</p>
          )}
        </div>
        {/* 両方のフライヤーが存在する場合、1つのボタンで裏表を切り替え */}
        {hasFront && hasBack && (
          <div className="flyer-navigation">
            <button
              className="nav-button"
              onClick={() => setCurrentFlyerIndex((prev) => (prev + 1) % 2)}
            >
              {currentFlyerIndex === 0 ? "フライヤー裏" : "フライヤー表"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTextBlock = (text) => {
    if (!text) return null;
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: text.replace(/\n/g, '<br/>')
        }}
      />
    );
  };

  const renderSelectedOptions = () => {
    if (!eventData || !eventData.selected_options || !eventData.selected_options.length) {
      return null;
    }
    return (
      <div className="options-container">
        {eventData.selected_options.map((option, index) => (
          <span key={index} className="option-badge">
            {option}
          </span>
        ))}
      </div>
    );
  };

  if (!eventData) {
    return <div>Loading...</div>;
  }

  // フライヤーが一切無いかどうかを判定
  const hasAnyFlyer = flyerUrls.front || flyerUrls.back;

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="event-detail-container">
        <h1>
          {eventData.name}
          {eventData.performance_type && (
            <span className="performance-type"> {eventData.performance_type}</span>
          )}
        </h1>
        <div className="event-detail-columns">
          {/* フライヤーが存在する場合のみフライヤー表示領域をレンダリング */}
          {hasAnyFlyer && (
            <div className="flyer-container">
              {renderFlyerSection()}
            </div>
          )}
          {/* 右カラム：イベント情報表 */}
          <div className="event-info-container">
            <table className="event-info-table">
              <tbody>
                <tr>
                  <th>ジャンル</th>
                  <td>{translateGenre(eventData.genre)}</td>
                </tr>
                <tr>
                  <th>日付</th>
                  <td>{formatDate(eventData.event_date)}</td>
                </tr>
                <tr>
                  <th>開場</th>
                  <td>{formatTime(eventData.open_time)}</td>
                </tr>
                <tr>
                  <th>開演</th>
                  <td>{formatTime(eventData.start_time)}</td>
                </tr>
                <tr>
                  <th>会場名</th>
                  <td>
                    {venueLink ? (
                      <a href={venueLink}>{eventData.venue}</a>
                    ) : (
                      eventData.venue
                    )}
                  </td>
                </tr>
                {/* --- 新規追加: 開催都道府県を表示 --- */}
                <tr>
                  <th>開催都道府県</th>
                  <td>{eventData.prefecture || '未設定'}</td>
                </tr>
                <tr>
                  <th>公演区分</th>
                  <td>{performanceTypeJapanese[eventData.performance_flag]}</td>
                </tr>
                {eventData.additional_dates &&
                  eventData.additional_dates.map((date, index) => (
                    <tr key={index}>
                      <th>追加日程</th>
                      <td>
                        {formatDate(date.additional_date)}：{date.description}
                      </td>
                    </tr>
                  ))}
                <tr>
                  <th>出演者</th>
                  <td>
                    {eventData.casts &&
                      eventData.casts.map((cast, index) => (
                        <div key={index}>
                          {cast.cast_role}: {cast.cast_name}
                        </div>
                      ))}
                  </td>
                </tr>
                <tr>
                  <th>イベント概要</th>
                  <td>{renderTextBlock(eventData.event_overview)}</td>
                </tr>
                <tr>
                  <th>プログラム</th>
                  <td>{renderTextBlock(eventData.program)}</td>
                </tr>
                <tr>
                  <th>料金・チケット情報</th>
                  <td>{renderTextBlock(eventData.ticket_info)}</td>
                </tr>
                <tr>
                  <th>オプション</th>
                  <td>{renderSelectedOptions()}</td>
                </tr>
                <tr>
                  <th>主催</th>
                  <td>{eventData.organizer}</td>
                </tr>
                <tr>
                  <th>運営</th>
                  <td>{eventData.operator}</td>
                </tr>
              </tbody>
            </table>
            <div className="event-actions">
              <button onClick={() => navigate(`/admin-dashboard/events/edit/${eventId}`)}>
                修正
              </button>
              <button
                onClick={() =>
                  navigate(`/admin-dashboard/events/event-casting-registration/${eventId}`)
                }
              >
                キャスティング登録
              </button>
            </div>
          </div>
        </div>
      </div>
      {showFlyerPopup && (
        <div className="flyer-popup" onClick={() => setShowFlyerPopup(false)}>
          <img
            src={getCurrentFlyerUrl()}
            alt="拡大フライヤー"
            className="expanded-flyer"
          />
        </div>
      )}
    </div>
  );
}

export default EventDetails;

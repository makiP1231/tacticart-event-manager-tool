import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventRegistrationComplete.css';

const API_URL = process.env.REACT_APP_API_URL;

function EventRegistrationComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const eventData = location.state?.event;
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${API_URL}/api/genres`, { credentials: 'include' });
        const data = await response.json();
        if (response.ok) {
          setGenres(data);
        } else {
          throw new Error('Failed to fetch genres');
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    fetchGenres();
  }, []);

  const translateGenre = (genreValue) => {
    const genre = genres.find(g => g.value === genreValue);
    return genre ? genre.label : genreValue;
  };

  const getImageUrl = (type, filename) =>
    filename ? `${API_URL}/images/${type}/${filename}` : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '未設定';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '未設定';
    const time = new Date(`1970-01-01T${timeStr}`);
    return time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getSelectedOptions = (selectedOptions) => {
    if (!selectedOptions) return [];
    try {
      return JSON.parse(selectedOptions);
    } catch (error) {
      console.error('Failed to parse selected options:', error);
      return [];
    }
  };

  if (!eventData) {
    return <div>Loading...</div>;
  }

  // 取得データの分割（追加日程、出演者はテーブル外で表示）
  const {
    name,
    performance_type,
    genre,
    event_date,
    open_time,
    start_time,
    organizer,
    operator,
    program,
    event_overview,
    ticket_info,
    selected_options,
    additional_dates,
    casts,
    flyer_front_url,
    flyer_back_url,
    venue
  } = eventData;

  const selectedOptionsArr = getSelectedOptions(selected_options);

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="event-complete-container">
        <h1>
          {name} {performance_type && <span className="performance-type">{performance_type}</span>}
        </h1>
        <div className="event-details">
          <table className="event-info-table">
            <tbody>
              <tr>
                <th>ジャンル</th>
                <td>{translateGenre(genre)}</td>
              </tr>
              <tr>
                <th>会場</th>
                <td>{venue}</td>
              </tr>
              <tr>
                <th>イベント日</th>
                <td>{formatDate(event_date)}</td>
              </tr>
              <tr>
                <th>開場時間</th>
                <td>{formatTime(open_time)}</td>
              </tr>
              <tr>
                <th>開演時間</th>
                <td>{formatTime(start_time)}</td>
              </tr>
              <tr>
                <th>主催</th>
                <td>{organizer}</td>
              </tr>
              <tr>
                <th>運営</th>
                <td>{operator}</td>
              </tr>
              <tr>
                <th>プログラム</th>
                <td>{program}</td>
              </tr>
              <tr>
                <th>イベント概要</th>
                <td>{event_overview}</td>
              </tr>
              <tr>
                <th>料金・チケット情報</th>
                <td>{ticket_info}</td>
              </tr>
              {selectedOptionsArr.length > 0 && (
                <tr>
                  <th>オプション</th>
                  <td>
                    {selectedOptionsArr.map((option, index) => (
                      <span key={index} className="option-badge">{option}</span>
                    ))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {additional_dates && additional_dates.length > 0 && (
            <div className="additional-section">
              <h3>追加日程</h3>
              {additional_dates.map((dateObj, index) => (
                <p key={index} className="detail-text">
                  {formatDate(dateObj.additional_date)}：{dateObj.additional_date_title} — {dateObj.description}
                </p>
              ))}
            </div>
          )}

          {casts && casts.length > 0 && (
            <div className="casts-section">
              <h3>出演者</h3>
              {casts.map((cast, index) => (
                <p key={index} className="detail-text">
                  {cast.cast_role}: {cast.cast_name}
                </p>
              ))}
            </div>
          )}

          <div className="flyers-section">
            {flyer_front_url && (
              <img src={getImageUrl('flyers', flyer_front_url)} alt="フライヤー表" className="flyer-image" />
            )}
            {flyer_back_url && (
              <img src={getImageUrl('flyers', flyer_back_url)} alt="フライヤー裏" className="flyer-image" />
            )}
          </div>

          <div className="buttons">
            <button onClick={() => navigate('/admin-dashboard/events/register')}>
              続けて新規イベント登録
            </button>
            <button onClick={() => navigate('/admin-dashboard/events')}>
              イベント一覧
            </button>
            <button onClick={() => navigate(`/admin-dashboard/events/event-details/${eventData.event_uuid}`)}>
              イベント詳細ページに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventRegistrationComplete;

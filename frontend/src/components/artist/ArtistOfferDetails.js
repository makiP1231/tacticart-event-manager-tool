import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOfferCount } from '../../contexts/OfferCountContext';
import ArtistSidebar from './ArtistSidebar';
import '../../css/artist/ArtistOfferDetails.css';

const API_URL = process.env.REACT_APP_API_URL;
const placeholderImages = [
  'noimagepic1.jpg',
  'noimagepic2.jpg',
  'noimagepic3.jpg',
  'noimagepic4.jpg',
  'noimagepic5.jpg',
  'noimagepic6.jpg',
  'noimagepic7.jpg',
  'noimagepic8.jpg',
  'noimagepic9.jpg',
  'noimagepic10.jpg',
  'noimagepic11.jpg',
  'noimagepic12.jpg',
  'noimagepic13.jpg',
  'noimagepic14.jpg',
  'noimagepic15.jpg',
  'noimagepic16.jpg',
  'noimagepic17.jpg',
  'noimagepic18.jpg'
];

const getRandomPlaceholder = () => {
  const randomIndex = Math.floor(Math.random() * placeholderImages.length);
  return placeholderImages[randomIndex];
};

const getImageUrl = (filename) =>
  filename
    ? `${API_URL}/images/flyers/${filename}`
    : `${API_URL}/images/placeholders/${getRandomPlaceholder()}`;

const ArtistOfferDetail = () => {
  const { offerID } = useParams();
  const navigate = useNavigate();
  const { refreshOfferCount } = useOfferCount();
  const [offerDetails, setOfferDetails] = useState(null);
  const [artistName, setArtistName] = useState('');
  const [genres, setGenres] = useState([]);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);

  useEffect(() => {
    fetchOfferDetails();
    fetchArtistName();
    fetchGenres();
  }, [offerID]);

  const fetchOfferDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/offer-details/${offerID}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setOfferDetails(data);
      } else {
        const data = await response.json();
        console.error('Failed to fetch offer details:', data.message);
      }
    } catch (error) {
      console.error('Error fetching offer details:', error);
    }
  };

  const fetchArtistName = async () => {
    try {
      const sessionResponse = await fetch(`${API_URL}/api/session`, {
        method: 'GET',
        credentials: 'include'
      });
      const sessionData = await sessionResponse.json();
      if (sessionResponse.ok && sessionData.userType === 'artist') {
        const artistResponse = await fetch(`${API_URL}/api/artists/${sessionData.userId}`, {
          method: 'GET',
          credentials: 'include'
        });
        const artistData = await artistResponse.json();
        if (artistResponse.ok) {
          setArtistName(artistData.name);
        } else {
          throw new Error(artistData.message || 'Failed to fetch artist details');
        }
      } else {
        throw new Error('No active session found');
      }
    } catch (error) {
      console.error('Error fetching artist name:', error);
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

  const translateGenre = (genre) => {
    if (!genre) return '';
    const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
    return genreData ? genreData.label : genre;
  };

  const getGenreColor = (genre) => {
    if (!genre) return '#007bff';
    const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
    return genreData ? genreData.color : '#007bff';
  };

  const handleConfirmAction = async (status, eventID = null) => {
    try {
      const response = await fetch(`${API_URL}/api/artist/respond-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ offerID, status, eventID })
      });
      const data = await response.json();
      if (response.ok) {
        // ① オファー詳細を再取得
        fetchOfferDetails();
        // ② バッチ数を更新
        refreshOfferCount();
      } else {
        console.error('Failed to respond to offer:', data.message);
      }
    } catch (error) {
      console.error('Error responding to offer:', error);
    } finally {
      setShowConfirmationPopup(false);
    }
  };

  const renderStatusButton = (status, eventID = null) => {
    const handleClick = (action) => {
      setConfirmationAction({ action, eventID });
      setShowConfirmationPopup(true);
    };

    switch (status) {
      case 'pending':
        return (
          <div className="status-buttons">
            <button className="status-button approve" onClick={() => handleClick('approved')}>参加可能</button>
            <button className="status-button reject" onClick={() => handleClick('rejected')}>参加不可</button>
          </div>
        );
      case 'approved':
        return <span className="status-badge approved">参加可能を回答済み</span>;
      case 'contract_sent':
        return <span className="status-badge approved">参加可能を回答済み</span>;
      case 'rejected':
        return <span className="status-badge rejected">参加不可を回答済み</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">募集がキャンセルされました</span>;
      case 'expired':
        return <span className="status-badge expired">回答期限切れ</span>;
      default:
        return null;
    }
  };

  const getRelevantStatus = () => {
    if (offerDetails.is_all_events_required || !offerDetails.is_multiple_events) {
      const baseEvent = offerDetails.events.find(event => event.event_uuid === offerDetails.base_event_uuid);
      return baseEvent ? baseEvent.status : 'pending';
    }
    return null;
  };

  if (!offerDetails) {
    return <div>Loading...</div>;
  }

  const relevantStatus = getRelevantStatus();

  // 送信日時：秒は不要なので日付のみ表示
  const createdAt = new Date(offerDetails.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
  // 回答期限：存在すれば月/日の形式、なければ「未設定」
  const deadline = offerDetails.response_deadline
    ? (() => {
        const d = new Date(offerDetails.response_deadline);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      })()
    : '未設定';

  return (
    <div className="artist-dashboard">
      <ArtistSidebar />
      <div className="artist-offer-detail-container">
      <div className="detail-item">
          <p>{createdAt}    回答期限: {deadline}</p>
        </div>
        <h1>{offerDetails.subject}</h1>
        <p className="message">
          {offerDetails.message.split('\n').map((line, index) => (
            <span key={index}>{line}<br /></span>
          ))}
        </p>
        <div className="detail-item">
          <h3>依頼料</h3>
          <p>{offerDetails.fee > 0 ? `${parseInt(offerDetails.fee, 10).toLocaleString()} 円(税込み)` : '別途相談'}</p>
        </div>
        {offerDetails.individual_message && (
          <div className="detail-item">
            <h3>{artistName}さんへのメッセージ</h3>
            <p>
              {offerDetails.individual_message.split('\n').map((line, index) => (
                <span key={index}>{line}<br /></span>
              ))}
            </p>
          </div>
        )}
        {offerDetails.is_all_events_required && (
          <div className="info-message">
            以下のイベント全てに参加できますか？
          </div>
        )}
        {!offerDetails.is_all_events_required && offerDetails.is_multiple_events && (
          <div className="info-message">
            イベントごとに参加意思の回答してください。
          </div>
        )}
        {Array.isArray(offerDetails.events) && offerDetails.events.map(event => (
          <div key={event.event_uuid} className="event-section">
            <img src={getImageUrl(event.flyer_front_url)} alt="フライヤー画像" className="flyer-image" />
            <div className="event-info">
              <p className="genre" style={{ backgroundColor: getGenreColor(event.genre) }}>
                {translateGenre(event.genre)}
              </p>
              {/* イベントタイトルをリンク化 */}
              <p className="event-title">
                <a href={`/artist-dashboard/event/${event.event_uuid}`}>
                  {event.name} {event.performance_type}
                </a>
              </p>
              {/* 日程表示部分：上部に「仮押さえ日程」ラベル、以下横並びに日程とノート */}
              <div className="date-section">
                <p className="date-section-label">仮押さえ日程</p>
                <div className="date-list">
                  {event.dates.map(date => (
                    <div key={date.hold_date} className="date-item">
                      <p className="date">{new Date(date.hold_date).toLocaleDateString('ja-JP')}</p>
                      <p className="note">{date.note}</p>
                    </div>
                  ))}
                </div>
              </div>
              {!offerDetails.is_all_events_required && offerDetails.is_multiple_events &&
                renderStatusButton(event.status, event.event_uuid)
              }
            </div>
          </div>
        ))}
        {!offerDetails.is_multiple_events && renderStatusButton(relevantStatus)}
        {offerDetails.is_all_events_required && renderStatusButton(relevantStatus)}

        <div className="back-button-container">
          <button className="back-button" onClick={() => navigate(-1)}>オファー一覧</button>
        </div>
      </div>

      {showConfirmationPopup && (
        <div className="artist-offer-detail-popup-background" onClick={() => setShowConfirmationPopup(false)}>
          <div className="artist-offer-detail-confirmation-popup" onClick={e => e.stopPropagation()}>
            <h3>{confirmationAction.action === 'approved' ? '参加可能を' : '参加不可を'}送信しますか？</h3>
            <button className="confirm-button" onClick={() => handleConfirmAction(confirmationAction.action, confirmationAction.eventID)}>はい</button>
            <button className="cancel-button" onClick={() => setShowConfirmationPopup(false)}>いいえ</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistOfferDetail;

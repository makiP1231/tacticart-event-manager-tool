// ArtistOffers.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtistSidebar from './ArtistSidebar';
import '../../css/artist/ArtistOffers.css';

const API_URL = process.env.REACT_APP_API_URL;

const ArtistOffers = () => {
  const [offers, setOffers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 1ページあたりの表示件数
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/hold-castings`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOffers(sortedData);
      } else {
        console.error('Failed to fetch offers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  // ページネーションの計算
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = offers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(offers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

// ステータス表示のロジック（条件を調整）
const getStatusBadge = (offer) => {
    const events = offer.events || [];
    console.log("DEBUG: offer.id =", offer.id, 
                "is_multiple_events =", offer.is_multiple_events, 
                "events =", events);
  
    if (!offer.is_multiple_events) {
      const status = events[0]?.status;
      console.log("DEBUG: 単一イベントの場合、status =", status);
      if (status === 'cancelled') {
        return <span className="status-badge cancelled">オファーが取り消されました</span>;
      }
      if (status === 'expired') {
        return <span className="status-badge expired">回答期限切れ</span>;
      }
      if (status === 'pending') {
        return <span className="status-badge pending">オファーが届いています</span>;
      }
      return <span className="status-badge responded">回答済み</span>;
    } else {
      const hasPending = events.some(event => event.status === 'pending');
      const allExpired = events.every(event => event.status === 'expired');
      const allCancelled = events.every(event => event.status === 'cancelled');
      console.log("DEBUG: 複数イベントの場合、hasPending =", hasPending, 
                  "allExpired =", allExpired, 
                  "allCancelled =", allCancelled);
      if (hasPending) {
        return <span className="status-badge pending">オファーが届いています</span>;
      } else if (allExpired) {
        return <span className="status-badge expired">回答期限切れ</span>;
      } else if (allCancelled) {
        return <span className="status-badge cancelled">オファーが取り消されました</span>;
      } else {
        return <span className="status-badge responded">回答済み</span>;
      }
    }
  };
  
  
  

  return (
    <div className="artist-dashboard">
      <ArtistSidebar />
      <div className="artist-offers-container">
        <h1>オファー一覧</h1>
        <div className="offers-list">
          {currentItems.map((offer) => {
            // 申請日時：時間は不要なので日付のみ表示
            const createdAt = new Date(offer.created_at).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric'
            });
            // 回答期限：存在すれば月/日の形式、なければ「未設定」
            const deadline = offer.response_deadline
              ? (() => {
                  const d = new Date(offer.response_deadline);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                })()
              : '未設定';
            return (
              <div
                key={offer.id}
                className="offer-card"
                onClick={() => navigate(`/artist-dashboard/offer/${offer.id}`)}
              >
                <div className="offer-details">
                  <p>{createdAt}</p>
                  {getStatusBadge(offer)}
                  <p>{offer.subject} (回答期限：{deadline})</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={currentPage === index + 1 ? 'active' : ''}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistOffers;

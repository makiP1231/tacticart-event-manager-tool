import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArtistSidebar from './ArtistSidebar';
import '../../css/artist/ArtistVenueDetail.css';

function ArtistVenueDetail() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [copyButtonText, setCopyButtonText] = useState("Copy");

  // 会場詳細取得
  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/venues/${venueId}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch venue details');
        }
        const data = await response.json();
        setVenue(data.venue);
        setFormData(data.venue);
      } catch (error) {
        console.error('Error fetching venue detail:', error);
      }
    };
    fetchVenue();
  }, [venueId]);

// 郵便番号整形関数：例 "1234567" → "〒123-4567"
  const formatPostalCode = (code) => {
    if (!code) return '';
    const cleaned = code.replace(/[^0-9]/g, '');
    if (cleaned.length !== 7) return `〒${cleaned}`;
    return `〒${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  };

    // 住所コピー機能: コピー成功後、ボタンの文言を一時的に "Copied" に変更
  const handleCopyAddress = (addressText) => {
    navigator.clipboard.writeText(addressText)
      .then(() => {
        setCopyButtonText("Copied");
        setTimeout(() => setCopyButtonText("Copy"), 3000);
      })
      .catch((err) => {
        console.error('コピーに失敗しました:', err);
      });
  };


  if (!venue) return <div>Loading...</div>;

  const fullAddress = `${venue.prefecture}${venue.city}${venue.address}`;

  return (
    <div className="artist-dashboard">
      <ArtistSidebar />
      <div className="venue-detail-container">
        <h1>会場詳細</h1>
          <div className="venue-detail-view">
            <table>
              <tbody>
                <tr>
                  <th>会場名</th>
                  <td>{venue.name}</td>
                </tr>
                <tr>
                  <th>郵便番号</th>
                  <td>{formatPostalCode(venue.postal_code)}</td>
                </tr>
                <tr>
                  <th>住所</th>
                  <td>
                    {fullAddress}
                    <button 
                      onClick={() => handleCopyAddress(fullAddress)}
                      className="copy-btn"
                    >
                      {copyButtonText}
                    </button>
                  </td>
                </tr>
                <tr>
                  <th>Google Map</th>
                  <td>
                    {venue.google_map_link ? (
                      <iframe
                        title="Google Map"
                        src={venue.google_map_link}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                      ></iframe>
                    ) : '-'}
                  </td>
                </tr>
                <tr>
                  <th>キャパ</th>
                  <td>{venue.capacity || '-'}</td>
                </tr>
                <tr>
                <th>電話番号</th>
                <td>
                    {venue.phone ? (
                    <a href={`tel:${venue.phone}`}>{venue.phone}</a>
                    ) : '-'}
                </td>
                </tr>
                <tr>
                  <th>会場HPリンク</th>
                  <td>
                    {venue.website_link ? (
                      <a href={venue.website_link} target="_blank" rel="noopener noreferrer">
                        {venue.website_link}
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="button-group">
                <button className="back-button" onClick={() => navigate(-1)}>戻る</button>
            </div>
          </div>
      </div>
    </div>
  );
}

export default ArtistVenueDetail;

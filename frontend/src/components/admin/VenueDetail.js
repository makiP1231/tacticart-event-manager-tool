import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/VenueDetail.css';

function VenueDetail() {
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

  const handleEditToggle = () => {
    setEditMode(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData(venue);
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/venues/${venueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error('Failed to update venue');
      }
      const data = await response.json();
      setVenue(data.venue);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating venue:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/venues/${venueId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete venue');
      }
      navigate('/admin-dashboard/venuelist');
    } catch (error) {
      console.error('Error deleting venue:', error);
    }
  };

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
    <div className="admin-dashboard">
      <Sidebar />
      <div className="venue-detail-container">
        <h1>会場詳細</h1>
        {editMode ? (
          <div className="venue-detail-edit">
            <table>
              <tbody>
                <tr>
                  <th>会場名</th>
                  <td>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>郵便番号</th>
                  <td>
                    <input 
                      type="text" 
                      name="postal_code" 
                      value={formData.postal_code || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>都道府県</th>
                  <td>
                    <input 
                      type="text" 
                      name="prefecture" 
                      value={formData.prefecture || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>市区町村</th>
                  <td>
                    <input 
                      type="text" 
                      name="city" 
                      value={formData.city || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>番地・建物</th>
                  <td>
                    <input 
                      type="text" 
                      name="address" 
                      value={formData.address || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>Google Map リンク</th>
                  <td>
                    <input 
                      type="url" 
                      name="google_map_link" 
                      value={formData.google_map_link || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>キャパ</th>
                  <td>
                    <input 
                      type="number" 
                      name="capacity" 
                      value={formData.capacity || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>関連資料リンク</th>
                  <td>
                    <input 
                      type="text" 
                      name="related_links" 
                      value={formData.related_links || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>備考</th>
                  <td>
                    <textarea 
                      name="remarks" 
                      value={formData.remarks || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>電話番号</th>
                  <td>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
                <tr>
                  <th>会場HPリンク</th>
                  <td>
                    <input 
                      type="url" 
                      name="website_link" 
                      value={formData.website_link || ''} 
                      onChange={handleChange} 
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="button-group">
              <button onClick={handleSave}>保存</button>
              <button onClick={handleCancel}>キャンセル</button>
            </div>
          </div>
        ) : (
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
                  <th>関連資料リンク</th>
                  <td>{venue.related_links ? JSON.stringify(venue.related_links) : '-'}</td>
                </tr>
                <tr>
                  <th>備考</th>
                  <td>{venue.remarks || '-'}</td>
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
              <button onClick={handleEditToggle}>編集</button>
              <button onClick={handleDelete}>削除</button>
              <button onClick={() => navigate('/admin-dashboard/venues')}>一覧に戻る</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueDetail;

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import '../../css/admin/VenueRegistration.css';

function VenueRegistration() {
  // 初期状態に website_link を追加
  const initialState = {
    name: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address: '',
    google_map_link: '',
    capacity: '',
    related_links: '',
    remarks: '',
    phone: '',
    website_link: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [showPopup, setShowPopup] = useState(false);

  // 通常の入力ハンドラー
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 郵便番号は半角数字のみ許可する
  const handlePostalCodeChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = value.replace(/[^0-9]/g, "");
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  // Enter キーでの誤送信防止
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // 郵便番号入力欄からフォーカスアウト時に住所自動入力（ZipCloud API 利用）
  const handlePostalCodeBlur = async (e) => {
    const postalCode = e.target.value;
    if (postalCode.length === 7) {
      try {
        const response = await fetch(`http://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          setFormData(prev => ({
            ...prev,
            prefecture: result.address1,
            city: result.address2,
            address: result.address3
          }));
        }
      } catch (error) {
        console.error('Error fetching address from postal code:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
      related_links: formData.related_links 
        ? formData.related_links.split(',').map(link => link.trim())
        : []
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Venue registration failed');
      }
      setShowPopup(true);
    } catch (error) {
      console.error('Error registering venue:', error);
      alert("会場登録に失敗しました");
    }
  };

  // ポップアップのOKボタンでフォーム全体を初期化
  const handlePopupOk = () => {
    setShowPopup(false);
    setFormData(initialState);
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="venue-register-container">
        <h1>会場登録</h1>
        <form className="venue-register-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="form-group">
            <label className="group-label">会場名:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="group-label">郵便番号:</label>
            <input 
              type="text" 
              name="postal_code" 
              value={formData.postal_code} 
              onChange={handlePostalCodeChange} 
              onBlur={handlePostalCodeBlur} 
              placeholder="例: 1234567" 
            />
          </div>
          <small className="form-help-text">
            ※半角数字のみ入力してください。郵便番号入力後、自動で住所が入力されます。
          </small>
          <div className="form-group">
            <label className="group-label">都道府県:</label>
            <input type="text" name="prefecture" value={formData.prefecture} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="group-label">市区町村:</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="group-label">番地・建物:</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="group-label">電話番号:</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="例: 03-1234-5678" />
          </div>
          <div className="form-group">
            <label className="group-label">会場HP URL:</label>
            <input
                type="url"
                name="website_link"
                value={formData.website_link}
                onChange={handleChange}
                placeholder="例: https://www.tacticart.co.jp"
            />
          </div>
          <div className="form-group">
            <label className="group-label">Google Map URL:</label>
            <input type="url" name="google_map_link" value={formData.google_map_link} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="group-label">キャパシティ:</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="group-label">関連資料リンク:</label>
            <input type="text" name="related_links" value={formData.related_links} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="group-label">備考:</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange}></textarea>
          </div>
          <button type="submit" className="submit-btn">登録</button>
        </form>
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <p>会場登録が完了しました</p>
              <button onClick={handlePopupOk}>OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueRegistration;

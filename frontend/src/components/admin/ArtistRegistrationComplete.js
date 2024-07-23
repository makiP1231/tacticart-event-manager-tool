import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ArtistRegistrationComplete.css';
import parts from '../../data/parts';

function ArtistRegistrationComplete() {
  const location = useLocation();
  const { artist, registrationUrl } = location.state || {};

  // パート情報を日本語のラベルに変換する関数
  const getJapanesePartNames = (partKeys) => {
    // partKeysが文字列の場合、配列に変換
    if (typeof partKeys === 'string') {
      partKeys = [partKeys];
    }
  
    return partKeys.map(key => {
      const foundPart = parts.find(part => part.value === key);
      return foundPart ? foundPart.label : '未定義のパート';
    }).join(', ');
  };

  if (!artist || !registrationUrl) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="content artist-completion-container">
          <h2>エラー</h2>
          <p>アーティスト情報または登録URLが正しく取得できませんでした。</p>
          <Link to="/admin-dashboard/artists/register" className="continue-button">アーティスト登録へ戻る</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="content artist-completion-container">
        <h2>新規アーティスト登録完了</h2>
        <div className="artist-details">
          <p><strong>アーティスト名:</strong> {artist.name}</p>
          <p><strong>パート:</strong> {getJapanesePartNames(artist.parts)}</p>
          <div className="registration-url">
            <p><strong>登録用URL:</strong></p>
            <textarea
              value={registrationUrl}
              readOnly
              className="registration-url-textarea"
              onClick={(e) => e.target.select()}
            />
            <button onClick={() => navigator.clipboard.writeText(registrationUrl)}>URLをコピー</button>
          </div>
          <Link to="/admin-dashboard/artists/register" className="continue-button">続けて新規アーティスト登録</Link>
          <Link to="/admin-dashboard/artists/list" className="back-button">登録アーティスト一覧</Link>
        </div>
      </div>
    </div>
  );
}

export default ArtistRegistrationComplete;

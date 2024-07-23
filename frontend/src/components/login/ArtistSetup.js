import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/login/ArtistSetup.css';

function ArtistSetup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordShown, setPasswordShown] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();
  const { artistId } = useParams();
  const { fetchSession } = useAuth();

  useEffect(() => {
    const fetchArtistName = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/get-artist/${artistId}`);
        const data = await response.json();
        if (response.ok) {
          setArtistName(data.artistName);
          setIsRegistered(data.isRegistered);
          if (data.isRegistered) {
            alert('アーティスト登録は既に完了しています。ログインページへ移動します。');
            navigate('/artist-login');
          }
        } else {
          throw new Error('Failed to fetch artist details');
        }
      } catch (error) {
        console.error('Error fetching artist details:', error);
      }
    };

    fetchArtistName();
  }, [artistId, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert('パスワードが一致しません。');
      return;
    }
    const setupData = { email, password };
    try {
      const response = await fetch(`http://localhost:5000/api/setup-artist/${artistId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData),
        credentials: 'include'
      });
      if (response.ok) {
        await fetchSession();
        navigate('/artist-dashboard');
      } else {
        const result = await response.json();
        alert(result.message);
      }
    } catch (error) {
      console.error('Error setting up artist:', error);
    }
  };

  return (
    <div className="artist-setup-container">
      <div className="artist-setup-form">
        <h1>アーティストアカウント登録</h1>
        {artistName && <h2>Welcome, {artistName}!</h2>}
        <p>ログイン用メールアドレスとパスワードを設定してください。</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
          />
          <input
            type={passwordShown ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            required
          />
          <input
            type={passwordShown ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="パスワードの確認"
            required
          />
          <label>
            <input
              type="checkbox"
              checked={passwordShown}
              onChange={() => setPasswordShown(!passwordShown)}
            />
            パスワードを表示する
          </label>
          <button type="submit">ログイン情報を登録</button>
        </form>
      </div>
    </div>
  );
}

export default ArtistSetup;

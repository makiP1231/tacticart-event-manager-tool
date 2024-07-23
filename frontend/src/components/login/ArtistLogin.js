import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/login/Login.css';

function ArtistLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { fetchSession } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/artist-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // セッションクッキーを含むリクエストを送信
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Login successful:', data);
        await fetchSession(); // セッション情報を再取得
        navigate('/artist-dashboard'); // ダッシュボードへリダイレクト
      } else {
        console.log('Login failed:', data);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>アーティストログイン</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            className="email-input"  // ここにクラスを追加
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit">ログイン</button>
        </form>
      </div>
    </div>
  );
}

export default ArtistLogin;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import '../../css/admin/AdminAccountSetup.css';

const API_URL = process.env.REACT_APP_API_URL;

function AdminAccountSetup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('general');  // デフォルトは一般管理者
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // 成功メッセージの追加
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      // 管理者でない場合は、管理者ダッシュボードにリダイレクトせず、表示を制限します
      setError('アクセスが拒否されました');
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const setupData = { username, password, role };
    try {
      const response = await fetch(`${API_URL}/api/admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // セッション情報を含める
        body: JSON.stringify(setupData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('管理者アカウントが作成されました'); // 成功メッセージを状態に保存
        setUsername(''); // フォームのリセット
        setPassword('');
        setRole('general');
      } else {
        throw new Error(data.message || 'Setup failed');
      }
    } catch (error) {
      console.error('Error setting up admin:', error);
      setError(error.message); // エラーメッセージを状態に保存
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="admin-account-setup-container">
        <div className="admin-account-setup-form">
          <h1>管理者アカウント作成</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>} {/* 成功メッセージを表示 */}
          {user && user.role === 'admin' && (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="general">一般管理者</option>
                <option value="admin">管理者</option>
              </select>
              <button type="submit">作成</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAccountSetup;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/admin/AdminAccountManagement.css';

const API_URL = process.env.REACT_APP_API_URL;

function AdminAccountManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 管理者一覧
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 新規アカウント作成フォーム用
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('general'); // デフォルトは一般管理者
  const [formMessage, setFormMessage] = useState('');

  // -----------------------------
  // 1. 管理者一覧を取得する関数
  // -----------------------------
  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/admin-users`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('管理者一覧の取得に失敗しました。');
      }
      const data = await res.json();
      setAdminUsers(data.adminUsers);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 2. 初回マウント時に管理者一覧を取得
  //    （セキュリティチェックは一旦オフに）
  // -----------------------------
  useEffect(() => {
    // // セキュリティチェックをオフ (開発中のみ)
    // if (!user || user.role !== 'admin') {
    //   setError('アクセスが拒否されました');
    // } else {
    //   fetchAdminUsers();
    // }

    fetchAdminUsers();
  }, []);

  // -----------------------------
  // 3. 新規アカウント作成フォーム送信
  // -----------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormMessage('');
    try {
      const response = await fetch(`${API_URL}/api/admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '作成に失敗しました');
      }
      setFormMessage('管理者アカウントが作成されました');
      setUsername('');
      setPassword('');
      setRole('general');
      // 作成後に一覧を再取得
      fetchAdminUsers();
    } catch (err) {
      setFormMessage(err.message);
    }
  };

  // -----------------------------
  // 4. 削除ボタンのクリック処理
  // -----------------------------
  const handleDelete = async (id) => {
    if (!window.confirm('この管理者アカウントを削除してもよろしいですか？')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/admin-users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '削除に失敗しました');
      }
      // 削除後に一覧を再取得
      fetchAdminUsers();
    } catch (err) {
      alert('削除エラー: ' + err.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="admin-account-management-container">
        <h1>アカウント管理</h1>
        
        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <>
            {/* 管理者一覧のテーブル */}
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ユーザー名</th>
                  <th>ロール</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.id}</td>
                    <td>{admin.username}</td>
                    <td>{admin.role}</td>
                    <td>
                      <button onClick={() => handleDelete(admin.id)}>削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 新規アカウント作成フォーム */}
            <div className="new-account-form">
              <h2>新規アカウント作成</h2>
              {formMessage && <p className="form-message">{formMessage}</p>}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAccountManagement;

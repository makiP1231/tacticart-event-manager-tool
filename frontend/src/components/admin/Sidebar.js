import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // useAuthフックをインポート
import '../../css/admin/Dashboard.css'; 

function Sidebar() {
    const navigate = useNavigate();
    const { user } = useAuth(); // userオブジェクトを取得

    const handleLogout = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin-logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // クロスオリジンでのクッキー送信を許可
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Logout successful:', data);
                navigate(data.redirect); // ログアウト後は管理者ログインページにリダイレクト
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="sidebar">
            <h3>管理者メニュー</h3>
            <ul>
                <li><Link to="/admin-dashboard/artists">アーティスト</Link>
                    <ul>
                        <li><Link to="/admin-dashboard/artists/register">アーティスト登録</Link></li>
                        <li><Link to="/admin-dashboard/artists/list">アーティスト一覧</Link></li>
                        <li><Link to="/admin-dashboard/artists/group">グループ設定</Link></li>
                    </ul>
                </li>
                <li><Link to="/admin-dashboard/events">イベント</Link>
                    <ul>
                        <li><Link to="/admin-dashboard/events/register">イベント登録</Link></li>
                        <li><Link to="/admin-dashboard/events">イベント一覧</Link></li>
                    </ul>
                </li>
                <li><Link to="/admin-dashboard/messages">メッセージ</Link></li>
                <li><Link to="/admin-dashboard/casting">キャスティング</Link>
                    <ul>
                        <li><Link to="/admin-dashboard/casting/hold">仮押さえ</Link></li>
                        <li><Link to="/admin-dashboard/casting/contract">本契約</Link></li>
                    </ul>
                </li>
                <li><Link to="/admin-dashboard/profile-edit">プロフィール編集</Link></li>
                {user && user.role === 'admin' && (
                    <li><Link to="/admin-dashboard/admin-setup">管理者の追加</Link></li>
                )}
                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>ログアウト</li>
            </ul>
        </div>
    );
}

export default Sidebar;

// Sidebar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';  // AuthContextからuseAuthをインポート

function Sidebar() {
    const navigate = useNavigate();
    const { user } = useAuth();  // useAuthを使用してセッション情報を取得

    const handleLogout = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin-logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                navigate(data.redirect);
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-label">アーティスト管理</div>
            <ul>
                <li className="sidebar-item"><Link to="/admin-dashboard/artists/register">アーティスト登録</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/artists/list">アーティスト一覧</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/artists/group">グループ設定</Link></li>
            </ul>

            <div className="sidebar-label">イベント管理</div>
            <ul>
                <li className="sidebar-item"><Link to="/admin-dashboard/events/register">イベント登録</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/events">イベント一覧</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/venues/register">会場登録</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/venues">会場一覧</Link></li>
            </ul>

            <div className="sidebar-label">メッセージ</div>
            <ul>
              <li className="sidebar-item"><Link to="/admin-dashboard/messages">個別メッセージ</Link></li>
            </ul>

            <div className="sidebar-label">キャスティング</div>
            <ul>
                <li className="sidebar-item"><Link to="/admin-dashboard/casting/hold">仮押さえ申請</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/casting/history">仮押さえ履歴</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/contract/form">本契約申請</Link></li>
                <li className="sidebar-item"><Link to="/admin-dashboard/contract/history">本契約履歴</Link></li>
            </ul>

            <div className="sidebar-label">システム設定</div>
            <ul>
                <li className="sidebar-item"><Link to="/admin-dashboard/profile-edit">プロフィール編集</Link></li>
                {user && user.userType === 'admin' && user.permissions === 'admin' && (
                <div>
                    <ul>
                        <li className="sidebar-item"><Link to="/admin-dashboard/account-management">アカウント管理</Link></li>
                    </ul>
                </div>
            )}
            </ul>

            <li className="sidebar-item logout" onClick={handleLogout}>ログアウト</li>
        </div>
    );
}

export default Sidebar;

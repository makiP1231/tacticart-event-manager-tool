import React from 'react';
import Sidebar from './Sidebar'; // Sidebarのパスを更新
import '../../css/admin/Dashboard.css'; // CSSファイルのパスを更新

function AdminDashboard() {
    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="content">
                <h1>管理者ダッシュボード</h1>
                {/* コンテンツがここに入ります */}
            </div>
        </div>
    );
}

export default AdminDashboard;

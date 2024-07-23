import React from 'react';
import ArtistSidebar from './ArtistSidebar'; // ArtistSidebarのインポート
import '../../css/artist/ArtistDashboard.css'; // CSSのインポート

function ArtistDashboard() {
    return (
        <div className="artist-dashboard">
            <ArtistSidebar />
            <div className="artist-content">
                <h1>アーティストダッシュボード</h1>
                <p>ここにアーティストのアクティビティや情報を表示します。</p>
            </div>
        </div>
    );
}

export default ArtistDashboard;

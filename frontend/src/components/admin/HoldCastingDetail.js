// HoldCastingDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ReactDOM from 'react-dom';
import '../../css/admin/HoldCastingDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

const HoldCastingDetail = () => {
    const { holdCastingId } = useParams();  
    const navigate = useNavigate();
    const [holdCastingDetails, setHoldCastingDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCancelPopup, setShowCancelPopup] = useState(false);

    useEffect(() => {
        fetchHoldCastingDetails();
    }, [holdCastingId]);

    const fetchHoldCastingDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/hold-casting-detail/${holdCastingId}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setHoldCastingDetails(data);
                setLoading(false);
            } else {
                setError('Failed to fetch hold casting details.');
                setLoading(false);
            }
        } catch (error) {
            setError('An error occurred while fetching hold casting details.');
            setLoading(false);
        }
    };

    const handleMessageClick = () => {
        if (holdCastingDetails && holdCastingDetails.artist_id) {
            sessionStorage.setItem('selectedArtistId', holdCastingDetails.artist_id);
            sessionStorage.setItem('selectedArtistName', holdCastingDetails.artist_name);
            navigate('/admin-dashboard/messages');
        } else {
            console.error('No artist_id found in holdCastingDetails');
        }
    };

    const confirmCancel = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/cancel-hold-casting`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ holdCastingId, artistId: holdCastingDetails.artist_id })
            });
            if (response.ok) {
                setShowCancelPopup(false);
                alert('仮押さえ申請がキャンセルされました。');
                navigate(-1);
            } else {
                alert('キャンセルに失敗しました。');
            }
        } catch (error) {
            console.error('Error cancelling hold casting:', error);
            alert('キャンセル処理中にエラーが発生しました。');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!holdCastingDetails) {
        return <div>No details available for this hold casting.</div>;
    }

    // ここで response_deadline をデストラクチャリングで取得
    const {
        event_name,
        performance_type,
        artist_name,
        status,
        fee,
        message,
        individual_message,
        event_dates,
        subject,
        created_at,
        response_deadline,  // 追加
        artist_id
    } = holdCastingDetails;

    const translateStatus = (status) => {
        switch (status) {
          case 'pending':
            return { label: '回答待ち', className: 'status-pending' };
          case 'approved':
            return { label: '参加可能', className: 'status-approved' };
          case 'rejected':
            return { label: '参加不可', className: 'status-rejected' };
          case 'cancelled':
            return { label: '停止', className: 'status-cancelled' };
          case 'waiting_contract':
            return { label: '契約待ち', className: 'status-waiting-contract' };
          case 'contracted':
            return { label: '契約済み', className: 'status-contracted' };
          case 'expired':
            return { label: '期限切れ', className: 'status-expired' };
          default:
            return { label: status, className: '' };
        }
      };
      

    const statusLabel = translateStatus(status);

    // 送信日時は秒を含まない形式で表示
    const formattedCreatedAt = new Date(created_at).toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // response_deadline があれば、月/日の形式で表示（例: 8/15）
    const formattedDeadline = response_deadline
        ? (() => {
              const d = new Date(response_deadline);
              return `${d.getMonth() + 1}/${d.getDate()}`;
          })()
        : '未設定';

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="hold-casting-detail-container">
                <h1>仮押さえ詳細</h1>
                <div className="hold-casting-detail">
                    <h2>イベント名: {event_name} {performance_type && `(${performance_type})`}</h2>
                    <p>件名: {subject}</p>
                    <p>送信日時: {formattedCreatedAt} (募集期限: {formattedDeadline})</p>
                    <p>アーティスト名: {artist_name}</p>
                    <p>ステータス: <span className={`status-badge ${statusLabel.className}`}>{statusLabel.label}</span></p>
                    <p>報酬: {fee === 0 || fee === null || fee === undefined ? '未設定' : `${fee}円`}</p>
                    <p>メッセージ:</p>
                    <div className="message-content-box">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{message || 'なし'}</p>
                    </div>
                    <p>個別メッセージ:</p>
                    <div className="message-content-box">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{individual_message || 'なし'}</p>
                    </div>
                    <p>仮押さえ日程:</p>
                    <ul>
                        {event_dates.map((dateObj, index) => (
                            <li key={index}>
                              {new Date(dateObj.hold_date).toLocaleDateString('ja-JP')} - {dateObj.note}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="action-buttons">
                    <button onClick={() => navigate(-1)} className="back-button">戻る</button>
                    {status === 'approved' && (
                        <button 
                            className="contract-button"
                            onClick={() => navigate(`/admin-dashboard/contract/form/${holdCastingId}`)}
                        >
                            本契約
                        </button>                    
                    )}
                    {status === 'pending' && (  
                        <button className="cancel-button" onClick={() => setShowCancelPopup(true)}>仮押さえ申請をキャンセル</button>
                    )}
                    <button className="message-button" onClick={handleMessageClick}>メッセージ</button>
                </div>
            </div>

            {showCancelPopup && ReactDOM.createPortal(
                <div className="popup-background" onClick={() => setShowCancelPopup(false)}>
                    <div className="confirmation-popup" onClick={e => e.stopPropagation()}>
                        <h3>確認</h3>
                        <p>この仮押さえ申請をキャンセルしますか？</p>
                        <button className="confirm-button" onClick={confirmCancel}>はい、キャンセルします</button>
                        <button className="cancel-button" onClick={() => setShowCancelPopup(false)}>いいえ</button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default HoldCastingDetail;

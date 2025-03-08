// ArtistContractDetail.js
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ArtistSidebar from './ArtistSidebar';
import '../../css/artist/ArtistContractDetail.css';


const API_URL = process.env.REACT_APP_API_URL;

// 改行を <br /> に変換して表示するヘルパー（値が無い場合は空欄）
function renderMultilineText(text) {
  if (!text) return '';
  return text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));
}

const ArtistContractDetail = () => {
  const { contractArtistId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [venueLink, setVenueLink] = useState(null);

  const [showAgreeModal, setShowAgreeModal] = useState(false);
  const [showDisagreeModal, setShowDisagreeModal] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [disagreeReason, setDisagreeReason] = useState('');
  const [recontractRequest, setRecontractRequest] = useState('yes'); // "yes" or "no"

  // 本契約詳細を取得
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/artist/contract-detail/${contractArtistId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || '契約詳細の取得に失敗しました。');
        }
        setDetail(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();

  }, [contractArtistId]);

  // detail が更新されたときに会場名をチェックしてリンクを設定する
  useEffect(() => {
    if (detail && detail.contractArtist && detail.contractArtist.venue) {
      fetchVenueNames(detail.contractArtist.venue);
    }
  }, [detail]);
  

  // 日付フォーマット（YYYY/MM/DD）
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // 時刻フォーマット（HH:MM）
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

// ステータスの日本語マッピング
const translateStatus = (status) => {
    switch (status) {
      case 'pending':
        return { label: '確認待ち', className: 'status-pending' };
      case 'counterproposal':
        return { label: '再契約提案', className: 'status-pending' };
      case 'agreed':
        return { label: '契約済み', className: 'status-agreed' };
      case 'disagreed':
        return { label: '非同意', className: 'status-disagreed' };
      case 'cancelled':
        return { label: '取り消し', className: 'status-cancelled' };
      default:
        return { label: status, className: '' };
    }
  };
  
  

  const fetchVenueNames = async (venueName) => {
    try {
      const response = await fetch(`${API_URL}/api/venues/names`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const matched = data.venues.find(v => v.name === venueName);
      if (matched) {
        setVenueLink(`/artist-dashboard/venue/${matched.id}`);
      } else {
        setVenueLink(null);
      }
    } catch (error) {
      console.error('Error fetching venue names:', error);
    }
  };

  // 契約への回答（同意/非同意）を送信
  const handleResponse = async (responseStatus, responseReason = '', recontractReq = null) => {
    const payload = {
      contractArtistId,  // URLパラメータやstateから取得済みの契約ID
      status: responseStatus,
    };

    if (responseStatus === 'disagreed') {
      payload.response_reason = responseReason;
      payload.recontract_request = recontractReq;
    }

    try {
      const res = await fetch(`${API_URL}/api/artist/respond-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || '回答の送信に失敗しました。');
      }
      // ステータス更新
      setDetail(prev => ({
        ...prev,
        contractArtist: { ...prev.contractArtist, status: responseStatus },
      }));
    } catch (err) {
      alert(err.message);
    }
  };


  if (loading) {
    return (
      <div className="artist-dashboard">
        <ArtistSidebar />
        <div className="artist-contract-detail-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="artist-dashboard">
        <ArtistSidebar />
        <div className="artist-contract-detail-container">
          <p className="error">Error: {error}</p>
        </div>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="artist-dashboard">
        <ArtistSidebar />
        <div className="artist-contract-detail-container">
          <p>契約詳細情報が見つかりません。</p>
        </div>
      </div>
    );
  }

  // detail の中身を展開
  const { contractArtist, event, schedule } = detail;
  const statusObj = translateStatus(contractArtist.status);

  // イベント名 + performance_type（performance_typeがあれば末尾にスペース＋文字列）
  const eventNameWithType = event.performance_type
    ? `${event.event_name || ''} ${event.performance_type}`
    : (event.event_name || '');

  // イベント日時（例: 2025/03/10 (開場: 14:00, 開演: 14:30)）
  const eventDateString = event.event_date
    ? `${formatDate(event.event_date)} (開場: ${formatTime(event.open_time)}, 開演: ${formatTime(event.start_time)})`
    : '';

  // オプションは selected_options 配列をスペース区切りで表示
  const optionString = event.selected_options && event.selected_options.length > 0
    ? event.selected_options.join(', ')
    : '';

  return (
    <div className="artist-dashboard">
      <ArtistSidebar />
      <div className="artist-contract-detail-container">
        {/* タイトルとステータスバッジを横並びに */}
        <div className="contract-title">
          <h1>出演契約</h1>
          <span className={`status-badge ${statusObj.className}`}>
            {statusObj.label}
          </span>
        </div>

        {/* ブロック1: イベント基本情報（イベント名、日時、会場） */}
        <div className="contract-block block-1">
          <table>
            <tbody>
              <tr>
                <th>イベント名</th>
                <td>
                  <Link to={`/artist-dashboard/event/${contractArtist.event_uuid}`} className="event-link">
                    {eventNameWithType}
                  </Link>
                </td>
              </tr>
              <tr>
                <th>イベント日時</th>
                <td>{eventDateString}</td>
              </tr>
              <tr>
                <th>会場</th>
                <td>
                    {venueLink ? (
                      <a href={venueLink}>{contractArtist.venue}</a>
                    ) : (
                        contractArtist.venue
                    )}
                </td>
              </tr>
              <tr>
                <th>リハーサル会場</th>
                <td>{contractArtist.rehearsal_venue || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ブロック2: 依頼料・スケジュール */}
        <div className="contract-block block-2">
          <table>
            <tbody>
              <tr>
                <th>依頼料</th>
                <td>{parseInt(contractArtist.fee, 10).toLocaleString()}円（税込み）</td>
              </tr>
              <tr>
                <th>振込情報</th>
                <td>
                  {contractArtist.transfer_info
                    ? renderMultilineText(contractArtist.transfer_info)
                    : ''}
                </td>
              </tr>
              {Array.isArray(schedule) && schedule.length > 0 && schedule.map((sch, idx) => {
                const scheduleDate = formatDate(sch.schedule_date);
                const scheduleTime = sch.start_time ? `${formatTime(sch.start_time)}～${formatTime(sch.end_time)}` : '';
                return (
                  <tr key={idx}>
                    <th>{`スケジュール${idx + 1}`}</th>
                    <td>{scheduleDate} {sch.note || ''} {scheduleTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ブロック3: 契約内容関連（プログラム、出演者、オプション、振込情報、キャンセルポリシー、備考、現場担当者/連絡先） */}
        <div className="contract-block block-3">
          <table>
            <tbody>
              <tr>
                <th>プログラム</th>
                <td>{event.program ? renderMultilineText(event.program) : ''}</td>
              </tr>
              <tr>
                <th>出演者</th>
                <td>
                  {event.casts && event.casts.length > 0
                    ? event.casts.map((cast, index) => (
                        <div key={index}>
                          {cast.cast_role}: {cast.cast_name}
                        </div>
                      ))
                    : ''}
                </td>
              </tr>
              <tr>
                <th>オプション</th>
                <td>{optionString}</td>
              </tr>
              <tr>
                <th>コンテンツ利用について</th>
                <td>
                    {contractArtist.additional_usage_clause
                    ? renderMultilineText(contractArtist.additional_usage_clause)
                    : ''}
                </td>
              </tr>
              <tr>
                <th>キャンセルポリシー</th>
                <td>
                  {contractArtist.cancel_policy
                    ? renderMultilineText(contractArtist.cancel_policy)
                    : ''}
                </td>
              </tr>
              <tr>
                <th>備考</th>
                <td>
                  {contractArtist.remarks
                    ? renderMultilineText(contractArtist.remarks)
                    : ''}
                </td>
              </tr>
              <tr>
                <th>現場担当者/連絡先</th>
                <td>
                  {contractArtist.contact_person || ''} / {contractArtist.contact || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {contractArtist.status === 'pending' && (
        <div className="response-buttons">
            <button 
            className="response-button agree" 
            onClick={() => setShowAgreeModal(true)}
            >
            同意する
            </button>
            <button 
            className="response-button disagree" 
            onClick={() => setShowDisagreeModal(true)}
            >
            同意しない
            </button>
        </div>
        )}



        <div className="back-button-container">
          <button className="back-button" onClick={() => navigate(-1)}>
            戻る
          </button>
        </div>
      </div>
      {showAgreeModal && (
        <div
            className="contract-agree-modal-overlay"
            onClick={() => {
            setShowAgreeModal(false);
            setAgreeChecked(false);
            }}
        >
            <div className="contract-agree-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="contract-modal-title">契約内容の確認</h2>
            <label className="contract-modal-label">
                <input 
                type="checkbox" 
                checked={agreeChecked} 
                onChange={(e) => setAgreeChecked(e.target.checked)} 
                />
                契約内容を確認しました
            </label>
            <div className="contract-modal-button-container">
                <button
                className="modal-submit-button"
                onClick={() => {
                    if (agreeChecked) {
                    handleResponse('agreed');
                    setShowAgreeModal(false);
                    setAgreeChecked(false);
                    } else {
                    alert("チェックボックスにチェックを入れてください。");
                    }
                }}
                >
                同意を送信
                </button>
                <button 
                className="modal-cancel-button" 
                onClick={() => setShowAgreeModal(false)}
                >
                キャンセル
                </button>
            </div>
            </div>
        </div>
        )}

        {showDisagreeModal && (
        <div
            className="contract-disagree-modal-overlay"
            onClick={() => {
            setShowDisagreeModal(false);
            setDisagreeReason('');
            setRecontractRequest('yes');
            }}
        >
            <div className="contract-disagree-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="contract-modal-title">契約に同意しない理由の入力</h2>
            <textarea 
                className="contract-disagree-textarea"
                placeholder="同意しない理由を記入してください"
                value={disagreeReason}
                onChange={(e) => setDisagreeReason(e.target.value)}
            />
            <label className="contract-modal-label">
                この問題が解決したら再契約を希望しますか？
                <select 
                className="contract-disagree-select"
                value={recontractRequest} 
                onChange={(e) => setRecontractRequest(e.target.value)}
                >
                <option value="yes">はい</option>
                <option value="no">いいえ</option>
                </select>
            </label>
            <div className="contract-modal-button-container">
                <button
                className="modal-submit-button"
                onClick={() => {
                    if (!disagreeReason.trim()) {
                    alert("理由を入力してください。");
                    return;
                    }
                    const recontractBool = recontractRequest === 'yes';
                    handleResponse('disagreed', disagreeReason, recontractBool);
                    setShowDisagreeModal(false);
                    setDisagreeReason('');
                    setRecontractRequest('yes');
                }}
                >
                回答を送信
                </button>
                <button 
                className="modal-cancel-button" 
                onClick={() => setShowDisagreeModal(false)}
                >
                キャンセル
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default ArtistContractDetail;

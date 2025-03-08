// ContractDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ContractDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

const ContractDetail = () => {
  const { contractArtistId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // パート情報を保持するステート
  const [partsData, setPartsData] = useState([]);

  // ページトップへスクロールする
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // ステータスを日本語に変換するヘルパー
  const translateStatus = (status) => {
    switch (status) {
      case 'pending':       
        return { label: '送信済み', className: 'status-sent' };
      case 'counterproposal':       
        return { label: '再契約提案', className: 'status-sent' };
      case 'cancelled':  
        return { label: '取り消し', className: 'status-cancelled' };
      case 'agreed':     
        return { label: '同意', className: 'status-agreed' };
      case 'disagreed':  
        return { label: '非同意', className: 'status-disagreed' };
      default:           
        return { label: status, className: '' };
    }
  };

  // 日付を "YYYY-MM-DD" 形式で表示する
  const formatDate = (isoString) => {
    if (!isoString) return '未設定';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '未設定';
    return d.toISOString().slice(0, 10);
  };

  // 時刻から秒を除去 ("HH:MM" 形式)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  // アーティストのパート配列を label 化して返す
  const parseArtistParts = (artistParts) => {
    let arr = [];
    if (typeof artistParts === 'string') {
      try {
        arr = JSON.parse(artistParts);
      } catch (e) {
        console.error('Error parsing artist parts:', e);
        arr = [];
      }
    } else if (Array.isArray(artistParts)) {
      arr = artistParts;
    }
    const labels = arr.map((pValue) => {
      const found = partsData.find((pd) => pd.value === pValue);
      return found ? found.label : pValue;
    });
    return labels.join(' / ');
  };

  // 1) パート情報を取得
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/parts`);
        if (!res.ok) throw new Error('Failed to fetch parts');
        const data = await res.json();
        setPartsData(data);
      } catch (err) {
        console.error('Error fetching parts:', err);
      }
    };
    fetchParts();
  }, []);

  // 2) 本契約詳細を取得
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/contract-detail/${contractArtistId}`, {
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

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="contract-detail-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="contract-detail-content">
          <p className="error">Error: {error}</p>
        </div>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="contract-detail-content">
          <p>契約詳細情報が見つかりません。</p>
        </div>
      </div>
    );
  }

  // detail = { contractArtist, contract, schedule, contractArtists, contractResponse }
  const { contractArtist, contract, schedule, contractArtists, contractResponse } = detail;
  const statusObj = translateStatus(contractArtist.status);

  // メインアーティストのパートを label 化
  const mainArtistPartsLabel = parseArtistParts(contractArtist.artist_parts);

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="contract-detail-content">
        {/* ヘッダー：タイトルと右側にステータス表示 */}
        <div className="contract-detail-header">
          <h1>本契約詳細</h1>
          <div className="status-display">
            <span className={`status-badge ${statusObj.className}`}>{statusObj.label}</span>
          </div>
        </div>

        {/* 1) アーティスト情報 */}
        <div className="section artist-section">
          <div className="table-responsive">
            <table>
              <tbody>
                <tr>
                  <th>アーティスト名</th>
                  <td>{contractArtist.artist_name}</td>
                </tr>
                <tr>
                  <th>パート</th>
                  <td>{mainArtistPartsLabel || '未設定'}</td>
                </tr>
                <tr>
                  <th>依頼料</th>
                  <td>{parseInt(contractArtist.fee, 10)}円(税込み)</td>
                </tr>
                <tr>
                  <th>メール</th>
                  <td>{contractArtist.email || '未登録'}</td>
                </tr>
                <tr>
                  <th>電話番号</th>
                  <td>{contractArtist.phone || '未登録'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2) 本契約・イベント情報 */}
        <div className="section contract-section">
          <div className="table-responsive">
            <table>
              <tbody>
                <tr>
                  <th>契約ID</th>
                  <td>{contract.contract_id}</td>
                </tr>
                <tr>
                  <th>イベント名</th>
                  <td>{contract.event_name}</td>
                </tr>
                <tr>
                  <th>イベント日時</th>
                  <td>
                    {formatDate(contract.event_date) || '未設定'}
                    {' (開場: '}
                    {formatTime(contract.open_time) || '未設定'}
                    {', 開演: '}
                    {formatTime(contract.start_time) || '未設定'}
                    {')'}
                  </td>
                </tr>
                <tr>
                  <th>会場</th>
                  <td>{contract.venue || '未設定'}</td>
                </tr>
                <tr>
                  <th>リハーサル会場</th>
                  <td>{contract.rehearsal_venue || '未設定'}</td>
                </tr>
                <tr>
                  <th>オプション</th>
                  <td>
                    {contract.options && contract.options.length > 0
                      ? contract.options.join(' / ')
                      : 'なし'}
                  </td>
                </tr>
                <tr>
                  <th>振込情報</th>
                  <td>{contract.transfer_info}</td>
                </tr>
                <tr>
                  <th>コンテンツ2次利用について</th>
                  <td>{contract.additional_usage_clause || '未設定'}</td>
                </tr>
                <tr>
                  <th>キャンセルポリシー</th>
                  <td>{contract.cancel_policy}</td>
                </tr>
                <tr>
                  <th>備考</th>
                  <td>{contract.remarks}</td>
                </tr>
                <tr>
                  <th>現場担当者 / 連絡先</th>
                  <td>
                    {contract.contact_person || '未設定'} / {contract.contact || '未設定'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3) スケジュール */}
        <div className="section schedule-section">
          <h2>スケジュール</h2>
          {schedule && schedule.length > 0 ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>内容</th>
                    <th>開始</th>
                    <th>終了</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((sch, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(sch.schedule_date)}</td>
                      <td>{sch.note || ''}</td>
                      <td>{formatTime(sch.start_time)}</td>
                      <td>{formatTime(sch.end_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>スケジュール情報はありません。</p>
          )}
        </div>

        {/* 4) その他の契約アーティスト */}
        <div className="section other-artists-section">
          <h2>その他の契約アーティスト</h2>
          {contractArtists && contractArtists.length > 0 ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>アーティスト名</th>
                    <th>パート</th>
                    <th>報酬</th>
                    <th>ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {contractArtists.map((ca) => {
                    const st = translateStatus(ca.status);
                    let label = parseArtistParts(ca.artist_parts);
                    return (
                      <tr
                        key={ca.contract_artist_id}
                        className="clickable-row"
                        onClick={() => {
                          navigate(`/admin-dashboard/contract/detail/${ca.contract_artist_id}`);
                          scrollToTop();
                        }}
                      >
                        <td>{ca.artist_name}</td>
                        <td>{label || '未設定'}</td>
                        <td>{parseInt(ca.fee, 10)}円</td>
                        <td>
                          <span className={`status-badge ${st.className}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>その他の契約アーティストはありません。</p>
          )}
        </div>

        {/* 5) 非同意の場合、非同意の理由・再契約希望の情報を表示 */}
        {contractArtist.status === 'disagreed' && (
          <div className="section disagree-info-section">
            <h2>非同意情報</h2>
            <div className="table-responsive">
              <table>
                <tbody>
                  <tr>
                    <th>非同意の理由</th>
                    <td>{contractResponse ? contractResponse.response_reason : '未入力'}</td>
                  </tr>
                  <tr>
                    <th>再契約を希望するか</th>
                    <td>
                      {contractResponse
                        ? contractResponse.recontract_request
                          ? '希望する'
                          : '希望しない'
                        : '未入力'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          className="back-button"
          onClick={() => navigate('/admin-dashboard/contract/history')}
        >
          本契約履歴
        </button>
      </div>
    </div>
  );
};

export default ContractDetail;

// ContractConfirm.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ContractConfirm.css';

const API_URL = process.env.REACT_APP_API_URL;

const ContractConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  useEffect(() => {
    // ローカルストレージの送信済みフラグを取得
    const submittedFlag = localStorage.getItem('contractSubmitted');
    // stateが存在しない、または送信済みフラグがある場合はフォームへリダイレクト
    if (!state || submittedFlag === 'true') {
      navigate('/admin-dashboard/contract/form', { replace: true });
    }
  }, [state, navigate]);


  // stateが無い場合はフォームへ戻す
  if (!state) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="confirm-error">
          <p>契約情報がありません。先に本契約フォームを入力してください。</p>
          <button onClick={() => navigate('/admin-dashboard/contract/form')}>
            本契約フォームへ
          </button>
        </div>
      </div>
    );
  }

  // ContractFormから渡されたpayload
  const { event_uuid, additionalInfo, selectedArtists } = state;

  // イベント詳細をAPIから取得するためのstate
  const [eventInfo, setEventInfo] = useState(null);
  // パート情報を取得するためのstate
  const [parts, setParts] = useState([]);
  // バリデーションエラー用
  const [formErrors, setFormErrors] = useState([]);

  // イベント詳細取得（イベントIDから）
  useEffect(() => {
    if (!event_uuid) return;
    fetch(`${API_URL}/api/events/${event_uuid}`)
      .then((res) => {
        if (!res.ok) throw new Error('イベント情報の取得に失敗しました。');
        return res.json();
      })
      .then((data) => {
        const e = data.event;
        // selected_options が配列でない場合はパース
        let opts = e.selected_options;
        if (!Array.isArray(opts)) {
          try {
            opts = JSON.parse(opts || '[]');
          } catch (err) {
            opts = [];
          }
        }
        e.selected_options = opts || [];
        setEventInfo(e);
      })
      .catch((err) => {
        console.error(err);
        setEventInfo(null);
      });
  }, [event_uuid]);

  // パート情報の取得（ショートネーム用）
  useEffect(() => {
    fetch(`${API_URL}/api/parts`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.sort_order - b.sort_order);
        setParts(sorted);
      })
      .catch((err) => console.error('Error fetching parts:', err));
  }, []);

  // ヘルパー：アーティストのパートのショートネームを取得
  const getShortName = (artist) => {
    if (!artist.parts) return '';
    let aParts = artist.parts;
    if (typeof aParts === 'string') {
      try {
        aParts = JSON.parse(aParts);
      } catch (e) {
        aParts = [];
      }
    }
    if (!Array.isArray(aParts) || aParts.length === 0) return '';
    const partValue = aParts[0];
    const matched = parts.find((p) => p.value === partValue);
    return matched ? matched.short_name : '';
  };

  // 時刻のフォーマット（秒を除去）
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hh, mm] = timeStr.split(':');
    return `${hh}:${mm}`;
  };

  // フォーム必須項目のチェック
  const validate = () => {
    const errors = [];
    if (!additionalInfo.schedule || additionalInfo.schedule.length === 0) {
      errors.push('スケジュールを最低1件は入力してください。');
    } else {
      additionalInfo.schedule.forEach((item, idx) => {
        if (!item.date) errors.push(`スケジュール${idx + 1}の日付が未入力です。`);
        if (!item.note) errors.push(`スケジュール${idx + 1}の内容が未入力です。`);
        if (!item.startTime) errors.push(`スケジュール${idx + 1}の開始時刻が未入力です。`);
        if (!item.endTime) errors.push(`スケジュール${idx + 1}の終了時刻が未入力です。`);
      });
    }
    if (!additionalInfo.venue?.trim()) {
      errors.push('会場を入力してください。');
    }
    if (!additionalInfo.transfer_info?.trim()) {
      errors.push('振込についてを入力してください。');
    }
    if (!additionalInfo.cancel_policy?.trim()) {
      errors.push('キャンセルポリシーを入力してください。');
    }
    return errors;
  };

  // 送信ボタン押下時の処理
  const handleFinalSubmit = async () => {
    const errors = validate();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/admin/submit-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_uuid,
          additionalInfo,
          selectedArtists, // 各アーティストオブジェクトに holdCastingArtistId も含む
        }),
      });
      if (!response.ok) {
        throw new Error('サーバーへの契約送信に失敗しました。');
      }
      navigate('/admin-dashboard/contract/success');
    } catch (error) {
      alert(`送信エラー: ${error.message}`);
    }
  };

  // 表示するイベント情報（APIから取得できた場合はそちら、なければadditionalInfoの値を利用）
  const displayEvent = eventInfo || {
    name: additionalInfo.event_name || '',
    venue: additionalInfo.venue || '',
    rehearsal_venue: additionalInfo.rehearsal_venue || '',
    open_time: additionalInfo.open_time,
    start_time: additionalInfo.start_time,
    program: additionalInfo.program || '',
    selected_options: additionalInfo.eventOptions || [],
    casts: additionalInfo.casts || [], // 出演者情報（イベント側）
    event_date: additionalInfo.event_date || null,
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="contractconfirm-container-unique">
        <h1>本契約内容の確認</h1>

        {/* エラー表示 */}
        {formErrors.length > 0 && (
          <div className="form-error-box">
            <ul>
              {formErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ① アーティスト情報 */}
        <section className="confirm-section">
          <h2>アーティスト情報</h2>
          {selectedArtists && selectedArtists.length > 0 ? (
            <table className="confirm-table">
              <thead>
                <tr>
                  <th>アーティスト名</th>
                  <th>依頼料金(税込み)</th>
                  <th>仮オファー申請ID</th>
                </tr>
              </thead>
              <tbody>
                {selectedArtists.map((artist) => (
                  <tr key={artist.artist_id}>
                    <td>
                      {artist.parts && artist.parts.length > 0
                        ? `${getShortName(artist)}：${artist.name}`
                        : artist.name}
                      {artist.isApproved && (
                        <span className="approved-badge">仮承認</span>
                      )}
                    </td>
                    <td>{artist.fee} 円</td>
                    <td>{artist.holdCastingArtistId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>アーティスト情報がありません。</p>
          )}
        </section>

        {/* ② イベント情報 */}
        <section className="confirm-section">
          <h2>イベント情報</h2>
          <table className="confirm-table">
            <tbody>
              <tr>
                <th>イベント名</th>
                <td>{displayEvent.name}</td>
              </tr>
              <tr>
                <th>会場</th>
                <td>
                  {additionalInfo.venue}
                </td>
              </tr>
              <tr>
                <th>リハーサル会場</th>
                <td>{additionalInfo.rehearsal_venue || ''}</td>
              </tr>
              {displayEvent.event_date && (
                <tr>
                  <th>本番日</th>
                  <td>{displayEvent.event_date.split('T')[0]}</td>
                </tr>
              )}
              <tr>
                <th>開場・開演時間</th>
                <td>
                  {formatTime(displayEvent.open_time)} / {formatTime(displayEvent.start_time)}
                </td>
              </tr>
              <tr>
                <th>出演者</th>
                <td>
                  {displayEvent.casts && displayEvent.casts.length > 0 ? (
                    displayEvent.casts.map((cast, i) => (
                      <span key={i} className="plain-text">
                        {cast.cast_role}：{cast.cast_name}{i < displayEvent.casts.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  ) : (
                    ''
                  )}
                </td>
              </tr>
              <tr>
                <th>プログラム</th>
                <td>{displayEvent.program || ''}</td>
              </tr>
              <tr>
                <th>オプション</th>
                <td>
                  {Array.isArray(displayEvent.selected_options) && displayEvent.selected_options.length > 0 ? (
                    <div className="confirm-badge-container">
                      {displayEvent.selected_options.map((opt, idx) => (
                        <span key={idx} className="confirm-badge">{opt}</span>
                      ))}
                    </div>
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ③ その他の情報 */}
        <section className="confirm-section">
          <table className="confirm-table">
            <tbody>
              <tr>
                <th>振込について</th>
                <td>{additionalInfo.transfer_info || ''}</td>
              </tr>
              <tr>
                <th>キャンセルポリシー</th>
                <td>{additionalInfo.cancel_policy || ''}</td>
              </tr>
              <tr>
                <th>備考</th>
                <td>{additionalInfo.remarks || ''}</td>
              </tr>
              <tr>
                <th>2次コンテンツ利用について</th>
                <td>{additionalInfo.additional_usage_clause || ''}</td>
              </tr>
              <tr>
                <th>現場担当者</th>
                <td>{additionalInfo.contact_person || ''}</td>
              </tr>
              <tr>
                <th>当日連絡先</th>
                <td>{additionalInfo.contact || ''}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="confirm-actions">
          <button onClick={() => navigate('/admin-dashboard/contract/form', { state })}>修正する</button>
          <button onClick={handleFinalSubmit}>この内容で送信</button>
        </div>
      </div>
    </div>
  );
};

export default ContractConfirm;

import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import '../../css/admin/HoldCastingHistory.css';

const API_URL = process.env.REACT_APP_API_URL;

function HoldCastingHistory() {
  const [holdRequests, setHoldRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [partsData, setPartsData] = useState([]);

  // フィルター用ステート
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limitExceeded, setLimitExceeded] = useState(false);

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const navigate = useNavigate();

  // 初回: パート情報取得 & 未開催の仮押さえ履歴取得
  useEffect(() => {
    fetchParts();
    fetchUpcomingHoldRequests();
  }, []);

  // =============== バックエンドからパート一覧を取得 ===============
  const fetchParts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/parts`);
      if (!res.ok) throw new Error('Failed to fetch parts');
      const data = await res.json();
      setPartsData(data);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  // =============== 未開催の仮押さえ履歴を取得 ===============
  const fetchUpcomingHoldRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/hold-requests/upcoming`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // limitExceededはfalse
      setLimitExceeded(false);

      // holdRequestsにセット
      setHoldRequests(data.holdRequests);

      // イベント名 + performance_type をまとめた文字列を重複排除
      const uniqueEvents = [
        ...new Set(
          data.holdRequests.map((r) =>
            `${r.event_name} ${r.performance_type || ''}`.trim()
          )
        ),
      ];
      setEventOptions(uniqueEvents);

      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch upcoming hold requests:', error);
    }
  };

  // =============== 期間指定で仮押さえ履歴を取得 (最大1000件) ===============
  const fetchHoldRequestsByPeriod = async (queryParams) => {
    try {
        const url = `${API_URL}/api/admin/hold-requests/period?${queryParams}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        setHoldRequests(data.holdRequests);
        setLimitExceeded(data.holdRequests.length === 1000);

        const uniqueEvents = [
            ...new Set(
                data.holdRequests.map((r) =>
                    `${r.event_name} ${r.performance_type || ''}`.trim()
                )
            ),
        ];
        setEventOptions(uniqueEvents);
        setCurrentPage(1);
    } catch (error) {
        console.error('Failed to fetch hold requests by period:', error);
    }
};

  // =============== 期間絞り込みボタン ===============
  const handlePeriodFilter = () => {
    if (!startDate && !endDate) {
        fetchUpcomingHoldRequests(); // どちらも未入力なら未開催のみ取得
    } else {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("start_date", startDate);
        if (endDate) queryParams.append("end_date", endDate);

        fetchHoldRequestsByPeriod(queryParams.toString());
    }
};

  // =============== アーティストのパート名を日本語に変換 ===============
  const getMainPartLabel = useCallback(
    (partsArray) => {
      if (!partsArray) return '未設定';
      let arr = [];
      try {
        arr = typeof partsArray === 'string' ? JSON.parse(partsArray) : partsArray;
      } catch (err) {
        console.error('Error parsing parts:', err);
      }
      if (!Array.isArray(arr) || arr.length === 0) return '未設定';

      const partValue = arr[0];
      const matched = partsData.find((p) => p.value === partValue);
      return matched ? matched.label : '未設定';
    },
    [partsData]
  );

  // =============== ステータスを日本語表示 ===============
  const translateStatus = (status) => {
    switch (status) {
      case 'pending':
        return { label: '回答待ち', className: 'status-pending' };
      case 'approved':
        return { label: '参加可能', className: 'status-approved' };
      case 'rejected':
        return { label: '参加不可', className: 'status-rejected' };
      case 'cancelled':
        return { label: 'キャンセル', className: 'status-cancelled' };
      case 'waiting_contract':
        return { label: '契約待ち', className: 'status-waiting-contract' };
      case 'contracted':
        return { label: '契約済み', className: 'status-contracted' };
      case 'contract_sent':
        return { label: '契約送信済み', className: 'status-contract-sent' };
      case 'expired':
        return { label: '期限切れ', className: 'status-expired' };
      default:
        return { label: status, className: '' };
    }
  };

  // =============== ローカルフィルタ ===============
  useEffect(() => {
    let filtered = [...holdRequests];

    // イベントフィルタ
    if (selectedEvent) {
      filtered = filtered.filter((r) => {
        const combined = `${r.event_name} ${r.performance_type || ''}`.trim();
        return combined === selectedEvent;
      });
    }
    // ステータスフィルタ
    if (selectedStatus) {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }
    // パートフィルタ
    if (selectedPart) {
      filtered = filtered.filter((r) => getMainPartLabel(r.parts) === selectedPart);
    }
    // アーティスト名検索
    if (artistSearch) {
      const lowerSearch = artistSearch.toLowerCase();
      filtered = filtered.filter((r) => r.artist_name.toLowerCase().includes(lowerSearch));
    }

    // 日付並び順 (hc.created_at: 文字列→Date)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredRequests(filtered);
    setCurrentPage(1); // フィルタ変更時は1ページ目に戻す
  }, [
    holdRequests,
    selectedEvent,
    selectedStatus,
    selectedPart,
    artistSearch,
    sortOrder,
    getMainPartLabel,
  ]);

  // =============== イベントハンドラ ===============
  const handleEventChange = (e) => setSelectedEvent(e.target.value);
  const handleStatusChange = (e) => setSelectedStatus(e.target.value);
  const handlePartChange = (e) => setSelectedPart(e.target.value);
  const handleArtistSearchChange = (e) => setArtistSearch(e.target.value);
  const handleSortOrderChange = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  // =============== テーブル行クリック ===============
  const handleRowClick = (requestId) => {
    navigate(`/admin/hold-casting-detail/${requestId}`);
  };

  // ページネーション
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const currentItems = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="hold-casting-history-container">
        <h1>仮押さえ申請履歴</h1>

        {/* フィルターUI */}
        <div className="filter-container">
          {/* 1行目: イベント / ステータス / パート / アーティスト名 */}
          <div className="filter-row">
            <select value={selectedEvent} onChange={handleEventChange}>
              <option value="">全てのイベント</option>
              {eventOptions.map((ev, idx) => (
                <option key={idx} value={ev}>
                  {ev}
                </option>
              ))}
            </select>

            <select value={selectedStatus} onChange={handleStatusChange}>
              <option value="">全てのステータス</option>
              <option value="pending">回答待ち</option>
              <option value="approved">参加可能</option>
              <option value="rejected">参加不可</option>
              <option value="cancelled">キャンセル</option>
              <option value="expired">期限切れ</option>
              <option value="contract_sent">契約送信済み</option>
            </select>

            <select value={selectedPart} onChange={handlePartChange}>
              <option value="">全てのパート</option>
              {partsData.map((part) => (
                <option key={part.value} value={part.label}>
                  {part.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="アーティスト名検索"
              value={artistSearch}
              onChange={handleArtistSearchChange}
            />
          </div>

          {/* 2行目: 期間選択 & 絞り込み */}
          <div className="filter-row date-row">
            <div className="date-filter-inputs">
              <input type="date" value={startDate} onChange={handleStartDateChange} />
              <span>～</span>
              <input type="date" value={endDate} onChange={handleEndDateChange} />
            </div>
            <button className="filter-btn" onClick={handlePeriodFilter}>
              期間検索
            </button>
          </div>
        </div>

        {/* limitExceeded の通知 */}
        {limitExceeded && (
          <div className="limit-notice">
            ※表示件数が1000件を超えたため、終了日から1000件前までのデータを取得しています。
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>
                申請日時(募集期限)
                <button onClick={handleSortOrderChange} className="sort-toggle-btn">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </th>
              <th>イベント名</th>
              <th>アーティスト名(パート)</th>
              <th>ステータス</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((r, i) => {
              const statusObj = translateStatus(r.status);
              const createdAt = new Date(r.created_at).toLocaleString('ja-JP', { 
                year: 'numeric', 
                month: 'numeric', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              // response_deadline が存在する場合、月と日を "M/D" 形式で表示
              const deadline = r.response_deadline
                ? (() => {
                    const d = new Date(r.response_deadline);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  })()
                : '未設定';
              return (
                <tr
                  key={i}
                  onClick={() => handleRowClick(r.hold_casting_artist_id)}
                  className="clickable-row"
                >
                  <td>{createdAt} (~{deadline})</td>
                  <td>{`${r.event_name} ${r.performance_type || ''}`.trim()}</td>
                  <td>{r.artist_name}({getMainPartLabel(r.parts)})</td>
                  <td>
                    <span className={`status-badge ${statusObj.className}`}>
                      {statusObj.label}
                    </span>
                  </td>
                  <td
                    className="action-buttons"
                    onClick={(e) => e.stopPropagation()} // 行クリックとバッティング防止
                  >
                    {r.status === 'approved' && (
                      <button
                        onClick={() =>
                          navigate(
                            `/admin-dashboard/contract/form/${r.hold_casting_artist_id}?event_uuid=${r.event_uuid}`
                          )
                        }
                      >
                        本契約
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>


        {/* ページネーション */}
        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
            |&lt;
          </button>
          <button onClick={prevPage} disabled={currentPage === 1}>
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => goToPage(i + 1)}
              className={currentPage === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={nextPage} disabled={currentPage === totalPages}>
            &gt;
          </button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
            &gt;|
          </button>
        </div>
      </div>
    </div>
  );
}

export default HoldCastingHistory;

import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import '../../css/admin/ContractHistory.css';

const API_URL = process.env.REACT_APP_API_URL;

const ContractHistory = () => {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [partsData, setPartsData] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [artistSearch, setArtistSearch] = useState('');

  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limitExceeded, setLimitExceeded] = useState(false);

  const itemsPerPage = 30;
  const navigate = useNavigate();

  // =============== 初期処理 ===============
  useEffect(() => {
    fetchParts();
    fetchUpcomingContracts();
  }, []);

  // =============== パート情報取得 ===============
  const fetchParts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/parts`);
      if (!response.ok) throw new Error('Failed to fetch parts');
      const data = await response.json();
      setPartsData(data);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  // =============== 未開催イベントの契約履歴取得 ===============
  const fetchUpcomingContracts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/contracts/upcoming`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      setContracts(data.contracts);
      setLimitExceeded(false);

      // 「イベント名 + performance_type」をまとめた文字列を用意
      const uniqueEvents = [
        ...new Set(
          data.contracts.map((c) => {
            const combined = `${c.event_name} ${c.performance_type || ''}`.trim();
            return combined;
          })
        ),
      ];
      setEventOptions(uniqueEvents);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch upcoming contract history:', error.message);
    }
  };

  // =============== 期間指定で契約履歴取得（最大1000件） ===============
  const fetchContractsByPeriod = async (queryParams) => {
    try {
        const url = `${API_URL}/api/admin/contracts/period?${queryParams}`;
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        setContracts(data.contracts);
        setLimitExceeded(data.contracts.length === 1000);
        
        const uniqueEvents = [
            ...new Set(
                data.contracts.map((c) => {
                    const combined = `${c.event_name} ${c.performance_type || ''}`.trim();
                    return combined;
                })
            ),
        ];
        setEventOptions(uniqueEvents);
        setCurrentPage(1);
    } catch (error) {
        console.error('Failed to fetch contract history by period:', error.message);
    }
};


  // =============== 絞り込みボタン ===============
  const handlePeriodFilter = () => {
    if (!startDate && !endDate) {
        fetchUpcomingContracts(); // どちらも未入力なら未開催のみ取得
    } else {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("start_date", startDate);
        if (endDate) queryParams.append("end_date", endDate);

        fetchContractsByPeriod(queryParams.toString());
    }
};


  // =============== ヘルパー：パート名取得 ===============
  const getArtistPart = useCallback((artistParts) => {
    if (!artistParts) return '未設定';
    let partsArray = [];
    try {
      partsArray = typeof artistParts === 'string' ? JSON.parse(artistParts) : artistParts;
    } catch (error) {
      console.error('Error parsing artist parts:', error);
    }
    if (!Array.isArray(partsArray) || partsArray.length === 0) return '未設定';
    const partValue = partsArray[0];
    const matchedPart = partsData.find((p) => p.value === partValue);
    return matchedPart ? matchedPart.label : '未設定';
  }, [partsData]);

  // =============== ヘルパー：日付フォーマット ===============
  const formatDate = (dateString) => {
    if (!dateString) return '未設定';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '未設定' : date.toLocaleString();
  };

  // =============== ローカルフィルタ適用 ===============
  const applyLocalFilters = useCallback(() => {
    let filtered = [...contracts];

    // イベント
    if (selectedEvent) {
      filtered = filtered.filter((c) => {
        const combined = `${c.event_name} ${c.performance_type || ''}`.trim();
        return combined === selectedEvent; 
      });
    }

    // ステータス
    if (selectedStatus) {
      filtered = filtered.filter((c) => c.status === selectedStatus);
    }

    // パート
    if (selectedPart) {
      filtered = filtered.filter((c) => getArtistPart(c.parts) === selectedPart);
    }

    // アーティスト名
    if (artistSearch) {
      const lowerSearch = artistSearch.toLowerCase();
      filtered = filtered.filter((c) => c.artist_name.toLowerCase().includes(lowerSearch));
    }

    // 並び順
    filtered.sort((a, b) => {
      const dateA = new Date(a.sent_at);
      const dateB = new Date(b.sent_at);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredContracts(filtered);
  }, [contracts, selectedEvent, selectedStatus, selectedPart, artistSearch, sortOrder, getArtistPart]);

  // フィルタ再適用
  useEffect(() => {
    applyLocalFilters();
  }, [applyLocalFilters]);

  // =============== 各種ハンドラ ===============
  const handleEventChange = (e) => setSelectedEvent(e.target.value);
  const handleStatusChange = (e) => setSelectedStatus(e.target.value);
  const handlePartChange = (e) => setSelectedPart(e.target.value);
  const handleArtistSearchChange = (e) => setArtistSearch(e.target.value);
  const handleSortOrderChange = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  // 行クリック
  const handleRowClick = (contractArtistId) => {
    navigate(`/admin-dashboard/contract/detail/${contractArtistId}`);
  };

  // ページネーション
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const currentContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="contract-history-container">
        <h1>本契約履歴</h1>

        <div className="filter-container">
          {/* ---------- 1行目: イベント / ステータス / パート / アーティスト名検索 ---------- */}
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
              <option value="pending">送信済み</option>
              <option value="counterproposal">再契約提案</option>
              <option value="cancelled">取り消し</option>
              <option value="agreed">契約済み</option>
              <option value="disagreed">非同意</option>
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

          {/* ---------- 2行目: 期間選択ラベル / 開始日 / 終了日 / 絞り込みボタン ---------- */}
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

        {limitExceeded && (
          <div className="limit-notice">
            ※表示件数が1000件を超えたため、終了日から1000件前までのデータを取得しています。
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>
                送付日時{' '}
                <button onClick={handleSortOrderChange} className="sort-toggle-btn">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </th>
              <th>イベント名</th>
              <th>アーティスト名(パート)</th>
              <th>ステータス</th>
            </tr>
          </thead>
            <tbody>
            {currentContracts.map((c, i) => {
                const sentedAt = new Date(c.sent_at).toLocaleString('ja-JP', { 
                    year: 'numeric', 
                    month: 'numeric', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const statusObj = (() => {
                switch (c.status) {
                    case 'pending':       return { label: '送信済み', className: 'status-sent' };
                    case 'counterproposal':       return { label: '再契約提案', className: 'status-sent' };
                    case 'cancelled':  return { label: '取り消し', className: 'status-cancelled' };
                    case 'agreed':     return { label: '同意', className: 'status-agreed' };
                    case 'disagreed':  return { label: '非同意', className: 'status-disagreed' };
                    default:           return { label: c.status, className: '' };
                }
                })();

                return (
                <tr
                    key={i}
                    onClick={() => handleRowClick(c.contract_artist_id)} 
                    className="clickable-row"
                >
                    <td>{sentedAt}</td>
                    <td>{c.event_name}</td>
                    <td>{c.artist_name}({getArtistPart(c.parts)})</td>
                    <td>
                    <span className={`status-badge ${statusObj.className}`}>
                        {statusObj.label}
                    </span>
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
};

export default ContractHistory;

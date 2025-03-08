import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtistSidebar from './ArtistSidebar';
import '../../css/artist/ArtistContracts.css';

const API_URL = process.env.REACT_APP_API_URL;

const ArtistContractHistory = () => {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // 全件取得（上限1000件）の本契約一覧を取得（期間指定以外の場合）
  const fetchContracts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/contracts`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setContracts(data.contracts);
        applyStatusFilter(data.contracts);
      } else {
        console.error('Failed to fetch contracts:', data.message);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  // 期間指定での契約一覧取得
  const fetchContractsByPeriod = async (queryParams) => {
    try {
      const url = `${API_URL}/api/artist/contracts/period?${queryParams}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok && data.success !== false) {
        setContracts(data.contracts);
        applyStatusFilter(data.contracts);
      } else {
        console.error('Failed to fetch contracts by period:', data.message);
      }
    } catch (error) {
      console.error('Error fetching contracts by period:', error);
    }
  };

  // 初回は全件取得
  useEffect(() => {
    fetchContracts();
  }, []);

  // ローカルフィルター：ステータスのみ自動適用
  const applyStatusFilter = useCallback((contractsToFilter) => {
    let filtered = [...contractsToFilter];
    if (selectedStatus) {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }
    // イベント日程降順にソート
    filtered.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    setFilteredContracts(filtered);
    setCurrentPage(1);
  }, [selectedStatus]);

  // ステータスが変わった場合のみローカルフィルターを再適用
  useEffect(() => {
    applyStatusFilter(contracts);
  }, [selectedStatus, contracts, applyStatusFilter]);

  // 期間検索ボタン押下時のハンドラ
  const handlePeriodSearch = () => {
    if (!startDate && !endDate) {
      alert("期間を指定してください。");
      return; // 両方未設定なら何もせずリターン
    } else {
      const queryParams = new URLSearchParams();
      if (startDate) {
        queryParams.append("start_date", startDate);
      }
      if (endDate) {
        queryParams.append("end_date", endDate);
      }
      fetchContractsByPeriod(queryParams.toString());
    }
  };
  

  // ページネーションの計算
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredContracts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  // 日付フォーマット（受信日時）
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // ステータスの日本語マッピング
  const mapStatus = (status) => {
    switch(status) {
      case 'pending':
        return { label: '確認待ち', className: 'status-pending' };
      case 'counterproposal':
        return { label: '再契約', className: 'status-pending' };
      case 'cancelled':
        return { label: '取り消し', className: 'status-cancelled' };
      case 'agreed':
        return { label: '契約済み', className: 'status-agreed' };
      case 'disagreed':
        return { label: '非同意', className: 'status-disagreed' };
      default:
        return { label: status, className: '' };
    }
  };

  return (
    <div className="artist-dashboard">
      <ArtistSidebar />
      <div className="artist-contract-history-container">
        <h1>本契約一覧</h1>
        <div className="filter-container">
          <div className="filter-row">
            <label>ステータス:</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">すべて</option>
              <option value="pending">確認待ち</option>
              <option value="cancelled">取り消し</option>
              <option value="agreed">契約済み</option>
              <option value="disagreed">非同意</option>
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span>～</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button className="filter-btn" onClick={handlePeriodSearch}>
              期間検索
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>受信日時</th>
              <th>イベント名</th>
              <th>日程</th>
              <th>会場</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((contract, i) => {
              const receivedAt = formatDate(contract.contract_received_at);
              const statusObj = mapStatus(contract.status);
              return (
                <tr key={i} onClick={() => navigate(`/artist-dashboard/contract/detail/${contract.contract_artist_id}`)} className="clickable-row">
                  <td>{receivedAt}</td>
                  <td>{contract.event_name}  {contract.performance_type}</td>
                  <td>{contract.event_date ? new Date(contract.event_date).toLocaleDateString('ja-JP') : '未設定'}</td>
                  <td>{contract.event_venue || '未設定'}</td>
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
        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1}>|&lt;</button>
          <button onClick={prevPage} disabled={currentPage === 1}>&lt;</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => goToPage(i + 1)}
              className={currentPage === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={nextPage} disabled={currentPage === totalPages}>&gt;</button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>&gt;|</button>
        </div>
      </div>
    </div>
  );
};

export default ArtistContractHistory;

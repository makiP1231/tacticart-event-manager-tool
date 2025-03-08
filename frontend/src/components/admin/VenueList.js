import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/VenueList.css';
import { prefectures, regionMapping, regionOptions } from '../../utils/prefectures';

function VenueList() {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // フィルタ用 state
  const [region, setRegion] = useState('');          // エリア
  const [prefecture, setPrefecture] = useState('');    // 都道府県
  const [capacityRange, setCapacityRange] = useState('');  // キャパ区分
  const [searchName, setSearchName] = useState('');    // 会場名検索

  const navigate = useNavigate();



  // 選択されたエリアに応じた都道府県オプションを返す関数
  const getPrefectureOptions = () => {
    if (!region) {
      return [{ label: '都道府県選択', value: '' }, ...prefectures];
    } else {
      const prefList = regionMapping[region] || [];
      return [{ label: '都道府県選択', value: '' }, ...prefList.map(p => ({ label: p, value: p }))];
    }
  };

  // キャパフィルタ区分例
  const capacityOptions = [
    { label: 'キャパ選択', value: '' },
    { label: '100席未満', value: 'under100' },
    { label: '100席以上300席未満', value: '100to300' },
    { label: '300席以上500席未満', value: '300to500' },
    { label: '500席以上1000席未満', value: '500to1000' },
    { label: '1000席以上', value: '1000over' }
  ];

  // 1) 会場情報の取得
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/venuelist`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch venues');
        }
        const data = await response.json();
        setVenues(data.venues);
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    };
    fetchVenues();
  }, []);

  // 2) フィルタ条件の変更で filteredVenues を更新
  const filterVenues = useCallback(() => {
    let temp = [...venues];

    if (region) {
      temp = temp.filter(venue => {
        // 選択されたエリアに含まれる都道府県でフィルタ
        return regionMapping[region].includes(venue.prefecture);
      });
    }

    if (prefecture) {
      temp = temp.filter(venue => venue.prefecture === prefecture);
    }

    if (capacityRange) {
      temp = temp.filter(venue => {
        const cap = venue.capacity || 0;
        switch (capacityRange) {
          case 'under100':
            return cap < 100;
          case '100to300':
            return cap >= 100 && cap < 300;
          case '300to500':
            return cap >= 300 && cap < 500;
          case '500to1000':
            return cap >= 500 && cap < 1000;
          case '1000over':
            return cap >= 1000;
          default:
            return true;
        }
      });
    }

    if (searchName.trim()) {
      temp = temp.filter(venue => venue.name.includes(searchName.trim()));
    }

    setFilteredVenues(temp);
    setCurrentPage(1);
  }, [venues, region, prefecture, capacityRange, searchName]);

  useEffect(() => {
    filterVenues();
  }, [filterVenues]);

  // ページネーション
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVenues.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVenues.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 行クリックで詳細ページへ遷移
  const handleRowClick = (venueId) => {
    navigate(`/admin-dashboard/venues/${venueId}`);
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="venue-list-container">
        <h1>会場一覧</h1>
        <div className="filter-container">
          <div className="filter-row">
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setPrefecture(''); }}
            >
              {regionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
            >
              {getPrefectureOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={capacityRange}
              onChange={(e) => setCapacityRange(e.target.value)}
            >
              {capacityOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="会場名検索"
            />
          </div>
        </div>

        <table className="venue-table">
          <thead>
            <tr>
              <th>会場名</th>
              <th>住所</th>
              <th>キャパ</th>
              <th>HP URL</th>
              <th>電話番号</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(venue => {
              const fullAddress = `${venue.prefecture || ''}${venue.city || ''}${venue.address || ''}`;
              return (
                <tr key={venue.id} onClick={() => handleRowClick(venue.id)} className="clickable-row">
                  <td>{venue.name}</td>
                  <td>{fullAddress}</td>
                  <td>{venue.capacity || '-'}</td>
                  <td>
                    {venue.website_link ? (
                      <a 
                        href={venue.website_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {venue.website_link}
                      </a>
                    ) : '-'}
                  </td>
                  <td>{venue.phone || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
            |&lt;
          </button>
          <button onClick={() => currentPage > 1 && goToPage(currentPage - 1)} disabled={currentPage === 1}>
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button 
              key={pageNum} 
              onClick={() => goToPage(pageNum)}
              className={currentPage === pageNum ? 'active' : ''}
            >
              {pageNum}
            </button>
          ))}
          <button onClick={() => currentPage < totalPages && goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
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

export default VenueList;

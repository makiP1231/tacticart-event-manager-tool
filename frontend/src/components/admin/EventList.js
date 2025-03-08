import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventList.css';
import { prefectures, regionMapping, regionOptions } from '../../utils/prefectures';

// プレースホルダー画像の配列
const placeholderImages = [
  'noimagepic1.jpg',
  'noimagepic2.jpg',
  'noimagepic3.jpg',
  'noimagepic4.jpg',
  'noimagepic5.jpg',
  'noimagepic6.jpg',
  'noimagepic7.jpg',
  'noimagepic8.jpg',
  'noimagepic9.jpg',
  'noimagepic10.jpg',
  'noimagepic11.jpg',
  'noimagepic12.jpg',
  'noimagepic13.jpg',
  'noimagepic14.jpg',
  'noimagepic15.jpg',
  'noimagepic16.jpg',
  'noimagepic17.jpg',
  'noimagepic18.jpg'
];

const getRandomPlaceholder = () => {
  const randomIndex = Math.floor(Math.random() * placeholderImages.length);
  return placeholderImages[randomIndex];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, options);
};

// 簡易Cookie操作用関数
const setCookie = (name, value, days = 30) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
};

// ScrollableText Component: Only scrolls on hover if the text overflows.
const ScrollableText = ({ text, className }) => {
  const containerRef = useRef(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      setIsOverflow(container.scrollWidth > container.clientWidth);
    }
  }, [text]);

  const handleMouseEnter = () => {
    if (!isOverflow) return;
    const container = containerRef.current;
    const distance = container.scrollWidth - container.clientWidth;
    const duration = distance * 0.03; // 調整可能なスクロール速度
    container.style.transition = `transform ${duration}s linear`;
    container.style.transform = `translateX(-${distance}px)`;
  };

  const handleMouseLeave = () => {
    const container = containerRef.current;
    container.style.transition = 'transform 0.3s linear';
    container.style.transform = 'translateX(0)';
  };

  return (
    <div className={`scrollable-text ${className}`} style={{ overflow: 'hidden' }}>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ whiteSpace: 'nowrap' }}
      >
        {text}
      </div>
    </div>
  );
};

function EventList() {
  // APIで取得した全イベント（フィルタ前の元データ）
  const [allFetchedEvents, setAllFetchedEvents] = useState([]);
  // 現在表示中のイベント
  const [events, setEvents] = useState([]);
  const [flyerUrls, setFlyerUrls] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [genres, setGenres] = useState([]);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL;
  const FLYER_IMAGE_PATH = process.env.REACT_APP_FLYER_IMAGE_PATH;

  // ---------- 検索用 state ----------
  const [allPast, setAllPast] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  // 詳細検索モーダル用 state
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [filterEventName, setFilterEventName] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState('');
  const [filterVenues, setFilterVenues] = useState([]); // 会場名（文字列）の配列
  const [showVenueFilterPopup, setShowVenueFilterPopup] = useState(false);
  const [allVenues, setAllVenues] = useState([]);

  // ---------- 新規追加：会場フィルターモーダル専用 state ----------
  const [venueFilterSearch, setVenueFilterSearch] = useState('');
  const [venueFilterPrefecture, setVenueFilterPrefecture] = useState('');

  // ---------- 降順／昇順切替 state ----------
  const [sortOrder, setSortOrder] = useState('asc'); // "asc" または "desc"

  // ---------- イベント一覧取得 ----------
  const fetchEvents = async () => {
    try {
      let endpoint = '';
      const params = new URLSearchParams();
      if (allPast) {
        endpoint = `${API_URL}/api/events/all`;
      } else if (filterStartDate || filterEndDate) {
        endpoint = `${API_URL}/api/events/filter-by-date`;
        if (filterStartDate) params.append('startDate', filterStartDate);
        if (filterEndDate) params.append('endDate', filterEndDate);
      } else {
        endpoint = `${API_URL}/api/events/upcoming`;
      }
      let finalEndpoint = endpoint;
      if (params.toString()) {
        finalEndpoint += `?${params.toString()}`;
      }
      const response = await fetch(finalEndpoint, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      const data = await response.json();
      setAllFetchedEvents(data.events);
      // 詳細検索条件が設定されている場合はフィルタ適用後にソート
      let filtered;
      if (
        filterEventName.trim() ||
        filterGenre ||
        filterRegion ||
        filterPrefecture ||
        filterVenues.length > 0 ||
        filterStartDate ||
        filterEndDate
      ) {
        filtered = [...data.events];
        if (filterEventName.trim()) {
          const keywords = filterEventName.trim().toLowerCase().split(/\s+/);
          filtered = filtered.filter(event =>
            keywords.every(kw =>
              (event.name && event.name.toLowerCase().includes(kw)) ||
              (event.genre && event.genre.toLowerCase().includes(kw)) ||
              (event.venue && event.venue.toLowerCase().includes(kw)) ||
              (event.prefecture && event.prefecture.toLowerCase().includes(kw)) ||
              (event.event_overview && event.event_overview.toLowerCase().includes(kw))
            )
          );
        }
        if (filterGenre) {
          filtered = filtered.filter(event => event.genre === filterGenre);
        }
        if (filterRegion) {
          const regionPrefectures = regionMapping[filterRegion] || [];
          filtered = filtered.filter(event => regionPrefectures.includes(event.prefecture));
        }
        if (filterPrefecture) {
          filtered = filtered.filter(event => event.prefecture === filterPrefecture);
        }
        if (filterVenues.length > 0) {
          filtered = filtered.filter(event => filterVenues.includes(event.venue));
        }
        if (filterStartDate) {
          filtered = filtered.filter(event => event.event_date >= filterStartDate);
        }
        if (filterEndDate) {
          filtered = filtered.filter(event => event.event_date <= filterEndDate);
        }
      } else {
        filtered = data.events;
      }
      // ソート処理：日付が未設定のイベントは常に最後にする
      filtered.sort((a, b) => {
        if (!a.event_date && !b.event_date) return 0;
        if (!a.event_date) return 1; // aのイベント日が未設定なら後ろに
        if (!b.event_date) return -1; // bのイベント日が未設定なら後ろに
        const dateA = new Date(a.event_date);
        const dateB = new Date(b.event_date);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
      setEvents(filtered);
      const urls = await generateFlyerUrls(filtered);
      setFlyerUrls(urls);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_URL}/api/genres`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Failed to fetch genres (${response.status})`);
      }
      const data = await response.json();
      setGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  useEffect(() => {
    const allPastCookie = getCookie('allPast');
    setAllPast(allPastCookie === 'true');
    fetchEvents();
    fetchGenres();
  }, [API_URL, sortOrder]);

  useEffect(() => {
    const newCurrentEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    setCurrentEvents(newCurrentEvents);
  }, [currentPage, events, itemsPerPage]);

  const generateFlyerUrls = async (events) => {
    const urls = {};
    for (const event of events) {
      if (
        event.performance_flag === 'additional' &&
        event.use_existing_flyers &&
        event.original_event_uuid
      ) {
        try {
          const response = await fetch(`${API_URL}/api/events/${event.original_event_uuid}`, { credentials: 'include' });
          if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
          }
          const data = await response.json();
          urls[event.event_uuid] = data.event.flyer_front_url
            ? `${API_URL}${FLYER_IMAGE_PATH}${data.event.flyer_front_url}`
            : `${API_URL}/images/placeholders/${getRandomPlaceholder()}`;
        } catch (error) {
          console.error('Error fetching original event flyer:', error);
          urls[event.event_uuid] = event.flyer_front_url
            ? `${API_URL}${FLYER_IMAGE_PATH}${event.flyer_front_url}`
            : `${API_URL}/images/placeholders/${getRandomPlaceholder()}`;
        }
      } else {
        urls[event.event_uuid] = event.flyer_front_url
          ? `${API_URL}${FLYER_IMAGE_PATH}${event.flyer_front_url}`
          : `${API_URL}/images/placeholders/${getRandomPlaceholder()}`;
      }
    }
    return urls;
  };

  const translateGenre = (genre) => {
    const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
    return genreData ? genreData.label : genre;
  };

  const getGenreColor = (genre) => {
    const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
    return genreData ? genreData.color : '#007bff';
  };

  const totalPages = Math.ceil(events.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(currentPage - 4, 1);
    const endPage = Math.min(currentPage + 4, totalPages);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const [currentFlyerIndex, setCurrentFlyerIndex] = useState(0);
  const getCurrentFlyerUrl = () => {
    const flyerArray = [flyerUrls.front, flyerUrls.back].filter(url => url !== null);
    if (flyerArray.length === 0) return null;
    return flyerArray[currentFlyerIndex % flyerArray.length];
  };

  // ---------- 詳細検索ポップアップ用 ----------
  const openSearchPopup = () => {
    fetchAllVenues();
    setShowSearchPopup(true);
  };

  const closeSearchPopup = () => {
    setShowSearchPopup(false);
  };

  const fetchAllVenues = async () => {
    try {
      const response = await fetch(`${API_URL}/api/venuelist`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch all venues');
      }
      const data = await response.json();
      setAllVenues(data.venues);
    } catch (error) {
      console.error('Error fetching all venues:', error);
    }
  };

  const toggleVenueSelection = (venue) => {
    if (filterVenues.includes(venue.name)) {
      setFilterVenues(filterVenues.filter(v => v !== venue.name));
    } else {
      setFilterVenues([...filterVenues, venue.name]);
    }
  };

  // ---------- ローカル詳細フィルタリング ----------
  const applyDetailedFilter = () => {
    let filtered = [...allFetchedEvents];
    if (filterEventName.trim()) {
      const keywords = filterEventName.trim().toLowerCase().split(/\s+/);
      filtered = filtered.filter(event =>
        keywords.every(kw =>
          (event.name && event.name.toLowerCase().includes(kw)) ||
          (event.genre && event.genre.toLowerCase().includes(kw)) ||
          (event.venue && event.venue.toLowerCase().includes(kw)) ||
          (event.prefecture && event.prefecture.toLowerCase().includes(kw)) ||
          (event.event_overview && event.event_overview.toLowerCase().includes(kw))
        )
      );
    }
    if (filterGenre) {
      filtered = filtered.filter(event => event.genre === filterGenre);
    }
    if (filterRegion) {
      const regionPrefectures = regionMapping[filterRegion] || [];
      filtered = filtered.filter(event => regionPrefectures.includes(event.prefecture));
    }
    if (filterPrefecture) {
      filtered = filtered.filter(event => event.prefecture === filterPrefecture);
    }
    if (filterVenues.length > 0) {
      filtered = filtered.filter(event => filterVenues.includes(event.venue));
    }
    if (filterStartDate) {
      filtered = filtered.filter(event => event.event_date >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(event => event.event_date <= filterEndDate);
    }
    // ソート処理：日付が未設定のイベントは常に最後にする
    filtered.sort((a, b) => {
      if (!a.event_date && !b.event_date) return 0;
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setEvents(filtered);
    generateFlyerUrls(filtered).then(urls => setFlyerUrls(urls));
    setCurrentPage(1);
  };

  // キーワード入力フィールドは onBlur でフィルタリング発火
  const handleKeywordBlur = () => {
    applyDetailedFilter();
  };

  useEffect(() => {
    applyDetailedFilter();
  }, [filterGenre, filterRegion, filterPrefecture, filterVenues, filterStartDate, filterEndDate, sortOrder]);

  // Cookie更新とイベント再取得
  useEffect(() => {
    setCookie('allPast', allPast);
    fetchEvents();
  }, [allPast]);

  // 降順／昇順切替ボタンの処理
  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="event-list-container">
        <h1>イベント一覧</h1>
        {/* 直接表示する検索コントロール */}
        <div className="direct-search-controls">
          <div className="search-date-range">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
            <span>〜</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
            <button className="search-date-range-btn" onClick={fetchEvents}>
              期間指定
            </button>
          </div>
          <div className="search-checkbox">
            <label>
              <input
                type="checkbox"
                checked={allPast}
                onChange={(e) => {
                  setAllPast(e.target.checked);
                  setCookie('allPast', e.target.checked);
                }}
              />
              過去のイベントもすべて表示
            </label>
          </div>
          {/* 並び順切替ボタン */}
          <button className="sort-toggle-btn" onClick={toggleSortOrder}>
            並び順: {sortOrder === 'asc' ? '昇順' : '降順'}
          </button>
          <button onClick={() => openSearchPopup()} className="filter-button">
            詳細検索
          </button>
        </div>
        {/* 詳細検索モーダル */}
        {showSearchPopup && (
          <div className="search-popup-overlay" onClick={() => setShowSearchPopup(false)}>
            <div className="search-popup" onClick={(e) => e.stopPropagation()}>
              <h2>詳細絞り込み</h2>
              <div className="search-field">
                <label>キーワード：</label>
                <input
                  type="text"
                  value={filterEventName}
                  onChange={(e) => setFilterEventName(e.target.value)}
                  onBlur={handleKeywordBlur}
                />
              </div>
              <div className="search-field">
                <label>ジャンル：</label>
                <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                  <option value="">全て</option>
                  {genres.map(genre => (
                    <option key={genre.value} value={genre.value}>
                      {genre.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="search-field">
                <label>地域エリア：</label>
                <select
                  value={filterRegion}
                  onChange={(e) => { setFilterRegion(e.target.value); setFilterPrefecture(''); }}
                >
                  {regionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="search-field">
                <label>都道府県：</label>
                <select value={filterPrefecture} onChange={(e) => setFilterPrefecture(e.target.value)}>
                  {(
                    filterRegion
                      ? [{ label: '都道府県選択', value: '' }, ...regionMapping[filterRegion].map(p => ({ label: p, value: p }))]
                      : [{ label: '都道府県選択', value: '' }, ...prefectures]
                  ).map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="search-field venue-search-field">
                <div className="venue-top-row">
                  <label>会場：</label>
                  <button className="venue-select-btn" onClick={() => setShowVenueFilterPopup(true)} style={{ width: '100%' }}>
                    会場を選択
                  </button>
                </div>
                {filterVenues.length > 0 && (
                  <div className="selected-venues-list">
                    {filterVenues.map((v, i) => (
                      <div key={i} className="selected-venue-item">
                        {v}
                        <button onClick={() => setFilterVenues(filterVenues.filter(val => val !== v))}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="search-field buttons">
                <button className="close-btn" onClick={() => setShowSearchPopup(false)}>
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 会場フィルターモーダル：シンプルなリスト表示 */}
        {showVenueFilterPopup && (
          <div className="venue-filter-popup-overlay" onClick={() => setShowVenueFilterPopup(false)}>
            <div className="venue-filter-popup" onClick={(e) => e.stopPropagation()}>
              <div className="venue-filter-controls" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="会場名検索"
                  value={venueFilterSearch}
                  onChange={(e) => setVenueFilterSearch(e.target.value)}
                />
                <select value={venueFilterPrefecture} onChange={(e) => setVenueFilterPrefecture(e.target.value)}>
                  <option value="">都道府県選択</option>
                  {prefectures.map(pref => (
                    <option key={pref.value} value={pref.value}>
                      {pref.label}
                    </option>
                  ))}
                </select>
                <button onClick={() => { setVenueFilterSearch(''); setVenueFilterPrefecture(''); }}>
                  リセット
                </button>
              </div>
              <div className="venue-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {allVenues
                  .filter(venue => {
                    return (
                      venue.name.toLowerCase().includes(venueFilterSearch.toLowerCase()) &&
                      (venueFilterPrefecture ? venue.prefecture === venueFilterPrefecture : true)
                    );
                  })
                  .map(venue => (
                    <div
                      key={venue.id}
                      className={`venue-list-item ${filterVenues.includes(venue.name) ? 'selected' : ''}`}
                      onClick={() => toggleVenueSelection(venue)}
                      style={{ padding: '8px', cursor: 'pointer' }}
                    >
                      {venue.name} - {venue.prefecture}
                    </div>
                  ))}
              </div>
              <button
                className="venue-filter-close-btn"
                onClick={() => setShowVenueFilterPopup(false)}
                style={{
                  backgroundColor: '#333',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  marginTop: '10px',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}
        {/* イベントカード表示 */}
        <div className="event-list">
          {currentEvents.map(event => (
            <div
              key={event.event_uuid}
              className="event-card"
              onClick={() => navigate(`/admin-dashboard/events/event-details/${event.event_uuid}`)}
            >
              <p className="genre" style={{ backgroundColor: getGenreColor(event.genre) }}>
                {translateGenre(event.genre)}
              </p>
              <img
                src={flyerUrls[event.event_uuid] || `${API_URL}/images/placeholders/${getRandomPlaceholder()}`}
                alt="フライヤー表"
                className="event-image"
              />
              {/* イベント名と公演名を2段に分ける */}
              <div className="event-card-text">
                <ScrollableText text={event.name} className="event-card-name" />
                {event.performance_type && (
                  <ScrollableText text={event.performance_type} className="event-card-performance" />
                )}
              </div>
              {/* 下部固定の時間表示コンテナ */}
              <div className="time-container">
                {event.event_date && <p className="event-date">{formatDate(event.event_date)}</p>}
                {event.start_time && <p className="event-start-time">{event.start_time.slice(0, 5)}</p>}
              </div>
            </div>
          ))}
        </div>
        {/* ページネーション */}
        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
            &laquo;
          </button>
          <button onClick={() => currentPage > 1 && goToPage(currentPage - 1)} disabled={currentPage === 1}>
            &lsaquo;
          </button>
          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={currentPage === pageNum ? 'active' : ''}
            >
              {pageNum}
            </button>
          ))}
          <button onClick={() => currentPage < totalPages && goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            &rsaquo;
          </button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventList;

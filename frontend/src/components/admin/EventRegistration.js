import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventRegistration.css';
import { prefectures } from '../../utils/prefectures';

function EventRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    genre: '',
    customGenre: '',
    event_date: '',
    open_time: '',
    start_time: '',
    organizer: 'Tacticart',
    customOrganizer: '',
    operator: 'Tacticart',
    customOperator: '',
    flyerFront: null,
    flyerBack: null,
    isExistingEvent: false,
    useExistingFlyers: false,
    additionalDates: [],
    program: '',
    event_overview: '',
    ticket_info: '',
    selectedOptions: [],
    casts: [],
    venue: '',
    // 新規追加：開催都道府県
    prefecture: '',
    original_event_uuid: '',
    performance_flag: 'single',
    // 新規追加：会場が自動入力されたかどうか
    isVenueAuto: false
  });

  const [genres, setGenres] = useState([]);
  const [existingEvents, setExistingEvents] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  // 会場選択モーダル用
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venues, setVenues] = useState([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPrefecture, setModalPrefecture] = useState('');
  const [filteredModalVenues, setFilteredModalVenues] = useState([]);

  // =================== 初期データの取得 ===================
  useEffect(() => {
    fetch(`${API_URL}/api/genres`)
      .then(response => response.json())
      .then(data => setGenres(data))
      .catch(error => console.error('Error fetching genres:', error));

    fetch(`${API_URL}/api/events/first-upcoming`)
      .then(response => response.json())
      .then(data => setExistingEvents(data.events))
      .catch(error => console.error('Error fetching first-upcoming events:', error));

    fetch(`${API_URL}/api/event-options`)
      .then(response => response.json())
      .then(data => setEventOptions(data))
      .catch(error => console.error('Error fetching event options:', error));
  }, [API_URL]);

  // =================== フォーム入力ハンドラ ===================
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 追加日程操作
  const handleAdditionalDateChange = (index, key, value) => {
    const updated = [...formData.additionalDates];
    updated[index][key] = value;
    setFormData(prev => ({ ...prev, additionalDates: updated }));
  };

  const handleAddAdditionalDate = () => {
    if (
      formData.additionalDates.length === 0 ||
      (formData.additionalDates[formData.additionalDates.length - 1].date || '').trim() !== ''
    ) {
      setFormData(prev => ({
        ...prev,
        additionalDates: [...prev.additionalDates, { date: '', description: '', additional_date_title: '' }]
      }));
    }
  };

  const handleRemoveAdditionalDate = (index) => {
    const updated = formData.additionalDates.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, additionalDates: updated }));
  };

  // 出演者操作
  const handleCastChange = (index, key, value) => {
    const updated = [...formData.casts];
    updated[index][key] = value;
    setFormData(prev => ({ ...prev, casts: updated }));
  };

  const handleAddCast = () => {
    if (
      formData.casts.length === 0 ||
      (formData.casts[formData.casts.length - 1].name || '').trim() !== ''
    ) {
      setFormData(prev => ({
        ...prev,
        casts: [...prev.casts, { role: '', name: '' }]
      }));
    }
  };

  const handleRemoveCast = (index) => {
    const updated = formData.casts.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, casts: updated }));
  };

  // イベントオプションのチェック操作
  const handleOptionChange = (optionName) => {
    setFormData(prev => {
      const options = [...prev.selectedOptions];
      if (options.includes(optionName)) {
        return { ...prev, selectedOptions: options.filter(o => o !== optionName) };
      } else {
        return { ...prev, selectedOptions: [...options, optionName] };
      }
    });
  };

  // 既存イベントの切り替え
  const toggleExistingEvent = () => {
    setFormData(prev => ({
      ...prev,
      isExistingEvent: !prev.isExistingEvent,
      name: '',
      genre: '',
      venue: '',
      event_date: '',
      open_time: '',
      start_time: '',
      organizer: 'Tacticart',
      operator: 'Tacticart',
      useExistingFlyers: false,
      flyerFront: null,
      flyerBack: null,
      original_event_uuid: '',
      additionalDates: [],
      casts: [],
      event_overview: '',
      program: '',
      ticket_info: '',
      selectedOptions: [],
      prefecture: '',
      isVenueAuto: false
    }));
  };

  // 主催／運営の選択肢が "other" の場合
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    if (value === 'other') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        [`custom${name.charAt(0).toUpperCase() + name.slice(1)}`]: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 既存イベントを選択した際にイベント情報をコピー（すべての情報を引き継ぐ）
  const handleSelectEvent = async (eventUuid) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventUuid}`);
      if (!response.ok) throw new Error('Network response was not ok.');
      const data = await response.json();

      const transformAdditionalDates = data.event.additional_dates.map(d => ({
        date: d.additional_date || '',
        description: d.description || '',
        additional_date_title: d.additional_date_title || ''
      }));
      const transformCasts = data.event.casts.map(c => ({
        role: c.cast_role || '',
        name: c.cast_name || ''
      }));

      const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
      const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : '';

      setFormData(prev => ({
        ...prev,
        original_event_uuid: eventUuid,
        name: data.event.name || '',
        genre: data.event.genre || '',
        venue: data.event.venue || '',
        // 新規：都道府県情報のコピー
        prefecture: data.event.prefecture || '',
        event_date: formatDate(data.event.event_date),
        open_time: formatTime(data.event.open_time),
        start_time: formatTime(data.event.start_time),
        organizer: data.event.organizer || 'Tacticart',
        operator: data.event.operator || 'Tacticart',
        performance_flag: "additional",
        useExistingFlyers: true,
        additionalDates: transformAdditionalDates,
        casts: transformCasts,
        event_overview: data.event.event_overview || '',
        program: data.event.program || '',
        ticket_info: data.event.ticket_info || '',
        selectedOptions: data.event.selected_options ? JSON.parse(data.event.selected_options) : [],
        // 自動入力された会場情報により編集不可とする
        isVenueAuto: true
      }));
    } catch (error) {
      console.error("Failed to fetch event data:", error);
    }
  };

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (key === 'flyerFront' || key === 'flyerBack') {
        if (value) form.append(key, value);
      } else if (key === 'additionalDates' || key === 'casts' || key === 'selectedOptions') {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, value);
      }
    });

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create event');
      navigate('/admin-dashboard/events/registration-complete', { state: { event: data } });
    } catch (error) {
      console.error('Event creation failed:', error.message);
    }
  };

  // カスタムバリデーションメッセージ設定
  useEffect(() => {
    const setCustomValidationMessages = () => {
      const elements = {
        name: "イベント名を入力してください。",
        original_event_uuid: "紐づけるイベントを選択してください。",
        genre: "ジャンルを選択してください。",
        event_date: "イベント日を選択してください。",
        open_time: "開場時間を設定してください。",
        start_time: "開演時間を設定してください。",
        performance_flag: "公演区分を選択してください。"
      };
      Object.entries(elements).forEach(([key, message]) => {
        const element = document.getElementsByName(key)[0];
        if (element) {
          element.oninvalid = function() { this.setCustomValidity(message); };
          element.oninput = function() { this.setCustomValidity(''); };
        }
      });
    };
    setCustomValidationMessages();
  }, [formData.isExistingEvent]);

  // =================== 会場選択モーダル ===================
  useEffect(() => {
    const fetchModalVenues = async () => {
      try {
        const response = await fetch(`${API_URL}/api/venuelist`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch venues');
        const data = await response.json();
        setVenues(data.venues);
        setFilteredModalVenues(data.venues);
      } catch (error) {
        console.error('Error fetching modal venues:', error);
      }
    };
    if (showVenueModal) {
      fetchModalVenues();
    }
  }, [API_URL, showVenueModal]);

  useEffect(() => {
    let filtered = [...venues];
    if (modalSearch.trim()) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(modalSearch.toLowerCase())
      );
    }
    if (modalPrefecture) {
      filtered = filtered.filter(v => v.prefecture === modalPrefecture);
    }
    setFilteredModalVenues(filtered);
  }, [venues, modalSearch, modalPrefecture]);

  // 会場選択ポップアップ内で、会場が選択された場合は自動入力＆編集不可にし、リセットボタンで自由入力に戻す処理
  const handleVenueSelect = (venue) => {
    setFormData(prev => ({
      ...prev,
      venue: venue.name,
      prefecture: venue.prefecture,
      isVenueAuto: true
    }));
    setShowVenueModal(false);
  };

  const handleVenueReset = () => {
    setFormData(prev => ({
      ...prev,
      venue: '',
      prefecture: '',
      isVenueAuto: false
    }));
    setShowVenueModal(false);
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="event-register-container">
        <h1>新規イベント登録</h1>

        <div className="button-center">
          <button onClick={toggleExistingEvent} className="toggle-existing-event-button">
            {formData.isExistingEvent ? '単発のイベントとして修正' : '既存のイベントの別公演として追加'}
          </button>
        </div>

        <form className="event-register-form" onSubmit={handleSubmit}>
          {/* イベント名 */}
          <div className="form-group">
            <label className="group-label">イベント名:</label>
            {formData.isExistingEvent ? (
              <select
                name="original_event_uuid"
                value={formData.original_event_uuid || ''}
                onChange={(e) => {
                  handleChange(e);
                  handleSelectEvent(e.target.value);
                }}
                required
              >
                <option value="" disabled>イベントを選択してください</option>
                {existingEvents.map(event => (
                  <option key={event.event_uuid} value={event.event_uuid}>{event.name}</option>
                ))}
              </select>
            ) : (
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            )}
          </div>

          {/* ジャンル */}
          <div className="form-group">
            <label className="group-label">ジャンル:</label>
            <select name="genre" value={formData.genre} onChange={handleChange} required>
              <option value="" disabled>ジャンルを選択してください</option>
              {genres.map(genre => (
                <option key={genre.id} value={genre.value}>{genre.label}</option>
              ))}
            </select>
            {formData.genre === 'other' && (
              <input
                type="text"
                name="customGenre"
                value={formData.customGenre}
                onChange={handleChange}
                placeholder="ジャンルを入力してください"
                required
              />
            )}
          </div>
          <Link
            to="/admin-dashboard/genres/edit"
            style={{ fontSize: '11px', marginBottom: '5px', textAlign: 'right', display: 'block' }}
          >
            ジャンルを編集
          </Link>

          {/* 公演区分 */}
          <div className="form-group inline-group">
            <label className="group-label">公演区分:</label>
            <select
              name="performance_flag"
              value={formData.performance_flag}
              onChange={handleChange}
              required
            >
              {formData.isExistingEvent ? (
                <>
                  <option value="" disabled>選択してください</option>
                  <option value="additional">追加公演</option>
                </>
              ) : (
                <>
                  <option value="" disabled>選択してください</option>
                  <option value="single">単発公演</option>
                  <option value="first">初回公演</option>
                </>
              )}
            </select>
            <input
              type="text"
              name="performance_type"
              value={formData.performance_type}
              onChange={handleChange}
              placeholder="公演名"
            />
          </div>
          <p className="form-help-text">
            {formData.isExistingEvent ? (
              <>追加公演名を入力してください。(例：東京公演｜名古屋公演、昼公演｜夜公演、Day1｜Day2、マチネ｜ソワレなど)</>
            ) : (
              <>
                追加公演名を入力してください。(例：東京公演｜名古屋公演、昼公演｜夜公演、Day1｜Day2、マチネ｜ソワレなど)
                <br />
                単発公演：1回きりのイベントや、2回目以降キャスティングが変わる場合に選択。
                <br />
                初回公演：基本的に同じキャスティングで複数回、追加公演を行う場合に選択してください。
              </>
            )}
          </p>

          {/* 会場名 */}
          <div className="form-group">
            <label className="group-label">会場名:</label>
            <input 
              type="text" 
              name="venue" 
              value={formData.venue} 
              onChange={handleChange} 
              disabled={formData.isVenueAuto} 
            />
            <button
              type="button"
              className="venue-modal-open-btn"
              onClick={() => setShowVenueModal(true)}
            >
              会場を選択
            </button>
          </div>

          {/* 開催都道府県 */}
          <div className="form-group">
            <label className="group-label">開催地:</label>
            <select 
              name="prefecture" 
              value={formData.prefecture} 
              onChange={handleChange} 
              required 
              disabled={formData.isVenueAuto}
            >
              <option value="" disabled>都道府県を選択してください</option>
              {prefectures.map(pref => (
                <option key={pref.value} value={pref.value}>{pref.label}</option>
              ))}
            </select>
          </div>

          {/* イベント日 */}
          <div className="form-group">
            <label className="group-label">イベント日:</label>
            <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} />
          </div>

          {/* 開場時間・開演時間 */}
          <div className="form-group inline-group">
            <label className="group-label">開場時間:</label>
            <input type="time" name="open_time" value={formData.open_time} onChange={handleChange} />
          </div>
          <div className="form-group inline-group">
            <label className="group-label">開演時間:</label>
            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} />
          </div>

          {/* 追加日程 */}
          <div className="form-group">
            <label className="group-label">追加日程:</label>
            <div className="additional-dates-container">
              {formData.additionalDates.map((date, index) => (
                <div key={index} className="additional-date-entry">
                  <input
                    type="date"
                    name="date"
                    value={date.date}
                    onChange={(e) => handleAdditionalDateChange(index, 'date', e.target.value)}
                  />
                  <input
                    type="text"
                    name="additional_date_title"
                    value={date.additional_date_title}
                    onChange={(e) => handleAdditionalDateChange(index, 'additional_date_title', e.target.value)}
                    placeholder="日程のタイトル"
                  />
                  <input
                    type="text"
                    name="description"
                    value={date.description}
                    onChange={(e) => handleAdditionalDateChange(index, 'description', e.target.value)}
                    placeholder="日程の説明"
                  />
                  <button
                    type="button"
                    className="remove-date-button"
                    onClick={() => handleRemoveAdditionalDate(index)}
                  >
                    －
                  </button>
                </div>
              ))}
              { (formData.additionalDates.length === 0 ||
                 formData.additionalDates[formData.additionalDates.length - 1].date.trim() !== ''
              ) && (
                <button type="button" className="add-date-button" onClick={handleAddAdditionalDate}>
                  追加日程を追加
                </button>
              )}
            </div>
          </div>

          {/* 出演 */}
          <div className="form-group">
            <label className="group-label">出演:</label>
            <div className="casts-container">
              {formData.casts.map((cast, index) => (
                <div key={index} className="cast-entry">
                  <input
                    type="text"
                    name="role"
                    value={cast.role}
                    onChange={(e) => handleCastChange(index, 'role', e.target.value)}
                    placeholder="役職"
                  />
                  <input
                    type="text"
                    name="name"
                    value={cast.name}
                    onChange={(e) => handleCastChange(index, 'name', e.target.value)}
                    placeholder="出演者名"
                  />
                  <button
                    type="button"
                    className="remove-cast-button"
                    onClick={() => handleRemoveCast(index)}
                  >
                    －
                  </button>
                </div>
              ))}
              { (formData.casts.length === 0 ||
                 formData.casts[formData.casts.length - 1].name.trim() !== ''
              ) && (
                <button type="button" className="add-cast-button" onClick={handleAddCast}>
                  出演者を追加
                </button>
              )}
            </div>
          </div>

          {/* イベント概要、プログラム、料金・チケット情報 */}
          <div className="form-group">
            <label className="group-label">イベント概要:</label>
            <textarea name="event_overview" value={formData.event_overview} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label className="group-label">プログラム:</label>
            <textarea name="program" value={formData.program} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label className="group-label">料金・チケット情報:</label>
            <textarea name="ticket_info" value={formData.ticket_info} onChange={handleChange}></textarea>
          </div>

          {/* オプション */}
          <div className="form-group">
            <label className="group-label">オプション:</label>
            <div className="options-container">
              {eventOptions.map(option => (
                <label key={option.id} className="option-label">
                  <input
                    type="checkbox"
                    name="eventOptions"
                    value={option.option_name}
                    checked={formData.selectedOptions.includes(option.option_name)}
                    onChange={() => handleOptionChange(option.option_name)}
                  />
                  {option.option_name}
                </label>
              ))}
            </div>
          </div>
          <Link
            to="/admin-dashboard/event-options/edit"
            style={{ fontSize: '11px', marginBottom: '5px', textAlign: 'right', display: 'block' }}
          >
            オプションを編集
          </Link>

          {/* 主催・運営 */}
          <div className="form-group">
            <label className="group-label">主催:</label>
            <select name="organizer" value={formData.organizer} onChange={handleSelectChange}>
              <option value="Tacticart">Tacticart</option>
              <option value="other">その他</option>
            </select>
            {formData.organizer === 'other' && (
              <input
                type="text"
                name="customOrganizer"
                value={formData.customOrganizer}
                onChange={handleChange}
                placeholder="主催を入力してください"
              />
            )}
          </div>
          <div className="form-group">
            <label className="group-label">運営:</label>
            <select name="operator" value={formData.operator} onChange={handleSelectChange}>
              <option value="Tacticart">Tacticart</option>
              <option value="other">その他</option>
            </select>
            {formData.operator === 'other' && (
              <input
                type="text"
                name="customOperator"
                value={formData.customOperator}
                onChange={handleChange}
                placeholder="運営を入力してください"
              />
            )}
          </div>

          {/* フライヤー */}
          {!formData.useExistingFlyers && (
            <>
              <div className="form-group">
                <label className="group-label">フライヤー表:</label>
                <input
                  type="file"
                  name="flyerFront"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="group-label">フライヤー裏:</label>
                <input
                  type="file"
                  name="flyerBack"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleChange}
                />
              </div>
            </>
          )}
          {formData.isExistingEvent && (
            <div className="form-group full-width">
              <label className="group-label">
                <input
                  type="checkbox"
                  name="useExistingFlyers"
                  checked={formData.useExistingFlyers}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      useExistingFlyers: e.target.checked,
                      flyerFront: null,
                      flyerBack: null
                    }))
                  }
                />
                共通のフライヤーを使用
              </label>
            </div>
          )}

          <button type="submit" className="submit-btn">
            新規イベント登録
          </button>
        </form>

        {/* ===================== Venue Selection Modal ===================== */}
        {showVenueModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>会場選択</h2>
              <div className="modal-filters">
                <input
                  type="text"
                  placeholder="会場名検索"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                />
                <select
                  className="prefecturs-select"
                  value={modalPrefecture}
                  onChange={(e) => setModalPrefecture(e.target.value)}
                >
                  {prefectures.map(pref => (
                    <option key={pref.value} value={pref.value}>
                      {pref.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-venue-list">
                {filteredModalVenues.map(v => (
                  <div
                    key={v.id}
                    className="modal-venue-item"
                    onClick={() => handleVenueSelect(v)}
                  >
                    <span>{v.name}</span> - <span>{v.prefecture}</span>
                  </div>
                ))}
              </div>
              <div className="modal-buttons">
                <button className="modal-close-btn" onClick={() => setShowVenueModal(false)}>
                  閉じる
                </button>
                <button className="modal-reset-btn" onClick={handleVenueReset}>
                  リセット
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ===================== End of Modal ===================== */}
      </div>
    </div>
  );
}

export default EventRegistration;

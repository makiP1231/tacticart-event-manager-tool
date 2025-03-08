import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventEdit.css';
import { prefectures } from '../../utils/prefectures';

const API_URL = process.env.REACT_APP_API_URL;

function EventEdit() {
  const { eventId } = useParams();
  const navigate = useNavigate();
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
    useExistingFlyers: false,
    performance_flag: '',
    performance_type: '',
    venue: '',
    // 新規追加: 開催都道府県（自由入力の場合用）
    prefecture: '',
    // 新規追加: 会場選択により自動入力された場合は true
    venueAutoSelected: false,
    additionalDates: [],
    casts: [],
    event_overview: '',
    program: '',
    ticket_info: '',
    selectedOptions: []
  });
  const [genres, setGenres] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  // 会場選択モーダル用ステート
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venues, setVenues] = useState([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPrefecture, setModalPrefecture] = useState('');
  const [filteredModalVenues, setFilteredModalVenues] = useState([]);

  // 追加日程編集用ハンドラ
  const handleAdditionalDateChange = (index, key, value) => {
    const updatedDates = [...formData.additionalDates];
    updatedDates[index][key] = value;
    setFormData(prev => ({ ...prev, additionalDates: updatedDates }));
  };

  const handleAddAdditionalDate = () => {
    if (
      formData.additionalDates.length === 0 ||
      (formData.additionalDates[formData.additionalDates.length - 1].additional_date || '').trim() !== ''
    ) {
      setFormData(prev => ({
        ...prev,
        additionalDates: [
          ...prev.additionalDates,
          { additional_date: '', additional_date_title: '', description: '' }
        ]
      }));
    }
  };

  const handleRemoveAdditionalDate = (index) => {
    const updatedDates = formData.additionalDates.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, additionalDates: updatedDates }));
  };

  // 出演者情報編集用ハンドラ
  const handleCastChange = (index, key, value) => {
    const updatedCasts = [...formData.casts];
    updatedCasts[index][key] = value;
    setFormData(prev => ({ ...prev, casts: updatedCasts }));
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
    const updatedCasts = formData.casts.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, casts: updatedCasts }));
  };

  // オプションデータの取得
  const fetchEventOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/event-options`);
      if (!response.ok) throw new Error('Network response was not ok');
      const optionsData = await response.json();
      setEventOptions(optionsData.map(option => option.option_name) || []);
    } catch (error) {
      console.error('Error fetching event options:', error);
      setEventOptions([]);
    }
  };

  // ジャンルの取得
  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_URL}/api/genres`);
      const data = await response.json();
      setGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  // イベント詳細取得（追加日程・出演者情報含む）
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
        const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : '';
        const selectedOptions = data.event.selected_options ? JSON.parse(data.event.selected_options) : [];

        // ※DB から取得した出演者情報 (cast_role, cast_name) をフロントで扱う形に変換
        const transformCasts = (data.event.casts || []).map(c => ({
          role: c.cast_role,
          name: c.cast_name
        }));

        setFormData({
          name: data.event.name || '',
          genre: data.event.genre || '',
          customGenre: '',
          event_date: formatDate(data.event.event_date),
          open_time: formatTime(data.event.open_time),
          start_time: formatTime(data.event.start_time),
          organizer: data.event.organizer || 'Tacticart',
          customOrganizer: '',
          operator: data.event.operator || 'Tacticart',
          customOperator: '',
          flyerFront: data.event.flyer_front_url ? `${API_URL}/images/flyers/${data.event.flyer_front_url}` : null,
          flyerBack: data.event.flyer_back_url ? `${API_URL}/images/flyers/${data.event.flyer_back_url}` : null,
          useExistingFlyers: data.event.use_existing_flyers || false,
          performance_flag: data.event.performance_flag || '',
          performance_type: data.event.performance_type || '',
          venue: data.event.venue || '',
          // 新規追加: 都道府県（自由入力状態）
          prefecture: data.event.prefecture || '',
          additionalDates: data.event.additional_dates
            ? data.event.additional_dates.map(date => ({
                ...date,
                additional_date: formatDate(date.additional_date)
              }))
            : [],
          casts: transformCasts,
          event_overview: data.event.event_overview || '',
          program: data.event.program || '',
          ticket_info: data.event.ticket_info || '',
          selectedOptions
          // venueAutoSelected remains false for existing events unless updated via modal
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setLoading(false);
      }
    };

    fetchEventDetails();
    fetchGenres();
    fetchEventOptions();
  }, [eventId]);

  useEffect(() => {
    if (formData.performance_flag !== 'additional' && formData.useExistingFlyers) {
      setFormData(prev => ({ ...prev, useExistingFlyers: false }));
    }
  }, [formData.performance_flag]);

  const handleUseExistingFlyersChange = (e) => {
    setFormData(prev => ({ ...prev, useExistingFlyers: e.target.checked }));
  };

  // 共通の handleChange（ファイル対応）
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const updatedOptions = checked
        ? [...prev.selectedOptions, value]
        : prev.selectedOptions.filter(opt => opt !== value);
      return { ...prev, selectedOptions: updatedOptions };
    });
  };

  const renderEventOptions = () => {
    return eventOptions.map(option => (
      <label key={option} className="event-edit-container-option-label">
        <input
          type="checkbox"
          name="eventOptions"
          value={option}
          checked={formData.selectedOptions.includes(option)}
          onChange={handleOptionChange}
        />
        {option}
      </label>
    ));
  };

  const handleFlyerChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setLoading(true);
      const dataForm = new FormData();
      dataForm.append(name, file);
      fetch(`${API_URL}/api/events/${eventId}/update-flyer`, {
        method: 'POST',
        body: dataForm
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.message || 'Failed to update flyer');
            });
          }
          return response.json();
        })
        .then(data => {
          setLoading(false);
          setFormData(prev => ({
            ...prev,
            [name]: `${API_URL}/images/flyers/${data.flyerUrl}`
          }));
        })
        .catch(error => {
          console.error('Error updating flyer:', error.message);
          setLoading(false);
        });
    }
  };

  const handleDeleteFlyer = (flyerType) => {
    setLoading(true);
    fetch(`${API_URL}/api/events/${eventId}/delete-flyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flyerType })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete flyer');
        }
        return response.json();
      })
      .then(() => {
        setLoading(false);
        setFormData(prev => ({ ...prev, [flyerType]: null }));
      })
      .catch(error => {
        console.error('Error deleting flyer:', error);
        setLoading(false);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    // 送信時に、チェックされたオプションを配列として取得
    const selectedOptions = Array.from(document.querySelectorAll('input[name="eventOptions"]:checked')).map(el => el.value);

    Object.keys(formData).forEach(key => {
      let value = formData[key];

      if (key === 'additionalDates') {
        value = JSON.stringify(value);
      } else if (key === 'casts') {
        // 出演者情報をAPIが期待する形 `{ cast_role, cast_name }` に変換
        const transformedCasts = formData.casts.map(c => ({
          cast_role: c.role,
          cast_name: c.name
        }));
        value = JSON.stringify(transformedCasts);
      } else if (key === 'selectedOptions') {
        value = JSON.stringify(selectedOptions);
      } else if (key === 'useExistingFlyers') {
        form.append('use_existing_flyers', value ? 'true' : 'false');
        return;
      }
      form.append(key, value);
    });

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'PUT',
        body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update event');
      navigate(`/admin-dashboard/events/event-details/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = () => {
    fetch(`${API_URL}/api/events/${eventId}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete event');
        }
        return response.json();
      })
      .then(() => {
        navigate('/admin-dashboard/events');
      })
      .catch(error => console.error('Error deleting event:', error));
  };

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

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="event-edit-container">
        <h1>イベント情報修正</h1>
        <form className="event-edit-container-form" onSubmit={handleSubmit}>
          {/* 基本情報 */}
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">イベント名:</label>
            {formData.performance_flag === 'additional' ? (
              <span>{formData.name}</span>
            ) : (
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            )}
          </div>
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">ジャンル:</label>
            <select name="genre" value={formData.genre} onChange={handleChange} required>
              <option value="" disabled>ジャンルを選択してください</option>
              {genres.map(genre => (
                <option key={genre.value} value={genre.value}>{genre.label}</option>
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
          <div className="event-edit-container-form-group inline-group">
            <label className="event-edit-container-group-label">公演区分:</label>
            <select
              name="performance_flag"
              value={formData.performance_flag}
              onChange={handleChange}
              required
              disabled={formData.performance_flag === 'additional' || formData.performance_flag === 'first'}
            >
              {formData.performance_flag === 'single' ? (
                <>
                  <option value="single">単発公演</option>
                  <option value="first">初回公演</option>
                </>
              ) : (
                <>
                  <option value="single">単発公演</option>
                  <option value="first">初回公演</option>
                  <option value="additional">追加公演</option>
                </>
              )}
            </select>
            <input
              type="text"
              name="performance_type"
              value={formData.performance_type}
              onChange={handleChange}
              placeholder="公演の区分を入力"
            />
          </div>
          <p className="event-edit-container-form-help-text">
            単発公演：1回きりのイベントや、2回目以降キャスティングが変わる場合に選択。初回公演：基本的に同じキャスティングで複数回、追加公演を行う場合に選択してください。
          </p>
          {/* 会場名 */}
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">会場名:</label>
            <input 
              type="text" 
              name="venue" 
              value={formData.venue} 
              onChange={handleChange} 
              disabled={formData.venueAutoSelected} 
            />
            <button type="button" className="venue-modal-open-btn" onClick={() => setShowVenueModal(true)}>
              会場を選択
            </button>
          </div>
          {/* 新規追加: 開催都道府県 */}
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">開催都道府県:</label>
            <select
              name="prefecture"
              value={formData.prefecture}
              onChange={handleChange}
              disabled={formData.venueAutoSelected}
            >
              <option value="">都道府県を選択してください</option>
              {prefectures.map(pref => (
                <option key={pref.value} value={pref.value}>{pref.label}</option>
              ))}
            </select>
          </div>
          {/* イベント日 */}
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">イベント日:</label>
            <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} />
          </div>
          {/* 開場時間・開演時間 */}
          <div className="event-edit-container-form-group inline-group">
            <label className="event-edit-container-group-label">開場時間:</label>
            <input type="time" name="open_time" value={formData.open_time} onChange={handleChange} />
          </div>
          <div className="event-edit-container-form-group inline-group">
            <label className="event-edit-container-group-label">開演時間:</label>
            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} />
          </div>

          {/* ============= 追加日程セクション ============= */}
          <div className="event-edit-container-form-group" style={{ alignItems: 'flex-start' }}>
            <label className="event-edit-container-group-label" style={{ alignSelf: 'flex-start' }}>
              追加日程:
            </label>
            <div className="event-edit-container-additional-dates-container">
              {formData.additionalDates.map((date, index) => (
                <div key={index} className="event-edit-container-additional-date-entry">
                  <input
                    type="date"
                    value={date.additional_date}
                    onChange={(e) => handleAdditionalDateChange(index, 'additional_date', e.target.value)}
                  />
                  <input
                    type="text"
                    value={date.additional_date_title}
                    onChange={(e) => handleAdditionalDateChange(index, 'additional_date_title', e.target.value)}
                    placeholder="日程のタイトル"
                  />
                  <input
                    type="text"
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
              {(formData.additionalDates.length === 0 ||
                formData.additionalDates[formData.additionalDates.length - 1].date.trim() !== '') && (
                <button type="button" className="event-edit-container-add-date-button" onClick={handleAddAdditionalDate}>
                  追加日程を追加
                </button>
              )}
            </div>
          </div>

          {/* ============= 出演者セクション ============= */}
          <div className="event-edit-container-form-group" style={{ alignItems: 'flex-start' }}>
            <label className="event-edit-container-group-label" style={{ alignSelf: 'flex-start' }}>
              出演者:
            </label>
            <div className="event-edit-container-casts-container">
              {formData.casts.map((cast, index) => (
                <div key={index} className="event-edit-container-cast-entry">
                  <input
                    type="text"
                    value={cast.role}
                    onChange={(e) => handleCastChange(index, 'role', e.target.value)}
                    placeholder="役職"
                  />
                  <input
                    type="text"
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
              {(formData.casts.length === 0 ||
                formData.casts[formData.casts.length - 1].name.trim() !== '') && (
                <button type="button" className="event-edit-container-add-cast-button" onClick={handleAddCast}>
                  出演者を追加
                </button>
              )}
            </div>
          </div>

          {/* イベント概要、プログラム、料金・チケット情報 */}
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">イベント概要:</label>
            <textarea name="event_overview" value={formData.event_overview} onChange={handleChange}></textarea>
          </div>
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">プログラム:</label>
            <textarea name="program" value={formData.program} onChange={handleChange}></textarea>
          </div>
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">料金・チケット情報:</label>
            <textarea name="ticket_info" value={formData.ticket_info} onChange={handleChange}></textarea>
          </div>

          {/* オプション */}
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">オプション:</label>
            <div className="event-edit-container-options-container">
              {renderEventOptions()}
            </div>
          </div>
          <Link
            to={{ pathname: "/admin-dashboard/event-options/edit", state: { from: location.pathname } }}
            style={{ fontSize: '11px', marginBottom: '5px', textAlign: 'right', display: 'block' }}
          >
            オプションを編集
          </Link>

          {/* 主催・運営 */}
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">主催:</label>
            <select name="organizer" value={formData.organizer} onChange={handleChange}>
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
          <div className="event-edit-container-form-group">
            <label className="event-edit-container-group-label">運営:</label>
            <select name="operator" value={formData.operator} onChange={handleChange}>
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
          {formData.performance_flag === 'additional' && (
            <div className="event-edit-container-form-group checkbox-container">
              <label className="event-edit-container-group-label">共通のフライヤーを使用:</label>
              <input
                type="checkbox"
                name="useExistingFlyers"
                checked={formData.useExistingFlyers}
                onChange={handleUseExistingFlyersChange}
              />
            </div>
          )}
          {!formData.useExistingFlyers && (
            <>
              <div className="event-edit-container-form-group-flex-start">
                <label className="event-edit-container-group-label">フライヤー表:</label>
                {formData.flyerFront ? (
                  <div className="flyer-container">
                    <img src={formData.flyerFront} alt="フライヤー表" className="flyer-image-preview" />
                  </div>
                ) : (
                  <input type="file" name="flyerFront" accept="image/jpeg,image/jpg,image/png" onChange={handleFlyerChange} />
                )}
                {formData.flyerFront && (
                  <button type="button" onClick={() => handleDeleteFlyer('flyerFront')} className="delete-button">
                    削除
                  </button>
                )}
              </div>
              <div className="event-edit-container-form-group-flex-start">
                <label className="event-edit-container-group-label">フライヤー裏:</label>
                {formData.flyerBack ? (
                  <div className="flyer-container">
                    <img src={formData.flyerBack} alt="フライヤー裏" className="flyer-image-preview" />
                  </div>
                ) : (
                  <input type="file" name="flyerBack" accept="image/jpeg,image/jpg,image/png" onChange={handleFlyerChange} />
                )}
                {formData.flyerBack && (
                  <button type="button" onClick={() => handleDeleteFlyer('flyerBack')} className="delete-button">
                    削除
                  </button>
                )}
              </div>
            </>
          )}
          <Link
            to={{ pathname: "/admin-dashboard/event-options/edit", state: { from: location.pathname } }}
            style={{ fontSize: '11px', marginBottom: '5px', textAlign: 'right', display: 'block' }}
          >
            オプションを編集
          </Link>
          <button type="submit" className="event-edit-container-submit-button">情報を更新</button>
        </form>
        <Link to={`/admin-dashboard/events/event-details/${eventId}`} className="event-edit-container-back-button">
          イベント詳細ページに戻る
        </Link>
        <div className="event-edit-container-delete-link" onClick={() => setShowDeletePopup(true)}>
          イベントを削除
        </div>
        {showDeletePopup && (
          <div className="event-edit-container-popup-background" onClick={() => setShowDeletePopup(false)}>
            <div className="event-edit-container-delete-popup" onClick={(e) => e.stopPropagation()}>
              <p>イベント情報を削除すると元に戻せません。本当に削除しますか？</p>
              <div className="event-edit-container-popup-button-container">
                <button className="event-edit-container-delete-button" onClick={handleDeleteEvent}>削除</button>
                <button className="event-edit-container-cancel-button" onClick={() => setShowDeletePopup(false)}>戻る</button>
              </div>
            </div>
          </div>
        )}
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
                  value={modalPrefecture}
                  onChange={(e) => setModalPrefecture(e.target.value)}
                  className="prefecturs-select"
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
                    onClick={() => {
                      // 会場選択時、会場名とその会場の都道府県を自動入力し、自由入力を無効化する
                      setFormData(prev => ({ 
                        ...prev, 
                        venue: v.name,
                        prefecture: v.prefecture,
                        venueAutoSelected: true 
                      }));
                      setShowVenueModal(false);
                    }}
                  >
                    <span>{v.name}</span> - <span>{v.prefecture}</span>
                  </div>
                ))}
              </div>
              <button className="modal-close-btn" onClick={() => setShowVenueModal(false)}>
                閉じる
              </button>
              {/* リセットボタンをモーダル内に移動 */}
                <button 
                  type="button" 
                  className="modal-reset-btn"
                  onClick={() => {
                    setModalSearch('');
                    setModalPrefecture('');
                  }}
                >
                  リセット
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventEdit;

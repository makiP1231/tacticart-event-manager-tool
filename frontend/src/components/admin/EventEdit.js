import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventEdit.css';

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
        additionalDates: [],
        casts: [],
        event_overview: '',
        program: '',
        ticket_info: '',
        selectedOptions: []
    });
    const [genres, setGenres] = useState([]);
    const [eventOptions, setEventOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEventOptions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/event-options`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const optionsData = await response.json();
            // 確実に配列として設定
            setEventOptions(optionsData.map(option => option.option_name) || []);
        } catch (error) {
            console.error('Error fetching event options:', error);
            setEventOptions([]); // エラー時にも配列を空に設定
        }
    };

    useEffect(() => {
        fetch(`${API_URL}/api/events/${eventId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
                const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : '';

                const selectedOptions = data.event.selected_options ? JSON.parse(data.event.selected_options) : [];
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
                    additionalDates: data.event.additional_dates.map(date => ({
                        ...date,
                        additional_date: formatDate(date.additional_date)
                    })) || [],
                    casts: data.event.casts || [],
                    event_overview: data.event.event_overview || '',
                    program: data.event.program || '',
                    ticket_info: data.event.ticket_info || '',
                    selectedOptions
                });
            })
            .catch(error => console.error('Error fetching event details:', error));

        fetchGenres();
        fetchEventOptions();
    }, [eventId, API_URL]);

    const fetchGenres = async () => {
        try {
            const response = await fetch(`${API_URL}/api/genres`);
            const data = await response.json();
            setGenres(data);
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    const renderEventOptions = () => {
        const allOptionsSet = new Set(eventOptions); // イベントオプションをSetに変換して重複を避けます。
        formData.selectedOptions.forEach(option => {
            allOptionsSet.add(option); // 選択されているオプションを追加
        });
    
        const allOptions = Array.from(allOptionsSet); // Setを配列に変換
    
        return (
            <>
                {allOptions.map(option => (
                    <label key={option} className="event-edit-container-option-label">
                        <input
                            type="checkbox"
                            name="eventOptions"
                            value={option}
                            defaultChecked={formData.selectedOptions.includes(option)}
                        />
                        {option}
                    </label>
                ))}
            </>
        );
    };

    const handleChange = (event) => {
        const { name, value, type, files } = event.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFlyerChange = (event) => {
        const { name, files } = event.target;
        const file = files[0];

        if (file) {
            setLoading(true);
            const formData = new FormData();
            formData.append(name, file);

            fetch(`${API_URL}/api/events/${eventId}/update-flyer`, {
                method: 'POST',
                body: formData
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
                    setFormData(prev => ({ ...prev, [name]: `${API_URL}/images/flyers/${data.flyerUrl}` }));
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

    const handleSubmit = (event) => {
        event.preventDefault();
        const form = new FormData();
        const selectedOptions = Array.from(document.querySelectorAll('input[name="eventOptions"]:checked')).map(el => el.value);
    
        Object.keys(formData).forEach(key => {
            let value = formData[key];
    
            if (key === 'additionalDates' || key === 'casts') {
                // 日付とキャスト情報はJSON文字列として扱う
                value = JSON.stringify(value.map(item => ({
                    ...item,
                    additional_date: item.additional_date || null, // 空の日付は null
                    date: item.date || null
                })));
                form.append(key, value);
            } else if (key === 'selectedOptions') {
                // 選択されたオプションが空ならnull、それ以外はJSON文字列として扱う
                form.append(key, selectedOptions.length > 0 ? JSON.stringify(selectedOptions) : null);
            } else {
                form.append(key, value);
            }
        });
    
        form.append('use_existing_flyers', formData.useExistingFlyers);
    
        fetch(`${API_URL}/api/events/${eventId}`, {
            method: 'PUT',
            body: form
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to update event');
                });
            }
            return response.json();
        })
        .then(() => {
            navigate(`/admin-dashboard/events/event-details/${eventId}`);
        })
        .catch(error => console.error('Error updating event:', error));
    };
    

    const handleAdditionalDateChange = (index, name, value) => {
        const updatedDates = [...formData.additionalDates];
        updatedDates[index][name] = value;
        setFormData(prev => ({
            ...prev,
            additionalDates: updatedDates
        }));
    };

    const handleAddAdditionalDate = () => {
        setFormData(prev => ({
            ...prev,
            additionalDates: [...prev.additionalDates, { additional_date: '', description: '', additional_date_title: '' }]
        }));
    };

    const handleRemoveAdditionalDate = (index) => {
        const updatedDates = formData.additionalDates.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            additionalDates: updatedDates
        }));
    };

    const handleCastChange = (index, name, value) => {
        const updatedCasts = [...formData.casts];
        updatedCasts[index][name] = value;
        setFormData(prev => ({
            ...prev,
            casts: updatedCasts
        }));
    };

    const handleAddCast = () => {
        setFormData(prev => ({
            ...prev,
            casts: [...prev.casts, { cast_role: '', cast_name: '' }]
        }));
    };

    const handleRemoveCast = (index) => {
        const updatedCasts = formData.casts.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            casts: updatedCasts
        }));
    };

    const [showDeletePopup, setShowDeletePopup] = useState(false);

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

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="event-edit-container">
                <h1>イベント情報修正</h1>
                <form className="event-edit-container-form" onSubmit={handleSubmit}>
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
                    <Link to="/admin-dashboard/genres/edit"  style={{ fontSize: 'small', display: 'block', fontSize: '11px', marginBottom: '5px', textAlign: 'right' }}>
                        ジャンルを編集
                    </Link>
                    <div className="event-edit-container-form-group">
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
                        <input type="text" name="performance_type" value={formData.performance_type} onChange={handleChange} placeholder="公演の区分を入力" />
                    </div>
                    <p className="event-edit-container-form-help-text">
                        単発公演：1回きりのイベントや、2回目以降キャスティングが変わる場合に選択。初回公演：基本的に同じキャスティングで追加公演を行う場合に選択してください。
                    </p>
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">会場名:</label>
                        <input type="text" name="venue" value={formData.venue} onChange={handleChange} />
                    </div>
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">イベント日:</label>
                        <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} />
                    </div>
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">開場時間:</label>
                        <input type="time" name="open_time" value={formData.open_time} onChange={handleChange} />
                    </div>
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">開演時間:</label>
                        <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} />
                    </div>
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">主催:</label>
                        <select name="organizer" value={formData.organizer} onChange={handleChange}>
                            <option value="Tacticart">Tacticart</option>
                            <option value="その他">その他</option>
                        </select>
                        {formData.organizer === 'その他' && (
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
                            <option value="その他">その他</option>
                        </select>
                        {formData.operator === 'その他' && (
                            <input
                                type="text"
                                name="customOperator"
                                value={formData.customOperator}
                                onChange={handleChange}
                                placeholder="運営を入力してください"
                            />
                        )}
                    </div>
                    {formData.performance_flag === 'additional' && (
                        <div className="event-edit-container-form-group checkbox-container">
                            <label className="event-edit-container-group-label">共通のフライヤーを使用:</label>
                            <input
                                type="checkbox"
                                name="useExistingFlyers"
                                checked={formData.useExistingFlyers}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    useExistingFlyers: e.target.checked,
                                    flyerFront: null,
                                    flyerBack: null
                                }))}
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
                                    <input type="file" name="flyerFront" onChange={handleFlyerChange} />
                                )}
                                {formData.flyerFront && (
                                    <button type="button" onClick={() => handleDeleteFlyer('flyerFront')} className="delete-button">削除</button>
                                )}
                            </div>
                            <div className="event-edit-container-form-group-flex-start">
                                <label className="event-edit-container-group-label">フライヤー裏:</label>
                                {formData.flyerBack ? (
                                    <div className="flyer-container">
                                        <img src={formData.flyerBack} alt="フライヤー裏" className="flyer-image-preview" />
                                    </div>
                                ) : (
                                    <input type="file" name="flyerBack" onChange={handleFlyerChange} />
                                )}
                                {formData.flyerBack && (
                                    <button type="button" onClick={() => handleDeleteFlyer('flyerBack')} className="delete-button">削除</button>
                                )}
                            </div>
                        </>
                    )}
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
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">オプション:</label>
                        <div className="event-edit-container-options-container">
                            {renderEventOptions()}
                        </div>
                    </div>
                    <Link to={{ pathname: "/admin-dashboard/event-options/edit", state: { from: location.pathname } }} style={{ fontSize: 'small', display: 'block', fontSize: '11px', marginBottom: '5px', textAlign: 'right' }}>
                        オプションを編集
                    </Link>
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">追加日程:</label>
                        <div className="event-edit-container-additional-dates-container">
                            {formData.additionalDates.map((date, index) => (
                                <div key={index} className="event-edit-container-additional-date-entry">
                                    <input
                                        type="date"
                                        name="additional_date"
                                        value={date.additional_date}
                                        onChange={(e) => handleAdditionalDateChange(index, 'additional_date', e.target.value)}
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
                                    <button type="button" className="event-edit-container-remove-date-button" onClick={() => handleRemoveAdditionalDate(index)}>－</button>
                                </div>
                            ))}
                            <button type="button" className="event-edit-container-add-date-button" onClick={handleAddAdditionalDate}>✛</button>
                        </div>
                    </div>
                    <div className="event-edit-container-form-group">
                        <label className="event-edit-container-group-label">出演:</label>
                        <div className="event-edit-container-casts-container">
                            {formData.casts.map((cast, index) => (
                                <div key={index} className="event-edit-container-cast-entry">
                                    <input
                                        type="text"
                                        name="cast_role"
                                        value={cast.cast_role}
                                        onChange={(e) => handleCastChange(index, 'cast_role', e.target.value)}
                                        placeholder="役職"
                                    />
                                    <input
                                        type="text"
                                        name="cast_name"
                                        value={cast.cast_name}
                                        onChange={(e) => handleCastChange(index, 'cast_name', e.target.value)}
                                        placeholder="出演者名"
                                    />
                                    <button type="button" className="event-edit-container-remove-cast-button" onClick={() => handleRemoveCast(index)}>－</button>
                                </div>
                            ))}
                            <button type="button" className="event-edit-container-add-cast-button" onClick={handleAddCast}>✛</button>
                        </div>
                    </div>
                    {loading && <p>アップロード中...</p>}
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
            </div>
        </div>
    );
}

export default EventEdit;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventRegistration.css';

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
        event_overview: '', // イベント概要追加
        ticket_info: '', // 料金・チケット情報追加
        selectedOptions: [],
        casts: []
    });
    const [genres, setGenres] = useState([]);
    const [existingEvents, setExistingEvents] = useState([]);
    const [eventOptions, setEventOptions] = useState([]);
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL;

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

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
            additionalDates: [...prev.additionalDates, { date: '', description: '', additional_date_title: '' }]
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
            casts: [...prev.casts, { role: '', name: '' }]
        }));
    };

    const handleRemoveCast = (index) => {
        const updatedCasts = formData.casts.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            casts: updatedCasts
        }));
    };

    const handleOptionChange = (optionName) => {
        setFormData(prev => {
            const options = [...prev.selectedOptions];
            if (options.includes(optionName)) {
                const index = options.indexOf(optionName);
                options.splice(index, 1);
            } else {
                options.push(optionName);
            }
            return { ...prev, selectedOptions: options };
        });
    };

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
        }));
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        if (value === 'other') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                [`custom${name.charAt(0).toUpperCase() + name.slice(1)}`]: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSelectEvent = async (eventUuid) => {
        try {
            const response = await fetch(`${API_URL}/api/events/${eventUuid}`);
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const eventData = await response.json();

            const formatDate = (dateStr) => {
                return dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
            };

            const formatTime = (timeStr) => {
                return timeStr ? timeStr.slice(0, 5) : '';
            };

            setFormData(prev => ({
                ...prev,
                name: eventData.event.name,
                genre: eventData.event.genre,
                venue: eventData.event.venue,
                event_date: formatDate(eventData.event.event_date),
                open_time: formatTime(eventData.event.open_time),
                start_time: formatTime(eventData.event.start_time),
                organizer: eventData.event.organizer,
                operator: eventData.event.operator,
                useExistingFlyers: true
            }));

        } catch (error) {
            console.error("Failed to fetch event data:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData();
        Object.keys(formData).forEach(key => {
            let value = formData[key];
            if (key === 'flyerFront' || key === 'flyerBack') {
                if (value) form.append(key, value);
            } else if (key === 'additionalDates' || key === 'casts') {
                form.append(key, JSON.stringify(value));
            } else if (key === 'selectedOptions') {
                // selectedOptions をJSON文字列として保存
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
            navigate('/admin-dashboard/events/complete', { state: { event: data } });
        } catch (error) {
            console.error('Event creation failed:', error.message);
        }
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
                    element.oninvalid = function() {
                        this.setCustomValidity(message);
                    };
                    element.oninput = function() {
                        this.setCustomValidity('');
                    };
                }
            });
        };

        setCustomValidationMessages();
    }, [formData.isExistingEvent]);

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
                    <Link to="/admin-dashboard/genres/edit" style={{ fontSize: 'small', display: 'block', fontSize: '11px', marginBottom: '5px', textAlign: 'right' }}>ジャンルを編集</Link>
                    <div className="form-group inline-group">
                        <label className="group-label">公演区分:</label>
                        <select name="performance_flag" value={formData.performance_flag} onChange={handleChange} required>
                            {formData.isExistingEvent ? (
                                <>
                                    <option value="" selected disabled>選択してください</option>
                                    <option value="additional">追加公演</option>
                                </>
                            ) : (
                                <>
                                    <option value="" selected disabled>選択してください</option>
                                    <option value="single">単発公演</option>
                                    <option value="first">初回公演</option>
                                </>
                            )}
                        </select>
                        <input type="text" name="performance_type" value={formData.performance_type} onChange={handleChange} placeholder="公演名" />
                    </div>
                    <p className="form-help-text">
                        {formData.isExistingEvent ? (
                            <>
                                追加公演名を入力してください。(東京公演｜名古屋公演、昼公演｜夜公演、Day1｜Day2、マチネ｜ソワレなど)
                            </>
                        ) : (
                            <>
                                追加公演名を入力してください。(東京公演｜名古屋公演、昼公演｜夜公演、Day1｜Day2、マチネ｜ソワレなど)
                                <br />
                                単発公演：1回きりのイベントや、2回目以降キャスティングが変わる場合に選択。
                                <br />
                                初回公演：基本的に同じキャスティングで複数回、追加公演を行う場合に選択してください。
                            </>
                        )}
                    </p>
                    <div className="form-group">
                        <label className="group-label">会場名:</label>
                        <input type="text" name="venue" value={formData.venue} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label className="group-label">イベント日:</label>
                        <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} />
                    </div>
                    <div className="form-group inline-group">
                        <label className="group-label">開場時間:</label>
                        <input type="time" name="open_time" value={formData.open_time} onChange={handleChange} />
                    </div>
                    <div className="form-group inline-group">
                        <label className="group-label">開演時間:</label>
                        <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} />
                    </div>
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
                                    <button type="button" className="remove-date-button" onClick={() => handleRemoveAdditionalDate(index)}>－</button>
                                </div>
                            ))}
                            <button type="button" className="add-date-button" onClick={handleAddAdditionalDate}>✛</button>
                        </div>
                    </div>
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
                                    <button type="button" className="remove-cast-button" onClick={() => handleRemoveCast(index)}>－</button>
                                </div>
                            ))}
                            <button type="button" className="add-cast-button" onClick={handleAddCast}>✛</button>
                        </div>
                    </div>
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
                    <Link to="/admin-dashboard/event-options/edit" style={{ fontSize: 'small', display: 'block', fontSize: '11px', marginBottom: '5px', textAlign: 'right' }}>オプションを編集</Link>
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
                    <div className="form-group">
                        {!formData.useExistingFlyers && (
                            <>
                                <label className="group-label">フライヤー表:</label>
                                <input type="file" name="flyerFront" accept="image/jpeg,image/jpg,image/png" onChange={handleChange} />
                            </>
                        )}
                    </div>
                    <div className="form-group">
                        {!formData.useExistingFlyers && (
                            <>
                                <label className="group-label">フライヤー裏:</label>
                                <input type="file" name="flyerBack" accept="image/jpeg,image/jpg,image/png" onChange={handleChange} />
                            </>
                        )}
                    </div>
                    {formData.isExistingEvent && (
                        <div className="form-group full-width">
                            <label className="group-label">
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
                                共通のフライヤーを使用
                            </label>
                        </div>
                    )}
                    <button type="submit" className="submit-btn">新規イベント登録</button>
                </form>
            </div>
        </div>
    );
}

export default EventRegistration;

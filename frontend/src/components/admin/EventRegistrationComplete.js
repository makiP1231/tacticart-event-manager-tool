import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventRegistrationComplete.css';

const API_URL = process.env.REACT_APP_API_URL;

function EventRegistrationComplete() {
    const location = useLocation();
    const navigate = useNavigate();
    const eventData = location.state?.event;

    const [genres, setGenres] = useState([]);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await fetch(`${API_URL}/api/genres`, {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await response.json();
                if (response.ok) {
                    setGenres(data);
                } else {
                    throw new Error('Failed to fetch genres');
                }
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };

        fetchGenres();
    }, []);

    const translateGenre = (genreValue) => {
        const genre = genres.find(g => g.value === genreValue);
        return genre ? genre.label : genreValue;
    };

    const getImageUrl = (type, filename) => filename ? `${API_URL}/images/${type}/${filename}` : null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const time = new Date(`1970-01-01T${timeStr}`);
        return time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const getSelectedOptions = (selectedOptions) => {
        if (!selectedOptions) return []; // オプションがない場合は空配列を返す
        try {
            // JSON 形式の文字列をパースする
            const optionsArray = JSON.parse(selectedOptions);
            return optionsArray;
        } catch (error) {
            console.error('Failed to parse selected options:', error);
            return [];
        }
    };
    

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="event-complete-container">
                <h1>イベント登録完了</h1>
                {eventData ? (
                    <div className="event-details">
                        <h2>{eventData.name} {eventData.performance_type}</h2>
                        <p><strong>ジャンル:</strong> {translateGenre(eventData.genre)}</p>
                        <p><strong>イベント日:</strong> {formatDate(eventData.event_date)}</p>
                        <p><strong>開場時間:</strong> {formatTime(eventData.open_time)}</p>
                        <p><strong>開演時間:</strong> {formatTime(eventData.start_time)}</p>
                        <p><strong>主催:</strong> {eventData.organizer}</p>
                        <p><strong>運営:</strong> {eventData.operator}</p>
                        <p><strong>プログラム:</strong> {eventData.program}</p>
                        {eventData && getSelectedOptions(eventData.selected_options).length > 0 && (
                            <p><strong>オプション:</strong>
                                {getSelectedOptions(eventData.selected_options).map((option, index) => (
                                    <span key={index} className="option-badge">{option}</span>
                                ))}
                            </p>
                        )}
                        {eventData.additional_dates && (
                            <div>
                                <h3>追加日程:</h3>
                                {eventData.additional_dates.map((date, index) => (
                                    <p key={index}>{formatDate(date.date)} - {date.additional_date_title} - {date.description}</p>
                                ))}
                            </div>
                        )}
                        {eventData.casts && (
                            <div>
                                <h3>出演者:</h3>
                                {eventData.casts.map((cast, index) => (
                                    <p key={index}>{cast.role}: {cast.name}</p>
                                ))}
                            </div>
                        )}
                        {eventData.flyer_front_url && <img src={getImageUrl('flyers', eventData.flyer_front_url)} alt="フライヤー表" className="flyer-image" />}
                        {eventData.flyer_back_url && <img src={getImageUrl('flyers', eventData.flyer_back_url)} alt="フライヤー裏" className="flyer-image" />}
                        <div className="buttons">
                            <button onClick={() => navigate('/admin-dashboard/events/register')}>続けて新規イベント登録</button>
                            <button onClick={() => navigate('/admin-dashboard/events/edit')}>詳細登録</button>
                            <button onClick={() => navigate('/admin-dashboard/events')}>イベント一覧</button>
                        </div>
                    </div>
                ) : (
                    <p>イベント情報がありません。</p>
                )}
            </div>
        </div>
    );
}

export default EventRegistrationComplete;

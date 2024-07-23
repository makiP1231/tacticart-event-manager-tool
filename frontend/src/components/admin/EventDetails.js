import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

function EventDetails() {
    const [eventData, setEventData] = useState(null);
    const [genres, setGenres] = useState([]);
    const [castingInfo, setCastingInfo] = useState([]);
    const { eventId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchEventDetails();
        fetchGenres();
        fetchCastingInfo();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/api/events/${eventId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const options = data.event.selected_options;
            data.event.selected_options = Array.isArray(options) ? options : JSON.parse(options || '[]');
            setEventData(data.event);
        } catch (error) {
            console.error('Error fetching event details:', error);
        }
    };

    const fetchGenres = async () => {
        try {
            const response = await fetch(`${API_URL}/api/genres`);
            const data = await response.json();
            setGenres(data);
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    const fetchCastingInfo = async () => {
        try {
            const response = await fetch(`${API_URL}/api/events/${eventId}/castings`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setCastingInfo(data.castings || []);
        } catch (error) {
            console.error('Error fetching casting info:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '未設定';
        return new Date(dateString).toLocaleDateString('ja-JP');
    };

    const formatTime = (timeString) => {
        if (!timeString) return '未設定';
        return timeString.slice(0, 5);
    };

    const translateGenre = (genre) => {
        const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
        return genreData ? genreData.label : genre;
    };

    const getGenreColor = (genre) => {
        const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
        return genreData ? genreData.color : '#007bff';
    };

    const renderGenres = () => {
        return eventData.genres.map(genre => (
            <p key={genre.value} className="badge genre-badge" style={{ backgroundColor: getGenreColor(genre.value) }}>
                {translateGenre(genre.value)}
            </p>
        ));
    };

    const renderCastingInfo = () => {
        if (!castingInfo.length) return null;

        const maxColumns = 8;
        const rows = [];
        for (let i = 0; i < castingInfo.length; i += maxColumns) {
            rows.push(castingInfo.slice(i, i + maxColumns));
        }

        return (
            <div className="casting-info">
                <h2>キャスティング情報</h2>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="casting-table-row">
                        <table>
                            <thead>
                                <tr>
                                    {row.map((casting, castingIndex) => (
                                        <th key={castingIndex}>{casting.part}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {row.map((casting, castingIndex) => (
                                        <td key={castingIndex}>
                                            {`${casting.sent_contract_count + casting.signed_contract_count}(${casting.signed_contract_count})/${casting.number}`}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        );
    };

    const renderSelectedOptions = () => {
        if (!eventData || !eventData.selected_options || !eventData.selected_options.length) return null;
        return (
            <div className="event-info">
                {eventData.selected_options.map((option, index) => (
                    <p key={index} className="badge option-badge">{option}</p>
                ))}
            </div>
        );
    };

    if (!eventData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="event-detail-container">
                <h1>{eventData.name}</h1>
                <div className="flyer-container">
                    {eventData.flyer_front_url && (
                        <img src={`${API_URL}/images/flyers/${eventData.flyer_front_url}`} alt="フライヤー表" className="flyer-image" />
                    )}
                    {eventData.flyer_back_url && (
                        <img src={`${API_URL}/images/flyers/${eventData.flyer_back_url}`} alt="フライヤー裏" className="flyer-image" />
                    )}
                </div>
                <div className="event-info">
                    <p className="badge genre-badge" style={{ backgroundColor: getGenreColor(eventData.genre) }}>{translateGenre(eventData.genre)}</p>
                    <p>イベント日: {formatDate(eventData.event_date)}</p>
                    <p>開場時間: {formatTime(eventData.open_time)}</p>
                    <p>開演時間: {formatTime(eventData.start_time)}</p>
                </div>
                {renderSelectedOptions()}
                <div className="additional-info">
                    <h2>追加日程</h2>
                    <table className="additional-dates-table">
                        <tbody>
                            {eventData.additional_dates.map((date, index) => (
                                <tr key={index}>
                                    <td>{formatDate(date.additional_date)}</td>
                                    <td>{date.additional_date_title}</td>
                                    <td>{date.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <h2>出演者</h2>
                    <table className="casts-table">
                        <tbody>
                            {eventData.casts.map((cast, index) => (
                                <tr key={index}>
                                    <td>{cast.cast_role}</td>
                                    <td>{cast.cast_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {renderCastingInfo()}
                <div className="event-actions">
                    <button onClick={() => navigate(`/admin-dashboard/events/edit/${eventId}`)}>修正</button>
                    <button onClick={() => navigate(`/admin-dashboard/events/event-casting-registration/${eventId}`)}>キャスティング情報登録</button>
                </div>
            </div>
        </div>
    );
}

export default EventDetails;

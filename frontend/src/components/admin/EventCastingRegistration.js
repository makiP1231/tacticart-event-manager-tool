import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import orchestraTemplate from '../templates/OrchestraTemplate';
import '../../css/admin/EventCastingRegistration.css';

function EventCastingRegistration() {
    const { eventId } = useParams();
    const [eventInfo, setEventInfo] = useState({ name: '', castings: [] });

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetch(`${API_URL}/api/events/${eventId}/castings`)
            .then(response => response.json())
            .then(data => {
                setEventInfo({ name: data.event, castings: data.castings || [] });
            })
            .catch(error => console.error('Error fetching event and castings:', error));
    }, [eventId, API_URL]);

    const applyTemplate = () => {
        if (eventInfo.castings.length === 0) {
            setEventInfo({...eventInfo, castings: orchestraTemplate});
        }
    };

    const handleAddCasting = () => {
        setEventInfo({
            ...eventInfo,
            castings: [...eventInfo.castings, { part: '', number: '', memo: '', sort_order: eventInfo.castings.length + 1 }]
        });
    };

    const handleCastingChange = (index, field, value) => {
        const updatedCastings = [...eventInfo.castings];
        updatedCastings[index] = {...updatedCastings[index], [field]: value};
        setEventInfo({...eventInfo, castings: updatedCastings});
    };

    const handleRemoveCasting = (index) => {
        const updatedCastings = eventInfo.castings.filter((_, idx) => idx !== index);
        setEventInfo({...eventInfo, castings: updatedCastings});
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newCastings = [...eventInfo.castings];
        [newCastings[index - 1], newCastings[index]] = [newCastings[index], newCastings[index - 1]];
        setEventInfo({...eventInfo, castings: newCastings});
    };

    const moveDown = (index) => {
        if (index === eventInfo.castings.length - 1) return;
        const newCastings = [...eventInfo.castings];
        [newCastings[index + 1], newCastings[index]] = [newCastings[index], newCastings[index + 1]];
        setEventInfo({...eventInfo, castings: newCastings});
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        fetch(`${API_URL}/api/events/${eventId}/castings/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventInfo.castings)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save castings');
            }
            return response.json();
        })
        .then(data => {
            console.log('Casting data updated successfully:', data);
        })
        .catch(error => console.error('Error updating casting data:', error));
    };

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="event-casting-container">
                <h1>{`${eventInfo.name}のキャスティング登録`}</h1>
                {eventInfo.castings.length === 0 && (
                    <button onClick={applyTemplate}>オーケストラテンプレート適用</button>
                )}
                <form onSubmit={handleSubmit}>
                    {eventInfo.castings.map((casting, index) => (
                        <div className="casting-row" key={index}>
                            <div className="casting-item">
                                <label htmlFor={`part-${index}`}>パート:</label>
                                <input
                                    id={`part-${index}`}
                                    name="part"
                                    type="text"
                                    value={casting.part}
                                    onChange={(e) => handleCastingChange(index, 'part', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="casting-item">
                                <label htmlFor={`quantity-${index}`}>人数:</label>
                                <input
                                    id={`quantity-${index}`}
                                    name="quantity"
                                    type="number"
                                    value={casting.number}
                                    onChange={(e) => handleCastingChange(index, 'number', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="casting-item">
                                <label htmlFor={`note-${index}`}>メモ:</label>
                                <input
                                    id={`note-${index}`}
                                    name="note"
                                    type="text"
                                    value={casting.memo}
                                    onChange={(e) => handleCastingChange(index, 'memo', e.target.value)}
                                />
                            </div>
                            <button type="button" onClick={() => moveUp(index)} className="move-button">↑</button>
                            <button type="button" onClick={() => moveDown(index)} className="move-button">↓</button>
                            <button type="button" onClick={() => handleRemoveCasting(index)} className="delete-button">削除</button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddCasting} className="add-casting-button">+ 追加</button>
                    <button type="submit" className="submit-button">パート情報を保存</button>
                </form>
                <Link to={`/admin-dashboard/events/event-details/${eventId}`} className="back-button">イベント詳細ページへ戻る</Link>
            </div>
        </div>
    );
}

export default EventCastingRegistration;

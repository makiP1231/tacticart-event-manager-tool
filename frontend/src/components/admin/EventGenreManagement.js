import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventGenreManagement.css';

function GenreManagement() {
    const [genres, setGenres] = useState([]);
    const [newGenre, setNewGenre] = useState({ label: '', value: '', color: '#ffffff' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            const response = await fetch(`${API_URL}/api/genres`);
            const data = await response.json();
            setGenres(data);
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    const handleAddGenre = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/genres`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newGenre),
            });
            if (response.ok) {
                setMessage('Genre added successfully');
                fetchGenres();
                setNewGenre({ label: '', value: '', color: '#ffffff' });
            } else {
                const data = await response.json();
                setMessage(data.message || 'Failed to add genre');
            }
        } catch (error) {
            console.error('Error adding genre:', error);
            setMessage('Failed to add genre');
        }
    };

    const handleDeleteGenre = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/genres/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            setMessage(data.message);
            if (response.ok) {
                fetchGenres();
            }
        } catch (error) {
            console.error('Error deleting genre:', error);
            setMessage('Failed to delete genre');
        }
    };

    const handleBack = () => {
        if (location.state && location.state.from) {
            navigate(location.state.from);
        } else {
            navigate('/admin-dashboard/events/register');
        }
    };

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="genre-management-container">
                <h1>ジャンル管理</h1>
                {message && <p className="message">{message}</p>}
                <form className="genre-form" onSubmit={handleAddGenre}>
                    <div className="form-group">
                        <label className="form-label">日本語:</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newGenre.label}
                            onChange={(e) => setNewGenre({ ...newGenre, label: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">英語:</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newGenre.value}
                            onChange={(e) => setNewGenre({ ...newGenre, value: e.target.value.toLowerCase() })}
                            required
                            pattern="^[a-z]+$"
                            title="英語の小文字のみを入力してください"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label-color">ラベルカラー:</label>
                        <input
                            type="color"
                            className="form-input-color"
                            value={newGenre.color}
                            onChange={(e) => setNewGenre({ ...newGenre, color: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-button">ジャンルを追加</button>
                </form>
                <div className="genre-list">
                    {genres.map((genre) => (
                        <div key={genre.id} className="genre-item">
                            <div className="color-box" style={{ backgroundColor: genre.color }}></div>
                            <span>{genre.label} ({genre.value})</span>
                            <button
                                className={!genre.is_used ? "delete-button" : "delete-button placeholder"}
                                onClick={() => !genre.is_used && handleDeleteGenre(genre.id)}
                            >
                                {!genre.is_used ? "削除" : ""}
                            </button>
                        </div>
                    ))}
                    <p>※既にそのジャンルのイベントが作成されている場合は削除できません。</p>
                </div>
                <button onClick={handleBack} className="back-button">
                    戻る
                </button>
            </div>
        </div>
    );
}

export default GenreManagement;

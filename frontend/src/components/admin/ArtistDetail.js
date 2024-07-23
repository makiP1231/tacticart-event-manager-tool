import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ArtistDetail.css';

function ArtistDetail() {
    const { artistId } = useParams();
    const [artist, setArtist] = useState(null);
    const [name, setName] = useState('');
    const [selectedParts, setSelectedParts] = useState([]);
    const [parts, setParts] = useState([]);
    const [adminNote, setAdminNote] = useState('');
    const [isEditable, setIsEditable] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetchParts();
        fetchArtistDetails();
    }, [artistId]);

    const fetchParts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/parts`);
            const data = await response.json();
            setParts(data);
        } catch (error) {
            console.error('Error fetching parts:', error);
        }
    };

    const fetchArtistDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/artists/${artistId}`);
            const data = await response.json();
            setArtist(data);
            setName(data.name);
            setSelectedParts(data.parts);
            setAdminNote(data.admin_note || '');
            setIsEditable(!data.email);
        } catch (error) {
            console.error('Error fetching artist details:', error);
        }
    };

    const handlePartClick = (partValue) => {
        const index = selectedParts.indexOf(partValue);
        if (index === -1) {
            setSelectedParts([...selectedParts, partValue]);
        } else {
            const newParts = [...selectedParts];
            newParts.splice(index, 1);
            setSelectedParts(newParts);
        }
    };

    const handleNoteChange = (e) => {
        setAdminNote(e.target.value);
    };

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleSaveNote = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/artists/${artistId}/note`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ admin_note: adminNote }),
            });
            if (response.ok) {
                setStatusMessage('メモが保存されました');
                fetchArtistDetails();
            } else {
                throw new Error('Failed to save note');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            setStatusMessage('メモの保存に失敗しました');
        }
    };

    const handleSaveChanges = async () => {
        if (name === artist.name && JSON.stringify(selectedParts) === JSON.stringify(artist.parts)) {
            setIsEditing(false);
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/admin/artists/${artistId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, parts: selectedParts }),
            });
            if (response.ok) {
                setStatusMessage('変更が保存されました');
                setIsEditing(false);
                fetchArtistDetails();
            } else {
                throw new Error('Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            setStatusMessage('変更の保存に失敗しました');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`http://localhost:3000/artist-setup/${artistId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };

    if (!artist) return <div>Loading...</div>;

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="artist-detail-container">
                <h2>{name}</h2>
                {statusMessage && <div className="artist-detail-status">{statusMessage}</div>}
                <div className="artist-detail">
                    {isEditing ? (
                        <>
                            <label>名前:</label>
                            <input
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                required
                            />
                            <label>パート:</label>
                            <div className="part-checkboxes">
                                {parts.map(part => (
                                    <label
                                        key={part.value}
                                        className={selectedParts.includes(part.value)
                                            ? selectedParts[0] === part.value ? 'main-part' : 'sub-part'
                                            : ''}
                                        onClick={() => handlePartClick(part.value)}
                                    >
                                        {part.label}
                                    </label>
                                ))}
                                <label onClick={() => setSelectedParts([])} className="reset-button">
                                    リセット
                                </label>
                            </div>
                            <div><a href="/admin-dashboard/parts-edit" className="part-edit-btn">パートを修正</a></div>
                            <div className="button-group">
                                <button onClick={handleSaveChanges}>保存</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="parts-display">
                                {selectedParts.map(part => (
                                    <span key={part} className="part-badge">
                                        {parts.find(p => p.value === part)?.label}
                                    </span>
                                ))}
                            </div>
                            <p><strong>Email:</strong> {artist.email || '未登録'}</p>
                            {!artist.email && (
                                <button onClick={() => setIsEditing(true)} className="edit-button">修正</button>
                            )}
                        </>
                    )}
                </div>
                <div className="admin-note-section">
                    <textarea
                        value={adminNote}
                        onChange={handleNoteChange}
                        rows="10"
                        placeholder="管理者用メモを入力..."
                    />
                    <button onClick={handleSaveNote}>メモを保存</button>
                    {!artist.email && (
                        <button
                            onClick={handleCopy}
                            className="copy-button"
                            style={{ backgroundColor: copied ? 'orange' : '#007bff', color: copied ? 'white' : 'white' }}
                        >
                            {copied ? 'コピーしました！' : '登録用URLをコピー'}
                        </button>
                    )}
                </div>
                <button onClick={() => navigate('/admin-dashboard/artists/list')} className="back-button">
                    一覧へ戻る
                </button>
            </div>
        </div>
    );
}

export default ArtistDetail;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ArtistSidebar() {
    const [artistName, setArtistName] = useState('');
    const [artistMainPart, setArtistMainPart] = useState('');
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetchArtistNameAndParts();
    }, []);

    const fetchArtistNameAndParts = async () => {
        try {
            const sessionResponse = await fetch(`${API_URL}/api/session`, {
                method: 'GET',
                credentials: 'include'
            });
            const sessionData = await sessionResponse.json();
            if (sessionResponse.ok && sessionData.role === 'artist') {
                const artistResponse = await fetch(`${API_URL}/api/artists/${sessionData.userId}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const artistData = await artistResponse.json();
                if (artistResponse.ok) {
                    setArtistName(artistData.name);
                    if (artistData.parts && artistData.parts.length > 0) {
                        const partsResponse = await fetch(`${API_URL}/api/parts`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        const partsData = await partsResponse.json();
                        if (partsResponse.ok) {
                            const mainPart = partsData.find(part => part.value === artistData.parts[0]);
                            if (mainPart) {
                                setArtistMainPart(mainPart.label);
                            }
                        } else {
                            throw new Error(partsData.message || 'Failed to fetch parts details');
                        }
                    }
                } else {
                    throw new Error(artistData.message || 'Failed to fetch artist details');
                }
            } else {
                throw new Error('No active session found');
            }
        } catch (error) {
            console.error('Error fetching artist name and parts:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/api/artist-logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                navigate(data.redirect);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="artist-sidebar">
            <div className="artist-info">
            <p className="message-text">Welcome,</p>
            <p className="artist-name">{artistName}</p>
                {artistMainPart && (
                    <div className="artist-main-part">
                        <p className="artist-part">{artistMainPart}</p>
                    </div>
                )}
            </div>
            <ul>
                <li><Link to="/artist-dashboard/messages">メッセージ</Link></li>
                <li><Link to="/artist-dashborad/offers">オファー</Link></li>
                <li><Link to="/artist-dashboard/profile">プロフィール</Link></li>
                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>ログアウト</li>
            </ul>
        </div>
    );
}

export default ArtistSidebar;

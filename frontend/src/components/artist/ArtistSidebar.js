// src/components/artist/ArtistSidebar.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/artist/ArtistDashboard.css';
import { useOfferCount } from '../../contexts/OfferCountContext';
import { useContractCount } from '../../contexts/ContractCountContext';

function ArtistSidebar() {
  const { user } = useAuth();
  const { offerCount } = useOfferCount();
  const { contractCount } = useContractCount();
  const [artistDetails, setArtistDetails] = useState(null);
  const [mainPartLabel, setMainPartLabel] = useState('');
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (user && user.userType === 'artist') {
      fetchArtistDetails(user.userId);
    }
  }, [user]);

  const fetchArtistDetails = async (artistId) => {
    try {
      const artistResponse = await fetch(`${API_URL}/api/artists/${artistId}`, {
        method: 'GET',
        credentials: 'include',
      });
      const artistData = await artistResponse.json();
      if (artistResponse.ok) {
        if (typeof artistData.parts === 'string') {
          try {
            artistData.parts = JSON.parse(artistData.parts);
          } catch (e) {
            console.error('Error parsing parts JSON:', e);
          }
        }
        setArtistDetails(artistData);
        if (artistData.parts && Array.isArray(artistData.parts) && artistData.parts.length > 0) {
          fetchPartLabel(artistData.parts[0]);
        }
      } else {
        throw new Error(artistData.message || 'Failed to fetch artist details');
      }
    } catch (error) {
      console.error('Error fetching artist details:', error);
    }
  };

  const fetchPartLabel = async (partValue) => {
    try {
      const partsResponse = await fetch(`${API_URL}/api/parts`, {
        method: 'GET',
        credentials: 'include',
      });
      const partsData = await partsResponse.json();
      if (partsResponse.ok) {
        const foundPart = partsData.find((p) => p.value === partValue);
        if (foundPart) {
          setMainPartLabel(foundPart.label);
        }
      } else {
        throw new Error('Failed to fetch parts details');
      }
    } catch (error) {
      console.error('Error fetching part label:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        <p className="artist-name">{artistDetails ? artistDetails.name : 'Loading...'}</p>
        {mainPartLabel && (
          <div className="artist-main-part">
            <p className="artist-part">{mainPartLabel}</p>
          </div>
        )}
      </div>
      <div className="sidebar-label">メッセージ</div>
      <ul>
        <li className="sidebar-item"><Link to="/artist-dashboard/messages">メッセージ</Link></li>
      </ul>
      <div className="sidebar-label">依頼関連</div>
      <ul>
        <li className="sidebar-item">
          <Link to="/artist-dashboard/offers">
            オファー一覧
            {offerCount > 0 && <span className="offer-badge">{offerCount}</span>}
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/artist-dashboard/contracts">
            本契約一覧
            {contractCount > 0 && <span className="offer-badge">{contractCount}</span>}
          </Link>
        </li>
      </ul>
      <div className="sidebar-label">個人設定</div>
      <ul>
        <li><Link to="/artist-dashboard/profile">プロフィール</Link></li>
      </ul>
      <ul>
        <li className="sidebar-item logout" onClick={handleLogout} style={{ cursor: 'pointer' }}>ログアウト</li>
      </ul>
    </div>
  );
}

export default ArtistSidebar;

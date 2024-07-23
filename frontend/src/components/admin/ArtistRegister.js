import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ArtistRegister.css';

function ArtistRegister() {
  const [name, setName] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [parts, setParts] = useState([]);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/parts`)
      .then(response => response.json())
      .then(data => setParts(data))
      .catch(error => console.error('Error fetching parts:', error));
  }, [API_URL]);

  const handlePartClick = partValue => {
    const index = selectedParts.indexOf(partValue);
    if (index === -1) {
      setSelectedParts([...selectedParts, partValue]);
    } else {
      const newParts = [...selectedParts];
      newParts.splice(index, 1);
      setSelectedParts(newParts);
    }
  };

  const resetSelections = () => {
    setSelectedParts([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const artistData = { name, parts: selectedParts };
    try {
      const response = await fetch(`${API_URL}/api/register-artist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artistData),
      });
      const data = await response.json();
      if (response.ok) {
        navigate('/admin-dashboard/artists/registration-complete', {
          state: {
            artist: data.artist,
            registrationUrl: `${API_URL}/artist-setup/${data.artist.artist_id}`
          }
        });
      } else {
        console.error('Artist registration failed:', data);
      }
    } catch (error) {
      console.error('Artist registration error:', error);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="content artist-register-container">
        <h2>アーティスト登録</h2>
        <form className="artist-register-form" onSubmit={handleSubmit}>
          <label>アーティスト名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label>パート (最初に選択されたものがメインパートとなります)</label>
          <div className="part-checkboxes">
            {parts.map(part => (
              <label key={part.value}
                     className={selectedParts.includes(part.value)
                                ? selectedParts[0] === part.value ? 'main-part' : 'sub-part'
                                : ''}
                     onClick={() => handlePartClick(part.value)}>
                {part.label}
              </label>
            ))}
            <label onClick={resetSelections} className="reset-button">
              リセット
            </label>
          </div>
          <div><a href="/admin-dashboard/parts-edit" className="part-edit-btn">パートを修正</a></div>
          <button type="submit">登録</button>
        </form>
        <button onClick={() => navigate('/admin-dashboard/artists/list')} className="back-button">
                    一覧へ戻る
        </button>
      </div>
    </div>
  );
}

export default ArtistRegister;

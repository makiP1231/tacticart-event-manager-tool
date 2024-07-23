import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ArtistList.css';

const API_URL = process.env.REACT_APP_API_URL;
const ARTIST_PROFILE_IMAGE_PATH = process.env.REACT_APP_ARTIST_PROFILE_IMAGE_PATH;

function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchParts = async () => {
    const response = await fetch(`${API_URL}/api/parts`);
    const data = await response.json();
    return data;
  };

  const translatePartsToJapanese = async (partsEng) => {
    const partsData = await fetchParts();
    if (typeof partsEng === 'string') {
      partsEng = JSON.parse(partsEng);
    }
    const partsJp = partsEng.map(partEng => {
      const partObj = partsData.find(part => part.value === partEng);
      return partObj ? partObj.label : '未定義のパート';
    });
    return partsJp[0];  // 1つ目のパートだけを表示
  };

  const handleCopy = (artistId) => {
    const url = artists.find(artist => artist.artist_id === artistId).registrationUrl;
    navigator.clipboard.writeText(url);
    setArtists(artists.map(artist => artist.artist_id === artistId ? { ...artist, copied: true } : artist));
    setTimeout(() => {
      setArtists(artists.map(artist => artist.artist_id === artistId ? { ...artist, copied: false } : artist));
    }, 1000);
  };

  useEffect(() => {
    console.log("Fetching artists...");  // デバッグログを追加
    fetch(`${API_URL}/api/admin/artists`)
      .then(res => {
        console.log("Response status:", res.status);  // デバッグログを追加
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(async data => {
        console.log("Fetched artists data:", data);  // デバッグログを追加
        const artistsWithJapaneseParts = await Promise.all(data.artists.map(async artist => {
          const parts = await translatePartsToJapanese(artist.parts || []);
          return {
            ...artist,
            parts,
            registrationUrl: artist.email ? '' : `${API_URL}/artist-setup/${artist.artist_id}`,
            copied: false,
            isLongName: artist.name.length > 10  // 名前が長いかどうかを判断
          };
        }));
        setArtists(artistsWithJapaneseParts);
      })
      .catch(err => console.error('Error fetching artists:', err));
  }, []);
  

  const totalPages = Math.ceil(artists.length / itemsPerPage);

  const currentArtists = artists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    localStorage.setItem('currentPage', pageNumber);  // ページ番号をローカルストレージに保存
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      localStorage.setItem('currentPage', currentPage + 1);  // ページ番号をローカルストレージに保存
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      localStorage.setItem('currentPage', currentPage - 1);  // ページ番号をローカルストレージに保存
    }
  };

  useEffect(() => {
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
  }, []);

  const handleCardClick = (artistId) => {
    navigate(`/admin-dashboard/artists/${artistId}`);
  };

  const getProfileImageStyle = (artist) => {
    if (artist.profile_picture) {
      return {
        backgroundImage: `url(${API_URL}${ARTIST_PROFILE_IMAGE_PATH}${artist.profile_picture})`,
        backgroundSize: 'cover'
      };
    } else {
      let backgroundColor = '#d3d3d3'; // default color for undefined gender
      if (artist.gender === 'male') {
        backgroundColor = '#add8e6'; // light blue for male
      } else if (artist.gender === 'female') {
        backgroundColor = '#ffc0cb'; // pink for female
      }
      return {
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: '#fff'
      };
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="artist-list-container">
        <h1>アーティスト一覧</h1>
        <div className="artist-list">
          {currentArtists.map(artist => (
            <div
              key={artist.artist_id}
              className="artist-card"
            >
              <div className="artist-card-content">
                <div
                  className="artist-profile-pic"
                  style={getProfileImageStyle(artist)}
                  onClick={() => handleCardClick(artist.artist_id)}
                >
                  {!artist.profile_picture && artist.name.charAt(0)}
                </div>
                <div className={`artist-name-container ${artist.isLongName ? 'long-name' : ''}`}>
                  <div className="artist-name" onClick={() => handleCardClick(artist.artist_id)}>{artist.name}</div>
                </div>
              </div>
              <div className="artist-part">{artist.parts}</div>
              {!artist.email && artist.registrationUrl && (
                <button
                  className="artist-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(artist.artist_id);
                  }}
                  style={{ backgroundColor: artist.copied ? 'orange' : '#007bff', color: artist.copied ? 'white' : 'white' }}
                >
                  {artist.copied ? 'コピーしました！' : '登録用URLをコピー'}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1}>|&lt;</button>
          <button onClick={prevPage} disabled={currentPage === 1}>&lt;</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => goToPage(i + 1)}
              className={currentPage === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={nextPage} disabled={currentPage === totalPages}>&gt;</button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>&gt;|</button>
        </div>
      </div>
    </div>
  );
}

export default ArtistList;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventList.css';

const placeholderImages = [
  'noimagepic1.jpg',
  'noimagepic2.jpg',
  'noimagepic3.jpg',
  'noimagepic4.jpg',
  'noimagepic5.jpg',
  'noimagepic6.jpg',
  'noimagepic7.jpg',
  'noimagepic8.jpg',
  'noimagepic9.jpg',
  'noimagepic10.jpg',
  'noimagepic11.jpg',
  'noimagepic12.jpg',
  'noimagepic13.jpg',
  'noimagepic14.jpg',
  'noimagepic15.jpg',
  'noimagepic16.jpg',
  'noimagepic17.jpg',
  'noimagepic18.jpg'
];

const getRandomPlaceholder = () => {
  const randomIndex = Math.floor(Math.random() * placeholderImages.length);
  return placeholderImages[randomIndex];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
  const date = new Date(dateString);
  return isNaN(date) ? '' : date.toLocaleDateString(undefined, options);
};

function EventList() {
  const [events, setEvents] = useState([]);
  const [flyerUrls, setFlyerUrls] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [genres, setGenres] = useState([]);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL;
  const FLYER_IMAGE_PATH = process.env.REACT_APP_FLYER_IMAGE_PATH;

  useEffect(() => {
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
    fetchEvents();
    fetchGenres();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events/upcoming`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setEvents(data.events);
      setFlyerUrls(await generateFlyerUrls(data.events));
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const generateFlyerUrls = async (events) => {
    const urls = {};
    for (const event of events) {
      if (event.use_existing_flyers && event.original_event_uuid) {
        const originalEvent = events.find(e => e.event_uuid === event.original_event_uuid);
        if (originalEvent) {
          urls[event.event_uuid] = getImageUrl(originalEvent.flyer_front_url);
        } else {
          urls[event.event_uuid] = `${API_URL}/images/placeholders/${getRandomPlaceholder()}`;
        }
      } else {
        urls[event.event_uuid] = getImageUrl(event.flyer_front_url);
      }
    }
    return urls;
  };

  const getImageUrl = (filename) => filename ? `${API_URL}${FLYER_IMAGE_PATH}${filename}` : `${API_URL}/images/placeholders/${getRandomPlaceholder()}`;

  const translateGenre = (genre) => {
    const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
    return genreData ? genreData.label : genre;
  };

  const getGenreColor = (genre) => {
    const genreData = genres.find(g => g.value.toLowerCase() === genre.toLowerCase());
    return genreData ? genreData.color : '#007bff';
  };

  const totalPages = Math.ceil(events.length / itemsPerPage);

  const currentEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    localStorage.setItem('currentPage', pageNumber);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      localStorage.setItem('currentPage', currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      localStorage.setItem('currentPage', currentPage - 1);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="event-list-container">
        <h1>イベント一覧</h1>
        <div className="event-list">
          {currentEvents.map(event => (
            <div 
              key={event.event_uuid} 
              className="event-card" 
              onClick={() => navigate(`/admin-dashboard/events/event-details/${event.event_uuid}`)}
              style={{ cursor: 'pointer' }}
            >
              <p className="genre" style={{ backgroundColor: getGenreColor(event.genre) }}>{translateGenre(event.genre)}</p>
              <img src={flyerUrls[event.event_uuid] || `${API_URL}/images/placeholders/${getRandomPlaceholder()}`} alt="フライヤー表" className="event-image" />
              <h2>
                {event.name}
                {event.performance_type && ` ${event.performance_type}`}
              </h2>
              <div className="time">
                {event.event_date && <p>{formatDate(event.event_date)}</p>}
                {event.open_time && <p>open: {event.open_time.slice(0, 5)}</p>}
                {event.start_time && <p>start: {event.start_time.slice(0, 5)}</p>}
              </div>
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

export default EventList;

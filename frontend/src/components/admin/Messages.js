import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AdminSidebar from './Sidebar';
import '../../css/admin/Messages.css';
import io from 'socket.io-client';
import { useInView } from 'react-intersection-observer';

const API_URL = process.env.REACT_APP_API_URL;
const ARTIST_PROFILE_IMAGE_PATH = process.env.REACT_APP_ARTIST_PROFILE_IMAGE_PATH;
const MESSAGE_IMAGE_PATH = process.env.REACT_APP_MESSAGE_IMAGE_PATH;
const FLYER_IMAGE_PATH = process.env.REACT_APP_FLYER_IMAGE_PATH;

const socket = io(API_URL, {
    withCredentials: true,
    extraHeaders: {
        "my-custom-header": "abcd"
    }
});

const Message = () => {
    const { artistId } = useParams(); 
    const [artists, setArtists] = useState([]);
    const [parts, setParts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [adminUserId, setAdminUserId] = useState(null);
    const [adminUserName, setAdminUserName] = useState('');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isNicknameAllowed, setIsNicknameAllowed] = useState(false);
    const [genres, setGenres] = useState([]);
    const chatContainerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [partFilter, setPartFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const limit = 20;


    const scrollToTop = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = 0;
            }
        }, 0);
    };

    const fetchInitialMessages = async (artistId) => {
        setIsFetching(true);
        try {
            const response = await fetch(`${API_URL}/api/messages/${artistId}/0/${limit}`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();
            if (response.ok) {
                const messagesWithClassNames = await Promise.all(
                    data.messages.map(async (message) => {
                        let admin_name = '';
                        if (message.message_type === 'admin_message' && message.admin_user_id) {
                            const adminData = await fetchAdminName(message.admin_user_id);
                            admin_name = adminData
                                ? message.is_nickname_allowed
                                    ? adminData.nickname
                                    : adminData.full_name || adminData.username
                                : admin_name;
                        }
                        return {
                            ...message,
                            admin_name,
                            className: getMessageClass(message),
                            genreLabel: message.message_format === 'announce_hold' ? getGenreLabel(message.event_genre, genres) : undefined,
                        };
                    })
                );

                setMessages(messagesWithClassNames);
                setOffset(messagesWithClassNames.length);

                scrollToTop();

                return messagesWithClassNames;
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error fetching initial messages:', error);
            setError('メッセージの取得に失敗しました。');
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        // セッションストレージからartistIdを取得
        const sessionArtistId = sessionStorage.getItem('selectedArtistId');
        const sessionArtistName = sessionStorage.getItem('selectedArtistName');
    
        console.log('Session artistId:', sessionArtistId);
        console.log('Session artistName:', sessionArtistName);
    
        if (sessionArtistId && sessionArtistName) {
            // セッションのアーティスト情報がある場合、それを使ってチャットを開く
            console.log('Using session artist data');
            const selected = { artist_id: sessionArtistId, name: sessionArtistName };
            setSelectedArtist(selected);
            fetchInitialMessages(sessionArtistId);
    
            // チャットを開いたらセッションを破棄
            sessionStorage.removeItem('selectedArtistId');
            sessionStorage.removeItem('selectedArtistName');
            console.log('Session data cleared');
        } else if (artistId) {
            // URLパラメータにartistIdがある場合、それを利用
            console.log('Using URL artistId:', artistId);
            const selected = artists.find(artist => artist.artist_id === artistId);
            if (selected) {
                console.log('Artist found in artists list:', selected);
                setSelectedArtist(selected);
                fetchInitialMessages(artistId);
            } else {
                console.log('Artist not found in artists list');
            }
        } else {
            console.log('No session artistId or URL artistId found');
        }
    }, [artistId, artists]);
    
    

    const fetchMoreMessages = useCallback(async () => {
        if (!selectedArtist || !hasMore || isFetching) return;

        setIsFetching(true);
        try {
            const artistId = selectedArtist.artist_id;
            const response = await fetch(`${API_URL}/api/messages/${artistId}/${offset}/${limit}`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();
            if (response.ok) {
                const newMessages = await Promise.all(
                    data.messages.map(async (message) => {
                        let admin_name = '';
                        if (message.message_type === 'admin_message' && message.admin_user_id) {
                            const adminData = await fetchAdminName(message.admin_user_id);
                            admin_name = adminData
                                ? message.is_nickname_allowed
                                    ? adminData.nickname
                                    : adminData.full_name || adminData.username
                                : admin_name;
                        }
                        return {
                            ...message,
                            admin_name,
                            className: getMessageClass(message),
                            genreLabel: message.message_format === 'announce_hold' ? getGenreLabel(message.event_genre, genres) : undefined,
                        };
                    })
                );

                setMessages((prevMessages) => [...prevMessages, ...newMessages]);
                setOffset((prevOffset) => prevOffset + newMessages.length);
                setHasMore(data.messages.length === limit);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error fetching more messages:', error);
            setError('メッセージの取得に失敗しました。');
        } finally {
            setIsFetching(false);
        }
    }, [selectedArtist, hasMore, isFetching, offset, limit, genres]);

    const handleScroll = useCallback(() => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isCloseToBottom = scrollHeight - clientHeight + scrollTop < 50;
            const isCloseToTop = scrollTop >= -50;
            if (isCloseToBottom && hasMore && !isFetching) {
                fetchMoreMessages();
            }
        }
    }, [hasMore, isFetching, fetchMoreMessages]);

    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            chatContainer.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (chatContainer) {
                chatContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('new_message', async (data) => {
            const { artistId } = data;
            if (selectedArtist && artistId === selectedArtist.artist_id) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await fetchInitialMessages(artistId);
                await markMessagesAsRead(artistId);
                scrollToTop();
            }
            updateUnreadMessages(artistId);
        });

        socket.on('messages-read', (data) => {
            const { artistId, readMessageIds } = data;
            if (selectedArtist && artistId === selectedArtist.artist_id && readMessageIds) {
                setMessages((prevMessages) =>
                    prevMessages.map((message) =>
                        readMessageIds.includes(message.id) ? { ...message, is_read: true } : message
                    )
                );
            }
        });

        return () => {
            socket.off('connect');
            socket.off('new_message');
            socket.off('messages-read');
            socket.off('disconnect');
        };
    }, [selectedArtist]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [artistsResponse, partsResponse, groupsResponse, genresResponse] = await Promise.all([
                    fetch(`${API_URL}/api/admin/artists-with-parts`, { method: 'GET', credentials: 'include' }),
                    fetch(`${API_URL}/api/parts`, { method: 'GET', credentials: 'include' }),
                    fetch(`${API_URL}/api/artist-groups`, { method: 'GET', credentials: 'include' }),
                    fetch(`${API_URL}/api/genres`, { method: 'GET', credentials: 'include' }),
                ]);

                const [artistsData, partsData, groupsData, genresData] = await Promise.all([
                    artistsResponse.json(),
                    partsResponse.json(),
                    groupsResponse.json(),
                    genresResponse.json(),
                ]);

                if (artistsResponse.ok) setArtists(artistsData.artists);
                if (partsResponse.ok) setParts(partsData);
                if (groupsResponse.ok) setGroups(groupsData);
                if (genresResponse.ok) {
                    setGenres(genresData);
                    localStorage.setItem('genres', JSON.stringify(genresData));
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                setError('データの取得に失敗しました。');
            }
        };

        const savedGenres = localStorage.getItem('genres');
        const savedArtistId = localStorage.getItem('selectedArtistId');
        if (savedGenres) {
            setGenres(JSON.parse(savedGenres));
        }

        fetchInitialData().then(() => {
            if (savedArtistId) {
                const savedArtist = artists.find(artist => artist.artist_id === savedArtistId);
                if (savedArtist) {
                    handleArtistClick(savedArtist);
                }
            }
        });
    }, []);

    const handleArtistClick = async (artist) => {
        console.log(`Artist clicked: ${artist.artist_id}`);
        if (selectedArtist && selectedArtist.artist_id === artist.artist_id) {
            return;
        }
        setError('');
        setMessages([]);
        setOffset(0);
        setHasMore(false);
        setSelectedArtist(artist);

        await fetchInitialMessages(artist.artist_id);
        markMessagesAsRead(artist.artist_id);

        setArtists((prevArtists) => prevArtists.map((prevArtist) =>
            prevArtist.artist_id === artist.artist_id ? { ...prevArtist, unread_messages: 0 } : prevArtist
        ));

        scrollToTop();
        setHasMore(true);
        localStorage.setItem('selectedArtistId', artist.artist_id);
        console.log('Messages after artist click:', messages);
    };

    const getMessageClass = (message) => {
        let baseClass = message.message_type === 'admin_message' ? 'admin-message' : 'artist-message';
        if (message.message_format === 'announce_hold') {
            baseClass += ' announce-hold-message';
        }
        return baseClass;
    };

    const getGenreLabel = (genreValue, genres) => {
        if (!genres.length || !genreValue) return genreValue || '';
        const genre = genres.find(g => g.value === genreValue);
        return genre ? genre.label : genreValue;
    };

    const fetchAdminName = async (adminId) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/user/${adminId}`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching admin user name:', error);
            setError('管理者名の取得に失敗しました。');
            return null;
        }
    };

    const fetchNicknamePermissionStatus = async (artistId) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/nickname-permission-status/${artistId}`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setIsNicknameAllowed(data.isAllowed);
            } else {
                setIsNicknameAllowed(false);
            }
        } catch (error) {
            console.error('Error fetching nickname permission status:', error);
            setIsNicknameAllowed(false);
        }
    };

    const markMessagesAsRead = async (artistId) => {
        try {
            await fetch(`${API_URL}/api/admin/messages/is-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ artistId })
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const formatMessageContent = (content) => {
        if (!content) return '';
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        return content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line.split(urlPattern).map((part, index) =>
                    urlPattern.test(part) ? (
                        <a key={index} href={part} target="_blank" rel="noopener noreferrer">
                            {part}
                        </a>
                    ) : (
                        part
                    )
                )}
                <br />
            </React.Fragment>
        ));
    };

    const handleImageClick = (imageUrl) => {
        const index = imageUrls.indexOf(imageUrl);
        if (index !== -1) {
            setCurrentImageIndex(index);
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const showPrevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1));
    };

    const showNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1));
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/messages/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    artistId: selectedArtist.artist_id,
                    content: newMessage,
                    adminUserId: adminUserId,
                }),
            });
            setNewMessage('');
            await fetchInitialMessages(selectedArtist.artist_id); // 新しいメッセージを取得
        } catch (error) {
            console.error('Error sending message:', error);
            setError('メッセージの送信に失敗しました。');
        }
    };

    const handleImageUpload = async (event) => {
        const files = event.target.files;
        if (files.length > 5) {
            alert('画像は5枚までしか選択できません。');
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        formData.append('artistId', selectedArtist.artist_id);

        try {
            setIsUploading(true);
            const response = await fetch(`${API_URL}/api/admin/messages/images`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setIsUploading(false);
                await fetchInitialMessages(selectedArtist.artist_id);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error sending image message:', error);
            setError('画像の送信に失敗しました。');
            setIsUploading(false);
        }
    };

    const handleSettingsButtonClick = () => {
        setShowSettingsModal(!showSettingsModal);
    };

    const handleNicknamePermissionChange = async () => {
        const newPermissionStatus = !isNicknameAllowed;
        setIsNicknameAllowed(newPermissionStatus);
        try {
            const method = newPermissionStatus ? 'POST' : 'DELETE';
            const response = await fetch(`${API_URL}/api/admin/nickname-permission`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    artistId: selectedArtist.artist_id,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to update nickname permission');
            }
            await fetchNicknamePermissionStatus(selectedArtist.artist_id);
        } catch (error) {
            console.error('Error updating nickname permission:', error);
            setError('ニックネーム許可の更新に失敗しました。');
        }
    };

    const getProfileImageStyle = (artist) => {
        if (artist.profile_picture) {
            return {
                backgroundImage: `url(${API_URL}${ARTIST_PROFILE_IMAGE_PATH}${artist.profile_picture})`,
                backgroundSize: 'cover',
            };
        } else {
            let backgroundColor = '#d3d3d3';
            if (artist.gender === 'male') {
                backgroundColor = '#add8e6';
            } else if (artist.gender === 'female') {
                backgroundColor = '#ffc0cb';
            }
            return {
                backgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#fff',
            };
        }
    };

    const handleDownload = (imageUrl) => {
        fetch(imageUrl)
            .then((response) => response.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', imageUrl.split('/').pop());
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch((e) => console.error('Download error:', e));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.altKey) {
            e.preventDefault();
            setNewMessage((prev) => prev + '\n');
            setTimeout(() => {
                const textarea = e.target;
                textarea.scrollTop = textarea.scrollHeight;
            }, 0);
        } else if (e.key === 'Enter' && e.altKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handlePartFilterChange = (e) => {
        setPartFilter(e.target.value);
    };

    const handleGroupFilterChange = (e) => {
        setGroupFilter(e.target.value);
    };

    const handleNameFilterChange = (e) => {
        setNameFilter(e.target.value);
    };

    const updateUnreadMessages = (artistId) => {
        setArtists((prevArtists) => {
            const updatedArtists = prevArtists.map((artist) =>
                artist.artist_id === artistId
                    ? { ...artist, unread_messages: artistId !== selectedArtist?.artist_id ? (parseInt(artist.unread_messages, 10) || 0) + 1 : artist.unread_messages }
                    : artist
            );

            const movedArtist = updatedArtists.find(artist => artist.artist_id === artistId);
            const remainingArtists = updatedArtists.filter(artist => artist.artist_id !== artistId);

            return [movedArtist, ...remainingArtists];
        });
    };

    const imageMessages = messages.filter((message) => message.message_format === 'image' && message.image_file_name);
    const imageUrls = imageMessages.map((message) => `${API_URL}${MESSAGE_IMAGE_PATH}/${message.image_file_name}`);

    const filteredArtists = artists.filter((artist) => {
        const partMatch = partFilter ? artist.part_labels && artist.part_labels.includes(partFilter) : true;
        const groupMatch = groupFilter ? artist.group_ids && artist.group_ids.includes(parseInt(groupFilter)) : true;
        const nameMatch = nameFilter ? artist.name.toLowerCase().includes(nameFilter.toLowerCase()) : true;
        return partMatch && groupMatch && nameMatch;
    });

    return (
        <div className="admin-dashboard height-display">
            <AdminSidebar />
            <div className="admin-message-container">
                <div className="admin-message-sidebar">
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <div className="filter-container">
                        <input
                            type="text"
                            value={nameFilter}
                            onChange={handleNameFilterChange}
                            placeholder="名前で絞り込み"
                            className="filter-input"
                        />
                        <select id="partFilter" value={partFilter} onChange={handlePartFilterChange} className="filter-select">
                            <option value="">すべてのパート</option>
                            {parts.map((part) => (
                                <option key={part.value} value={part.label}>
                                    {part.label}
                                </option>
                            ))}
                        </select>
                        <select id="groupFilter" value={groupFilter} onChange={handleGroupFilterChange} className="filter-select">
                            <option value="">すべてのグループ</option>
                            {groups.map((group) => (
                                <option key={group.group_id} value={group.group_id}>
                                    {group.group_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ul>
                        {filteredArtists.map((artist) => (
                            <li
                                key={artist.artist_id}
                                onClick={() => handleArtistClick(artist)}
                                className={selectedArtist && selectedArtist.artist_id === artist.artist_id ? 'active' : ''}
                            >
                                <div>
                                    {artist.part_short_name && <span className="badge">{artist.part_short_name}</span>}
                                    {artist.name}
                                </div>
                                {artist.unread_messages > 0 && <span className="new-message-badge">{artist.unread_messages}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="admin-message-chat-container">
                    <div className="admin-message-chat-header">
                        <div className="profile-info">
                            {selectedArtist && (
                                <div className="profile-image" style={getProfileImageStyle(selectedArtist)}>
                                    {!selectedArtist.profile_picture && selectedArtist.name.charAt(0)}
                                </div>
                            )}
                            <div className="artist-info">
                                {selectedArtist ? `${selectedArtist.name}` : 'アーティストを選択してください'}
                                {selectedArtist && selectedArtist.part_label && <span className="badge">{selectedArtist.part_label}</span>}
                            </div>
                        </div>
                        {selectedArtist && (
                            <button onClick={handleSettingsButtonClick} className="settings-button">
                                設定
                            </button>
                        )}
                    </div>
                    <div className="admin-message-chat-messages" ref={chatContainerRef}>
                        {messages.map((message, index) => (
                            <div className="admin-message-chat-message-wrapper" key={index}>
                                <div className={`admin-message-chat-message ${message.className}`}>
                                    {message.message_format === 'announce_hold' ? (
                                        <>
                                            <p className='announce-hold-txt'>オファーを送りました</p>
                                            {message.event_flyer_front_url && (
                                                <img
                                                    src={`${API_URL}${FLYER_IMAGE_PATH}/${message.event_flyer_front_url}`}
                                                    alt="イベントフライヤー"
                                                    className="flyer-image"
                                                    onClick={() => handleImageClick(`${API_URL}${MESSAGE_IMAGE_PATH}/${message.event_flyer_front_url}`)}
                                                />
                                            )}
                                            <p className="event-name">{message.event_name}</p>
                                            <p className="event-performance-type">{message.event_performance_type}</p>
                                            <p className="event-date-time">
                                                {`${new Date(message.event_date).toLocaleDateString('ja-JP')} ${message.event_start_time ? message.event_start_time.slice(0, 5) : ''}`}
                                            </p>
                                            <p className="event-venue">{message.event_venue}</p>
                                            <p className="event-genre">{message.genreLabel}</p>
                                        </>
                                    ) : message.message_format === 'image' ? (
                                        message.image_file_name ? (
                                            <>
                                                <img
                                                    src={`${API_URL}${MESSAGE_IMAGE_PATH}/${message.image_file_name}`}
                                                    alt="メッセージ画像"
                                                    onClick={() => handleImageClick(`${API_URL}${MESSAGE_IMAGE_PATH}/${message.image_file_name}`)}
                                                />
                                                <div className="download-container">
                                                    <span
                                                        className="image-download-link"
                                                        onClick={() => handleDownload(`${API_URL}${MESSAGE_IMAGE_PATH}/${message.image_file_name}`)}
                                                    >
                                                        ダウンロード
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <span>画像の保存期間は1週間です。</span>
                                        )
                                    ) : (
                                        <div>{formatMessageContent(message.content)}</div>
                                    )}
                                    {message.is_read && message.message_type === 'admin_message' && (
                                        <span className="message-read-status">既読</span>
                                    )}
                                </div>
                                <div className={`message-meta ${message.className}`}>
                                    <span className="message-time">
                                        {new Date(message.created_at).toLocaleString('ja-JP', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    {message.message_type === 'admin_message' && <span className="message-sender">{message.admin_name}</span>}
                                </div>
                            </div>
                        ))}
                        {isUploading && <div className="loading-indicator">画像を送信中...</div>}
                    </div>
                    {selectedArtist && (
                        <div className="admin-message-chat-input">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="メッセージを入力..."
                                rows="3"
                                style={{ resize: 'none' }}
                            />
                            <button onClick={handleSendMessage}>送信</button>
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                                id="image-upload-input"
                                max="5"
                            />
                            <label htmlFor="image-upload-input" className="image-upload-button">
                                画像選択
                            </label>
                        </div>
                    )}
                </div>

                {showSettingsModal && (
                    <div className="settings-modal">
                        <div className="settings-modal-content">
                            <button className="close-button" onClick={() => setShowSettingsModal(false)}>
                                ×
                            </button>
                            <label>
                                <input type="checkbox" checked={isNicknameAllowed} onChange={handleNicknamePermissionChange} />
                                ニックネームを許可する
                            </label>
                        </div>
                    </div>
                )}
                {isModalOpen && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={closeModal}>
                                ×
                            </button>
                            <button className="modal-prev" onClick={showPrevImage}>
                                &lt;
                            </button>
                            <img
                                src={imageUrls[currentImageIndex]}
                                alt="メッセージ画像プレビュー"
                                className="modal-image"
                            />
                            <button className="modal-next" onClick={showNextImage}>
                                &gt;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;

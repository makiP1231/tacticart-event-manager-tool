import React, { useState, useEffect, useRef, useCallback } from 'react';
import ArtistSidebar from './ArtistSidebar';
import '../../css/artist/Messages.css';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL;
const MESSAGE_IMAGE_PATH = process.env.REACT_APP_MESSAGE_IMAGE_PATH;
const FLYER_IMAGE_PATH = process.env.REACT_APP_FLYER_IMAGE_PATH;

const socket = io(API_URL);

const ArtistMessages = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [genres, setGenres] = useState([]);
    const chatContainerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 20;
    const [isFetching, setIsFetching] = useState(false);
    const isFetchingRef = useRef(isFetching);

    useEffect(() => {
        isFetchingRef.current = isFetching; // 現在のフェッチ状態をrefに同期
    }, [isFetching]);

    const scrollToTop = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = 0;
            }
        }, 100);
    };

    const fetchInitialMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/api/artist/messages/0/${limit}`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                const messagesWithClassNames = data.messages
                    .filter(message => message.content !== null || message.image_id !== null || message.message_format === 'announce_hold')
                    .map((message) => {
                        return {
                            ...message,
                            className: getMessageClass(message),
                            genreLabel: message.message_format === 'announce_hold' ? getGenreLabel(message.event_genre, genres) : undefined
                        };
                    });
                setMessages(messagesWithClassNames);
                setOffset(messagesWithClassNames.length);
                scrollToTop();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError('メッセージの取得に失敗しました。');
        }
    };

    const fetchMoreMessages = async () => {
        if (isFetchingRef.current) return;
        setIsFetching(true);

        try {
            const response = await fetch(`${API_URL}/api/artist/messages/${offset}/${limit}`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                const newMessages = data.messages
                    .filter(message => message.content !== null || message.image_id !== null || message.message_format === 'announce_hold')
                    .map((message) => {
                        return {
                            ...message,
                            className: getMessageClass(message),
                            genreLabel: message.message_format === 'announce_hold' ? getGenreLabel(message.event_genre, genres) : undefined
                        };
                    });
                setMessages(prevMessages => [...prevMessages, ...newMessages]);
                setOffset(prevOffset => prevOffset + newMessages.length);
                setHasMore(data.messages.length === limit);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching more messages:', error);
            setError('メッセージの取得に失敗しました。');
        } finally {
            setIsFetching(false);
        }
    };

    const handleScroll = useCallback(() => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isCloseToBottom = scrollHeight - clientHeight + scrollTop < 50;
            if (isCloseToBottom && hasMore && !isFetchingRef.current) {
                fetchMoreMessages();
            }
        }
    }, [hasMore, fetchMoreMessages]);

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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.altKey) {
            e.preventDefault();
            handleSendMessage();
        } else if (e.key === 'Enter' && !e.altKey) {
            setNewMessage((prev) => prev + '\n');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch(`${API_URL}/api/artist/messages/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    content: newMessage,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setNewMessage('');
                await fetchInitialMessages(); // メッセージ送信後にサーバーから最新メッセージを取得
                scrollToTop();
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setError('メッセージの送信に失敗しました。');
        }
    };

    const handleImageUpload = async (event) => {
        const files = event.target.files;
        if (files.length > 5) {
            alert('画像は最大5枚まで送信できます');
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        try {
            setIsUploading(true);
            const response = await fetch(`${API_URL}/api/artist/messages/images`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setIsUploading(false);
                fetchInitialMessages();
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error sending image message:', error);
            setError('画像の送信に失敗しました。');
            setIsUploading(false);
        }
    };

    const handleImageClick = (imageUrl) => {
        const index = imageUrls.indexOf(imageUrl);
        if (index !== -1) {
            setCurrentImageIndex(index);
            setIsModalOpen(true);
        }
    };

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('new_message', async () => {
            await fetchInitialMessages();
            await markMessagesAsRead();
        });

        socket.on('messages-read', (data) => {
            const { readMessageIds } = data;
            if (readMessageIds) {
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
    }, []);

    const getMessageClass = (message) => {
        let baseClass = message.message_type === 'admin_message' ? 'admin-message' : 'artist-message';
        if (message.message_format === 'announce_hold') {
            baseClass += ' announce-hold-message';
        }
        return baseClass;
    };

    const markMessagesAsRead = async () => {
        try {
            await fetch(`${API_URL}/api/artist/messages/is-read`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const getGenreLabel = (genreValue, genres) => {
        if (!genres.length) return genreValue;
        const genre = genres.find(g => g.value === genreValue);
        return genre ? genre.label : genreValue;
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

    const formatMessageContent = (content) => {
        if (!content) return null;
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

    const imageMessages = messages.filter((message) => message.message_format === 'image' && message.image_file_name);
    const imageUrls = imageMessages.map((message) => `${API_URL}${MESSAGE_IMAGE_PATH}/${message.image_file_name}`);

    const handleMainChatClick = async () => {
        await fetchInitialMessages();
        await markMessagesAsRead();
    };

    return (
        <div className="artist-dashboard height-display">
            <ArtistSidebar />
            <div className="artist-message-container">
                <div className="artist-message-sidebar">
                    <ul>
                        <li className="active" onClick={handleMainChatClick}>
                            メインチャット
                            {messages.filter((msg) => msg.message_type === 'admin_message' && !msg.is_read).length > 0 && (
                                <span className="new-message-badge">
                                    {messages.filter((msg) => msg.message_type === 'admin_message' && !msg.is_read).length}
                                </span>
                            )}
                        </li>
                    </ul>
                </div>
                <div className="artist-message-chat-container">
                    <div className="artist-message-chat-messages" ref={chatContainerRef}>
                        {messages.map((message, index) => (
                            <div className={`artist-message-chat-message-wrapper`} key={index}>
                                <div className={`artist-message-chat-message ${message.className}`}>
                                    {message.message_format === 'announce_hold' ? (
                                        <>
                                            <p className='announce-hold-txt'>オファーが届きました</p>
                                            {message.event_flyer_front_url && (
                                                <img
                                                    src={`${API_URL}${FLYER_IMAGE_PATH}/${message.event_flyer_front_url}`}
                                                    alt="イベントフライヤー"
                                                    className="flyer-image"
                                                    onClick={() => handleImageClick(`${API_URL}${FLYER_IMAGE_PATH}/${message.event_flyer_front_url}`)}
                                                />
                                            )}
                                            <p className="event-name">{message.event_name}</p>
                                            <p className="event-performance-type">{message.event_performance_type}</p>
                                            <p className="event-date-time">
                                                {`${new Date(message.event_date).toLocaleDateString('ja-JP')} ${message.event_start_time.slice(0, 5)}`}
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
                                    {message.is_read && message.message_type === 'artist_message' && (
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
                                            minute: '2-digit',
                                        })}
                                    </span>
                                    {message.message_type === 'admin_message' && (
                                        <span className="message-sender">
                                            {message.is_nickname_allowed ? message.admin_nickname : message.admin_full_name || ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isUploading && <div className="loading-indicator">画像を送信中...</div>}
                    </div>
                    <div className="artist-message-chat-input">
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
                        />
                        <label htmlFor="image-upload-input" className="image-upload-button">
                            画像選択
                        </label>
                    </div>
                </div>
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

export default ArtistMessages;

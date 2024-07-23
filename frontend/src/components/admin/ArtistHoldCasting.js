import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { v4 as uuidv4 } from 'uuid';
import '../../css/admin/ArtistHoldCasting.css';

function HoldCasting() {
    const [formData, setFormData] = useState({
        eventId: '',
        artistIds: [],
        dates: [{ date: '', note: '' }],
        compensation: '',
        message: ''
    });
    const [events, setEvents] = useState([]);
    const [artists, setArtists] = useState([]);
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupArtists, setGroupArtists] = useState([]);
    const [castingInfo, setCastingInfo] = useState(null);
    const [parts, setParts] = useState([]);
    const [submitStatus, setSubmitStatus] = useState('');
    const [existingHoldArtists, setExistingHoldArtists] = useState([]);
    const [temporaryMessage, setTemporaryMessage] = useState({});
    const [artistHoldStatus, setArtistHoldStatus] = useState({});
    const [genres, setGenres] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [selectedParts, setSelectedParts] = useState([]);
    const [showPartPopup, setShowPartPopup] = useState(false);
    const [showPopupMessage, setShowPopupMessage] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchInitialData = () => {
        fetch(`${API_URL}/api/events/upcoming`)
            .then(response => response.json())
            .then(data => setEvents(data.events))
            .catch(error => console.error('Error fetching events:', error));

        fetch(`${API_URL}/api/admin/artists`)
            .then(response => response.json())
            .then(data => {
                const filteredArtists = data.artists.filter(artist => artist.email);
                setArtists(filteredArtists);
            })
            .catch(error => console.error('Error fetching artists:', error));

        fetch(`${API_URL}/api/artist-groups`)
            .then(response => response.json())
            .then(data => setGroups(data || []))
            .catch(error => console.error('Error fetching groups:', error));

        fetch(`${API_URL}/api/parts`)
            .then(response => response.json())
            .then(data => {
                const sortedParts = data.sort((a, b) => a.sort_order - b.sort_order);
                setParts(sortedParts);
            })
            .catch(error => console.error('Error fetching parts:', error));

        fetch(`${API_URL}/api/genres`)
            .then(response => response.json())
            .then(data => setGenres(data))
            .catch(error => console.error('Error fetching genres:', error));
    };

    useEffect(() => {
        fetchInitialData();
    }, [API_URL]);

    useEffect(() => {
        if (selectedGroup) {
            fetch(`${API_URL}/api/groups/${selectedGroup}/artists`)
                .then(response => response.json())
                .then(data => {
                    setGroupArtists(data.artists || []);
                })
                .catch(error => {
                    console.error('Error fetching group artists:', error);
                    setGroupArtists([]);
                });
        } else {
            setGroupArtists([]);
        }
    }, [selectedGroup, API_URL]);

    const getShortName = (partValue) => {
        const part = parts.find(p => p.value === partValue);
        return part ? part.short_name : '';
    };

    const getGenreLabel = (value) => {
        const genre = genres.find(g => g.value === value);
        return genre ? genre.label : value;
    };

    const handleInputChange = async (event) => {
        const { name, value } = event.target;

        if (name === 'eventId') {
            const selectedEvent = events.find(event => event.event_uuid === value);
            if (selectedEvent) {
                fetch(`${API_URL}/api/events/${value}/hold-artists-statuses`)
                    .then(response => response.json())
                    .then(data => {
                        const holdStatus = {};
                        const newExistingHoldArtists = data.map(artist => artist.artist_id);
                        data.forEach(artist => {
                            holdStatus[artist.artist_id] = artist.status;
                        });
                        setArtistHoldStatus(holdStatus);
                        setExistingHoldArtists(newExistingHoldArtists);

                        const updatedSelectedArtists = selectedArtists.filter(artistId => !newExistingHoldArtists.includes(artistId));
                        setSelectedArtists(updatedSelectedArtists);

                        setFormData({
                            ...formData,
                            [name]: value,
                            artistIds: updatedSelectedArtists,
                            dates: [{ date: selectedEvent.event_date.split('T')[0], note: '本番日' }]
                        });
                    })
                    .catch(error => console.error('Error fetching hold artists statuses:', error));

                const additionalDatesResponse = await fetch(`${API_URL}/api/events/${value}/additional-dates`);
                const additionalDatesData = await additionalDatesResponse.json();

                const additionalDates = additionalDatesData.map(date => ({
                    date: date.additional_date.split('T')[0],
                    note: `${date.additional_date_title} ${date.description}`
                }));

                setFormData({
                    ...formData,
                    [name]: value,
                    dates: [
                        { date: selectedEvent.event_date.split('T')[0], note: '本番日' },
                        ...additionalDates
                    ]
                });
            }

            fetch(`${API_URL}/api/events/${value}/castings`)
                .then(response => response.json())
                .then(data => setCastingInfo(data))
                .catch(error => console.error('Error fetching casting info:', error));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const togglePartSelection = (part) => {
        setSelectedParts(prev => {
            if (prev.includes(part)) {
                return prev.filter(p => p !== part);
            } else {
                return [...prev, part];
            }
        });
    };

    const handleArtistClick = (artist) => {
        if (existingHoldArtists.includes(artist.artist_id)) {
            const status = artistHoldStatus[artist.artist_id];
            let message = "仮押さえ申請済み";
            if (status === 'approved') {
                message = "仮押さえ承認済み";
            } else if (status === 'rejected') {
                message = "仮押さえ否認済み";
            }
            setTemporaryMessage(prev => ({ ...prev, [artist.artist_id]: message }));
            setTimeout(() => {
                setTemporaryMessage(prev => ({ ...prev, [artist.artist_id]: "" }));
            }, 2000);
            return;
        }
        setSelectedArtists([...selectedArtists, artist.artist_id]);
        setFormData({ ...formData, artistIds: [...formData.artistIds, artist.artist_id] });
    };

    const handleRemoveArtist = (artistId) => {
        setSelectedArtists(selectedArtists.filter(id => id !== artistId));
        setFormData({ ...formData, artistIds: formData.artistIds.filter(id => id !== artistId) });
    };

    const handleSelectAll = () => {
        const newSelectedArtists = [...new Set([...selectedArtists, ...filteredArtists.map(artist => {
            return existingHoldArtists.includes(artist.artist_id) ? null : artist.artist_id;
        }).filter(id => id !== null)])];

        setSelectedArtists(newSelectedArtists);
        setFormData({ ...formData, artistIds: newSelectedArtists });
    };

    const handleRemoveAllArtists = () => {
        setSelectedArtists([]);
        setFormData({ ...formData, artistIds: [] });
    };

    const handleDateChange = (index, field, value) => {
        const newDates = [...formData.dates];
        newDates[index][field] = value;
        setFormData({ ...formData, dates: newDates });
    };

    const addDate = () => {
        setFormData({ ...formData, dates: [...formData.dates, { date: '', note: '' }] });
    };

    const handleRemoveDate = (index) => {
        const newDates = formData.dates.filter((_, i) => i !== index);
        setFormData({ ...formData, dates: newDates });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const { eventId, artistIds, dates, compensation, message } = formData;

        const holdCastingId = uuidv4();

        const data = {
            id: holdCastingId,
            eventId,
            artistIds,
            dates,
            compensation: compensation || 0,
            message
        };

        try {
            const response = await fetch(`${API_URL}/api/casting/hold-casting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            console.log(result.message);
            setFormData({
                eventId: '',
                artistIds: [],
                dates: [{ date: '', note: '' }],
                compensation: '',
                message: ''
            });
            setSelectedArtists([]);
            setSubmitStatus('仮押さえを送信しました。');
            setShowPopupMessage(true);
            setTimeout(() => {
                setShowPopupMessage(false);
                setSubmitStatus('');
            }, 3000);
        } catch (error) {
            console.error('Error submitting hold casting:', error);
        }
    };

    const filteredArtists = artists.filter(artist => {
        const matchesName = artist.name.includes(nameFilter);
        const matchesParts = selectedParts.length === 0 || artist.parts.some(part => selectedParts.includes(part));
        const matchesGroup = selectedGroup === '' || groupArtists.includes(artist.artist_id);
        return matchesName && matchesParts && matchesGroup && !selectedArtists.includes(artist.artist_id);
    }).sort((a, b) => {
        const partA = parts.find(part => part.value === a.parts[0]);
        const partB = parts.find(part => part.value === b.parts[0]);
        return (partA?.sort_order || 0) - (partB?.sort_order || 0);
    });

    const renderTable = () => {
        if (!castingInfo) return null;

        const chunkSize = 10;
        const headers = castingInfo.castings.map(casting => casting.part);
        const data = castingInfo.castings.map(casting => `${casting.sent_contract_count + casting.signed_contract_count}(${casting.signed_contract_count})/${casting.number}`);

        const rows = [];
        for (let i = 0; i < headers.length; i += chunkSize) {
            rows.push({
                headers: headers.slice(i, i + chunkSize),
                data: data.slice(i, i + chunkSize)
            });
        }

        return (
            <div>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="table-block">
                        <table>
                            <thead>
                                <tr>
                                    {row.headers.map((header, headerIndex) => (
                                        <th key={headerIndex}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {row.data.map((dataItem, dataIndex) => (
                                        <td key={dataIndex}>{dataItem}</td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}
                <p className="msg-txt">本キャスティング数(契約済み)/必要人数 </p>
            </div>
        );
    };

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="hold-casting-container">
                <h1>仮押さえフォーム</h1>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>イベント選択:</label>
                        <select
                            name="eventId"
                            value={formData.eventId}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="" disabled>イベントを選択してください</option>
                            {events.map(event => (
                                <option key={event.event_uuid} value={event.event_uuid}>
                                    {event.genre ? `${getGenreLabel(event.genre)} : ` : ''}
                                    {event.event_date ? `${new Date(event.event_date).toLocaleDateString()} : ` : ''}
                                    {event.name} 
                                    {event.performance_type ? ` [${event.performance_type}]` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    {castingInfo && (
                        <div className="casting-info">
                            {renderTable()}
                        </div>
                    )}
                    <div>
                        <label>選択されたアーティスト: {selectedArtists.length}人</label>
                        <div className="selected-artists">
                            {selectedArtists.map(artistId => {
                                const artist = artists.find(a => a.artist_id === artistId);
                                return (
                                    <div key={artistId} className="selected-artist">
                                        {getShortName(artist.parts[0])}：{artist.name}
                                        <span className="remove-btn" onClick={() => handleRemoveArtist(artistId)}>✕</span>
                                    </div>
                                );
                            })}
                            {selectedArtists.length > 0 && (
                                <div className="remove-all-artists" onClick={handleRemoveAllArtists}>
                                    すべての選択を解除
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label>アーティストグループを選択:</label>
                        <select
                            name="group"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">グループを選択してください</option>
                            {groups.map(group => (
                                <option key={group.group_id} value={group.group_id}>{group.group_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>名前で絞る:</label>
                        <input
                            type="text"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="名前で検索"
                        />
                    </div>
                    <button type="button" className="btn-filter-parts" onClick={() => setShowPartPopup(true)}>パートで絞る</button>

                    <div className="artist-selection-container">
                        <label>アーティストを選択:</label>
                        <div className="artist-selection">
                            <div className="artist-badge select-all" onClick={handleSelectAll}>
                                すべてを選択
                            </div>
                            {filteredArtists.map(artist => {
                                const status = artistHoldStatus[artist.artist_id];
                                let badgeClass = 'artist-badge';
                                if (existingHoldArtists.includes(artist.artist_id)) {
                                    badgeClass += status === 'approved' ? ' approved' : status === 'rejected' ? ' rejected' : ' existing-hold';
                                }
                                return (
                                    <div
                                        key={artist.artist_id}
                                        className={`${badgeClass} ${selectedArtists.includes(artist.artist_id) ? 'selected' : ''}`}
                                        onClick={() => handleArtistClick(artist)}
                                    >
                                        {temporaryMessage[artist.artist_id] || `${getShortName(artist.parts[0])}：${artist.name}`}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label>日程設定:</label>
                        {formData.dates.map((date, index) => (
                            <div key={index} className="date-entry">
                                <input
                                    type="date"
                                    value={date.date}
                                    onChange={e => handleDateChange(index, 'date', e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    value={date.note}
                                    onChange={e => handleDateChange(index, 'note', e.target.value)}
                                    placeholder="備考欄：おおよその時間や内容等を入力してください。"
                                />
                                {index > 0 && (
                                    <button type="button" onClick={() => handleRemoveDate(index)}>削除</button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="add-date-button" onClick={addDate}>日程を追加</button>
                    </div>

                    <div>
                        <label>報酬:</label>
                        <input
                            type="text"
                            name="compensation"
                            value={formData.compensation}
                            onChange={handleInputChange}
                            placeholder="報酬額を入力 ※未決定の場合や個別に連絡する場合は空欄"
                        />
                    </div>

                    <div>
                        <label>メッセージ:</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="公演の概要、募集の要項等を入力"
                            required
                        />
                    </div>

                    <button type="submit">仮押さえ申請を送信</button>
                </form>
                {submitStatus && <p>{submitStatus}</p>}
                {showPopupMessage && (
                    <div className="popup-message">
                        <p>仮押さえを送信しました。</p>
                    </div>
                )}
                {showPartPopup && (
                    <div className="popup-background">
                        <div className="part-popup">
                            <h3>パートで絞る</h3>
                            <div className="part-list">
                                {parts.map(part => (
                                    <div
                                        key={part.value}
                                        className={`part-item ${selectedParts.includes(part.value) ? 'selected' : ''}`}
                                        onClick={() => togglePartSelection(part.value)}
                                    >
                                        {part.short_name}
                                    </div>
                                ))}
                            </div>
                            <button className="close-popup-button" onClick={() => setShowPartPopup(false)}>閉じる</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HoldCasting;

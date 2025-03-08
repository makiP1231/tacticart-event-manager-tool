import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import '../../css/admin/HoldCastingArtist.css';

function HoldCasting() {
  const [formData, setFormData] = useState({
    subject: '',
    artistIds: [],
    events: [
      {
        eventId: '',
        dates: [{ date: '', note: '' }],
        isAllEventsRequired: false,
        activeTab: 'flyerAndSchedule',
      },
    ],
    message: '',
    isAllEventsRequired: false,
    artistFees: {},
    artistMessages: {},
    responseDeadline: ''
  });
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupArtists, setGroupArtists] = useState([]);
  const [castingInfo, setCastingInfo] = useState({});
  const [parts, setParts] = useState([]);
  const [submitStatus, setSubmitStatus] = useState('');
  const [existingHoldArtists, setExistingHoldArtists] = useState([]);
  const [artistHoldStatus, setArtistHoldStatus] = useState({});
  const [genres, setGenres] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [showPartPopup, setShowPartPopup] = useState(false);
  const [showArtistPopup, setShowArtistPopup] = useState(false);
  const [showPopupMessage, setShowPopupMessage] = useState(false);
  const [flyerUrls, setFlyerUrls] = useState({});
  const [preventDoubleSubmission, setPreventDoubleSubmission] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;
  const FLYER_IMAGE_PATH = process.env.REACT_APP_FLYER_IMAGE_PATH;

  // 初期データ取得（イベント、パート、アーティスト、グループ、ジャンル、フライヤーURL）
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // イベント取得
      const response = await fetch(`${API_URL}/api/events/upcoming`);
      const data = await response.json();
      const eventsData = data.events;
      const flyers = await generateFlyerUrls(eventsData);
      setEvents(eventsData);
      setFlyerUrls(flyers);

      // パート情報取得
      const partsResponse = await fetch(`${API_URL}/api/parts`);
      const partsData = await partsResponse.json();
      const sortedParts = partsData.sort((a, b) => a.sort_order - b.sort_order);
      setParts(sortedParts);

      // アーティスト取得（※メールアドレスが存在する＝本登録済みと判断）
      const artistsResponse = await fetch(`${API_URL}/api/admin/artists`);
      const artistsData = await artistsResponse.json();
      const filteredArtistsData = artistsData.artists.filter(
        (artist) => artist.email && artist.email.trim() !== ""
      );
      setArtists(filteredArtistsData);

      // グループ取得
      const groupsResponse = await fetch(`${API_URL}/api/artist-groups`);
      const groupsData = await groupsResponse.json();
      setGroups(groupsData || []);

      // ジャンル取得
      const genresResponse = await fetch(`${API_URL}/api/genres`);
      const genresData = await genresResponse.json();
      setGenres(genresData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFlyerUrls = async (events) => {
    const urls = {};
    for (const event of events) {
      if (
        event.performance_flag === 'additional' &&
        event.use_existing_flyers &&
        event.original_event_uuid
      ) {
        const originalEvent = events.find(
          (e) => e.event_uuid === event.original_event_uuid
        );
        if (originalEvent) {
          urls[event.event_uuid] = getImageUrl(originalEvent.flyer_front_url);
        }
      } else {
        urls[event.event_uuid] = getImageUrl(event.flyer_front_url);
      }
    }
    return urls;
  };

  const getImageUrl = (filename) => {
    return filename
      ? `${API_URL}${FLYER_IMAGE_PATH}${filename}`
      : `${API_URL}/images/placeholders/${getRandomPlaceholder()}`;
  };

  const getRandomPlaceholder = () => {
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
      'noimagepic18.jpg',
    ];
    const randomIndex = Math.floor(Math.random() * placeholderImages.length);
    return placeholderImages[randomIndex];
  };

  useEffect(() => {
    fetchInitialData();
  }, [API_URL]);

  // グループ変更時の処理
  useEffect(() => {
    if (selectedGroup) {
      fetch(`${API_URL}/api/groups/${selectedGroup}/artists`)
        .then((response) => response.json())
        .then((data) => {
          setGroupArtists(data.artists || []);
          filterAndSortArtists(data.artists || []);
        })
        .catch((error) => {
          console.error('Error fetching group artists:', error);
          setGroupArtists([]);
          filterAndSortArtists([]);
        });
    } else {
      setGroupArtists([]);
      filterAndSortArtists([]);
    }
  }, [selectedGroup]);

  useEffect(() => {
    formData.events.forEach((event) => {
      if (event.eventId) {
        fetchHoldArtistsStatuses(event.eventId);
      }
    });
  }, [formData.events]);

  useEffect(() => {
    sortArtists(artists);
  }, [artists]);

  useEffect(() => {
    filterAndSortArtists();
  }, [
    nameFilter,
    selectedParts,
    selectedGroup,
    preventDoubleSubmission,
    formData.events,
    artistHoldStatus,
  ]);

  const getShortName = (partValue) => {
    const part = parts.find((p) => p.value === partValue);
    return part ? part.short_name : '';
  };

  const getGenreLabel = (value) => {
    const genre = genres.find((g) => g.value === value);
    return genre ? genre.label : value;
  };

  const handleInputChange = (event, eventIndex, dateIndex = null, field = null) => {
    const { name, value } = event.target;
    if (name === 'eventId') {
      const newEvents = [...formData.events];
      newEvents[eventIndex].eventId = value;
      setFormData({ ...formData, events: newEvents });
      const selectedEventObj = events.find((e) => e.event_uuid === value);
      if (selectedEventObj) {
        fetchAdditionalEventDetails(value, newEvents, eventIndex, selectedEventObj.event_date);
      }
      fetchCastingInfo(value, eventIndex);
      if (preventDoubleSubmission) {
        fetchHoldArtistsStatuses(value);
      }
    } else if (field) {
      const newEvents = [...formData.events];
      newEvents[eventIndex].dates[dateIndex][field] = value;
      setFormData({ ...formData, events: newEvents });
    } else if (
      name === 'message' ||
      name === 'isAllEventsRequired' ||
      name === 'subject'
    ) {
      setFormData({ ...formData, [name]: value });
    }
    else if (name === 'responseDeadline') {
      setFormData({ ...formData, responseDeadline: value });
    }
  };

  const fetchHoldArtistsStatuses = async (eventId) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/hold-artists-statuses`);
      const data = await response.json();
      setArtistHoldStatus((prevStatus) => ({
        ...prevStatus,
        [eventId]: data,
      }));
    } catch (error) {
      console.error('Error fetching hold artists statuses:', error);
    }
  };

  const fetchAdditionalEventDetails = async (eventId, eventsArray, eventIndex, eventDate) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/hold-artists-statuses`);
      const data = await response.json();
      setArtistHoldStatus((prevStatus) => ({
        ...prevStatus,
        [eventId]: data,
      }));
      const updatedEvents = [...eventsArray];
      updatedEvents[eventIndex].dates = [{ date: eventDate.split('T')[0], note: '本番日' }];
      setFormData({ ...formData, events: updatedEvents });
      const additionalDatesResponse = await fetch(`${API_URL}/api/events/${eventId}/additional-dates`);
      const additionalDatesData = await additionalDatesResponse.json();
      updatedEvents[eventIndex].dates.push(
        ...additionalDatesData.map((date) => ({
          date: date.additional_date.split('T')[0],
          note: date.description,
        }))
      );
      setFormData({ ...formData, events: updatedEvents });
    } catch (error) {
      console.error('Error fetching additional event details:', error);
    }
  };

  const fetchCastingInfo = async (eventId, eventIndex) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/castings`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setCastingInfo((prevCastingInfo) => ({
        ...prevCastingInfo,
        [eventIndex]: data.castings || [],
      }));
    } catch (error) {
      console.error('Error fetching casting info:', error);
    }
  };

  const renderEventOptions = (currentEventId) => {
    const selectedEventIds = formData.events.map((event) => event.eventId);
    return events
      .filter(
        (ev) =>
          ev.event_uuid === currentEventId || !selectedEventIds.includes(ev.event_uuid)
      )
      .map((ev) => (
        <option key={ev.event_uuid} value={ev.event_uuid}>
          {ev.genre ? `${getGenreLabel(ev.genre)} : ` : ''}
          {ev.event_date ? `${new Date(ev.event_date).toLocaleDateString()} : ` : ''}
          {ev.name}
          {ev.performance_type ? ` [${ev.performance_type}]` : ''}
        </option>
      ));
  };

  // 最後のイベントが選択済みの場合のみ、イベント追加ボタンを表示
  const canAddEvent = useCallback(() => {
    const lastEvent = formData.events[formData.events.length - 1];
    return !!lastEvent.eventId;
  }, [formData.events]);

  const addEvent = () => {
    setFormData({
      ...formData,
      events: [
        ...formData.events,
        {
          eventId: '',
          dates: [{ date: '', note: '' }],
          isAllEventsRequired: false,
          activeTab: 'flyerAndSchedule',
        },
      ],
    });
  };

  const removeEvent = (eventIndex) => {
    const newEvents = formData.events.filter((_, i) => i !== eventIndex);
    setFormData({ ...formData, events: newEvents });
    const newCastingInfo = { ...castingInfo };
    delete newCastingInfo[eventIndex];
    setCastingInfo(newCastingInfo);
  };

  const handlePartSelectionChange = (e) => {
    const { value } = e.target;
    if (value === '') {
      setSelectedParts([]);
    } else {
      setSelectedParts([value]);
    }
  };

  const handleArtistClick = (artistId) => {
    if (!selectedArtists.includes(artistId)) {
      setSelectedArtists((prevSelected) => {
        const newSelected = [...prevSelected, artistId];
        setFormData((prevFormData) => ({
          ...prevFormData,
          artistIds: newSelected,
        }));
        setFilteredArtists((prevFiltered) =>
          prevFiltered.filter((a) => a.artist_id !== artistId)
        );
        return newSelected;
      });
    }
  };

  const handleRemoveArtist = (artistId) => {
    setSelectedArtists((prevSelected) => {
      const newSelected = prevSelected.filter((id) => id !== artistId);
      setFormData((prevFormData) => ({
        ...prevFormData,
        artistIds: newSelected,
        artistMessages: { ...prevFormData.artistMessages, [artistId]: undefined },
      }));
      setFilteredArtists((prevFiltered) => {
        if (!prevFiltered.some((a) => a.artist_id === artistId)) {
          const artistToAdd = artists.find((a) => a.artist_id === artistId);
          return artistToAdd ? [...prevFiltered, artistToAdd] : prevFiltered;
        }
        return prevFiltered;
      });
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    setSelectedArtists((prevSelected) => {
      const allArtistIds = filteredArtists.reduce((acc, artist) => {
        if (!existingHoldArtists.includes(artist.artist_id)) {
          acc.push(artist.artist_id);
        }
        return acc;
      }, [...prevSelected]);
      const newSelectedArtists = [...new Set(allArtistIds)];
      setFormData((prevFormData) => ({
        ...prevFormData,
        artistIds: newSelectedArtists,
      }));
      setFilteredArtists([]);
      return newSelectedArtists;
    });
  };

  const handleRemoveAllArtists = () => {
    setSelectedArtists([]);
    setFormData((prevFormData) => ({
      ...prevFormData,
      artistIds: [],
      artistMessages: {},
    }));
    sortArtists(artists);
    // さらに、アーティスト選択ポップアップの絞り込みフォームも初期状態に戻す
    setNameFilter('');
    setSelectedGroup('');
    setSelectedParts([]);
  };

  // 日程追加ボタンは「最後の日付が入力済み」の場合のみ表示
  const canAddDate = (eventIndex) => {
    const eventObj = formData.events[eventIndex];
    if (!eventObj || eventObj.dates.length === 0) return false;
    const lastDate = eventObj.dates[eventObj.dates.length - 1];
    return !!lastDate.date;
  };

  const addDate = (eventIndex) => {
    const newEvents = [...formData.events];
    newEvents[eventIndex].dates.push({ date: '', note: '' });
    setFormData({ ...formData, events: newEvents });
  };

  const handleRemoveDate = (eventIndex, dateIndex) => {
    const newEvents = formData.events.map((event, i) => {
      if (i === eventIndex) {
        return {
          ...event,
          dates: event.dates.filter((_, j) => j !== dateIndex),
        };
      }
      return event;
    });
    setFormData({ ...formData, events: newEvents });
  };

  const calculateTotalCompensation = () => {
    return Object.values(formData.artistFees)
      .reduce((total, fee) => total + (parseFloat(fee) || 0), 0)
      .toLocaleString();
  };

  const handleTabChange = (eventIndex, tabName) => {
    const newEvents = formData.events.map((ev, i) => {
      if (i === eventIndex) {
        return { ...ev, activeTab: tabName };
      }
      return ev;
    });
    setFormData({ ...formData, events: newEvents });
  };

  const handleTextareaChange = (e, artistId) => {
    const { value } = e.target;
    const newMessages = { ...formData.artistMessages, [artistId]: value };
    setFormData({ ...formData, artistMessages: newMessages });
    const textarea = e.target;
    textarea.style.height = 'auto';
    const maxRows = 3;
    const rows = value.split('\n').length;
    textarea.style.height = `${Math.min(rows, maxRows) * 1.2}em`;
  };

  const handleShowConfirmationPopup = () => {
    setShowConfirmationPopup(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmationPopup(false);
  };

  // 送信時のバリデーション：各イベントには1つ以上の日付が必要（空欄は除外）
  const handleConfirmSubmit = async () => {
    setShowConfirmationPopup(false);
    const newEvents = formData.events.map((ev) => {
      const filteredDates = ev.dates.filter((d) => d.date !== '');
      return { ...ev, dates: filteredDates };
    });
    for (const ev of newEvents) {
      if (ev.eventId && ev.dates.length === 0) {
        alert('日程が設定されていないイベントがあります。日程を設定するか、イベントを削除してください。');
        return;
      }
    }
    const { artistIds, message, isAllEventsRequired, artistFees, artistMessages, subject, responseDeadline } = formData;
    const dataToSend = {
      artistIds,
      events: newEvents,
      message,
      isAllEventsRequired,
      artistFees,
      artistMessages,
      subject,
      responseDeadline
    };
    try {
      const response = await fetch(`${API_URL}/api/casting/hold-casting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      await response.json();
      setFormData({
        subject: '',
        artistIds: [],
        events: [
          {
            eventId: '',
            dates: [{ date: '', note: '' }],
            isAllEventsRequired: false,
            activeTab: 'flyerAndSchedule',
          },
        ],
        message: '',
        isAllEventsRequired: false,
        artistFees: {},
        artistMessages: {},
        responseDeadline: '',
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

  const sortArtists = (artistsArray) => {
    const sortedArtists = artistsArray.sort((a, b) => {
      const partA = parts.find((part) => part.value === a.parts[0]);
      const partB = parts.find((part) => part.value === b.parts[0]);
      return (partA?.sort_order || 0) - (partB?.sort_order || 0);
    });
    setFilteredArtists(sortedArtists);
  };

  const filterAndSortArtists = (groupArtistsList = groupArtists) => {
    let holdArtistIds = [];
    formData.events.forEach((ev) => {
      if (artistHoldStatus[ev.eventId]) {
        artistHoldStatus[ev.eventId].forEach((artist) => {
          if (artist.status !== 'cancelled') {
            holdArtistIds.push(artist.artist_id);
          }
        });
      }
    });
    const filtered = artists
      .filter((artist) => {
        const matchesName = artist.name.includes(nameFilter);
        const matchesParts =
          selectedParts.length === 0 ||
          artist.parts.some((part) => selectedParts.includes(part));
        const matchesGroup =
          selectedGroup === '' ||
          groupArtistsList.some((groupArtist) => groupArtist === artist.artist_id);
        const isNotAlreadyHold = !holdArtistIds.includes(artist.artist_id);
        return (
          matchesName &&
          matchesParts &&
          matchesGroup &&
          !selectedArtists.includes(artist.artist_id) &&
          (isNotAlreadyHold || !preventDoubleSubmission)
        );
      })
      .sort((a, b) => {
        const partA = parts.find((p) => p.value === a.parts[0]);
        const partB = parts.find((p) => p.value === b.parts[0]);
        return (partA?.sort_order || 0) - (partB?.sort_order || 0);
      });
    setFilteredArtists(filtered);
    setSelectedArtists((prevSelected) => {
      const newSelected = prevSelected.filter(
        (artistId) => !holdArtistIds.includes(artistId)
      );
      setFormData((prevFormData) => ({
        ...prevFormData,
        artistIds: newSelected,
        artistMessages: Object.fromEntries(
          Object.entries(prevFormData.artistMessages).filter(
            ([artistId]) => !holdArtistIds.includes(parseInt(artistId))
          )
        ),
      }));
      return newSelected;
    });
  };

  const handlePreventDoubleSubmissionChange = (e) => {
    const { checked } = e.target;
    setIsLoading(true);
    setPreventDoubleSubmission(checked);
    if (!checked) {
      setFilteredArtists(artists);
      setIsLoading(false);
    } else {
      filterAndSortArtists();
      setIsLoading(false);
    }
  };

  const renderCastingInfo = (eventIndex) => {
    const eventCastingInfo = castingInfo[eventIndex];
    if (!eventCastingInfo || !eventCastingInfo.length) return null;
    return (
      <div className="casting-info">
        {eventCastingInfo.map((casting, i) => (
          <div key={i} className="casting-info-row">
            <span className="casting-part">{casting.part}</span>
            <span className="casting-data">
              {`${casting.sent_contract_count + casting.signed_contract_count}(${casting.signed_contract_count})/${casting.number}`}
            </span>
          </div>
        ))}
        <p>本契約申請数(契約済数)/キャスティング数</p>
      </div>
    );
  };

  // 新規追加機能：フィルタ済みのアーティストを一括追加する
  const handleAddAllFilteredArtists = () => {
    setSelectedArtists((prevSelected) => {
      const newArtists = filteredArtists.filter(
        (artist) => !prevSelected.includes(artist.artist_id)
      );
      const newSelected = [...prevSelected, ...newArtists.map((a) => a.artist_id)];
      setFormData((prevFormData) => ({
        ...prevFormData,
        artistIds: newSelected,
      }));
      // 追加後はフィルタ済みリストから全て除去
      setFilteredArtists([]);
      return newSelected;
    });
  };

  // ポップアップ背景クリックで閉じる（子要素へのクリックは無視）
  const handlePopupBackgroundClick = (e) => {
    if (e.target.className.includes('popup-background')) {
      setShowArtistPopup(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="artist-hold-casting-container">
        {isLoading ? (
          <div className="loading-indicator">読み込み中...</div>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleShowConfirmationPopup();
              }}
            >
              <h2>仮押さえ・オファー申請</h2>

              {/* 件名セクション */}
              <div className="form-section subject-section">
                <label className="title-label" htmlFor="subject">
                  件名
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="件名を入力してください。"
                  required
                />
              </div>
              {/* 回答期限入力セクション */}
              <div className="form-section deadline-section">
                <label className="title-label" htmlFor="responseDeadline">
                  募集期限
                </label>
                <input
                  type="date"
                  name="responseDeadline"
                  value={formData.responseDeadline}
                  onChange={handleInputChange}
                  placeholder="回答期限を設定してください。"
                />
              </div>

              {/* イベント選択セクション */}
              <div className="form-section event-section">
                <label className="title-label">オファーイベント選択</label>
                {formData.events.map((event, eventIndex) => (
                  <div key={eventIndex} className="event-item">
                    <select
                      name="eventId"
                      value={event.eventId || ''}
                      onChange={(e) => handleInputChange(e, eventIndex)}
                      required
                    >
                      <option value="" disabled>
                        イベントを選択してください
                      </option>
                      {renderEventOptions(event.eventId)}
                    </select>

                    {event.eventId && (
                      <>
                        <div className="event-tabs">
                          <button
                            type="button"
                            className={`event-tab ${event.activeTab === 'flyerAndSchedule' ? 'active' : ''}`}
                            onClick={() => handleTabChange(eventIndex, 'flyerAndSchedule')}
                          >
                            押さえ日程
                          </button>
                          <button
                            type="button"
                            className={`event-tab ${event.activeTab === 'castingInfo' ? 'active' : ''}`}
                            onClick={() => handleTabChange(eventIndex, 'castingInfo')}
                          >
                            キャスティング情報
                          </button>
                        </div>

                        {event.activeTab === 'flyerAndSchedule' && (
                          <div className="flyer-schedule">
                            <div className="flyer-container">
                              {event.eventId && flyerUrls[event.eventId] && (
                                <img src={flyerUrls[event.eventId]} alt="フライヤー表" className="event-image" />
                              )}
                            </div>
                            <div className="date-container">
                              {event.dates.map((date, dateIndex) => (
                                <div key={dateIndex} className="date-entry">
                                  <input
                                    type="date"
                                    value={date.date}
                                    onChange={(e) => handleInputChange(e, eventIndex, dateIndex, 'date')}
                                    required
                                  />
                                  <input
                                    type="text"
                                    value={date.note}
                                    onChange={(e) => handleInputChange(e, eventIndex, dateIndex, 'note')}
                                    placeholder="備考欄"
                                  />
                                  {dateIndex > 0 && (
                                    <button
                                      type="button"
                                      className="remove-date-button"
                                      onClick={() => handleRemoveDate(eventIndex, dateIndex)}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              {canAddDate(eventIndex) && (
                                <button type="button" className="add-date-button" onClick={() => addDate(eventIndex)}>
                                  日程を追加
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {event.activeTab === 'castingInfo' && renderCastingInfo(eventIndex)}

                        {eventIndex > 0 && (
                          <button type="button" className="remove-event-button" onClick={() => removeEvent(eventIndex)}>
                            イベントを削除
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {formData.events.length < events.length && canAddEvent() && (
                  <button type="button" className="add-event-button" onClick={addEvent}>
                    イベントを追加
                  </button>
                )}
              </div>

              {/* キャスティングオプションセクション */}
              <div className="form-section casting-options-section">
                <label className="title-label">キャスティングオプション</label>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    name="isAllEventsRequired"
                    checked={formData.isAllEventsRequired}
                    onChange={(e) => {
                      const { name, checked } = e.target;
                      setFormData((prev) => ({ ...prev, [name]: checked }));
                      setIsLoading(true);
                      filterAndSortArtists();
                      setIsLoading(false);
                    }}
                  />
                  <label>すべてのイベントに参加可能なアーティストのみ募集</label>
                </div>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    name="preventDoubleSubmission"
                    checked={preventDoubleSubmission}
                    onChange={handlePreventDoubleSubmissionChange}
                  />
                  <label>仮押さえ申請の2重送信を防止</label>
                </div>
              </div>

              {/* アーティスト選択セクション */}
              <div className="form-section artist-selection-section">
                <label className="title-label">キャスティングアーティスト選択</label>
                <div className="selected-artists">
                  {selectedArtists.map((artistId) => {
                    const artist = artists.find((a) => a.artist_id === artistId);
                    return (
                      <div className="selected-artist" key={artistId}>
                        <div className="artist-info">
                          {getShortName(artist.parts[0])}：{artist.name}
                        </div>
                        <input
                          type="number"
                          name={`compensation-${artistId}`}
                          value={formData.artistFees[artistId] || ''}
                          onChange={(e) => {
                            const newFees = { ...formData.artistFees, [artistId]: e.target.value };
                            setFormData((prev) => ({ ...prev, artistFees: newFees }));
                          }}
                          placeholder="報酬額(税込み)"
                        />
                        <span>円</span>
                        <textarea
                          name={`message-${artistId}`}
                          value={formData.artistMessages[artistId] || ''}
                          onChange={(e) => handleTextareaChange(e, artistId)}
                          placeholder="個別メッセージ"
                          rows={1}
                          style={{ resize: 'none', overflowY: 'auto', maxHeight: '3.6em' }}
                        />
                        <span className="remove-btn" onClick={() => handleRemoveArtist(artistId)}>
                          ×
                        </span>
                      </div>
                    );
                  })}
                  {/* アーティスト追加ボタンを選択済みリストの下部に配置 */}
                  <button
                    type="button"
                    className="open-artist-popup-button"
                    onClick={() => setShowArtistPopup(true)}
                  >
                    アーティストを追加
                  </button>
                  {/* リセットリンク（小さく右寄せ） */}
                  <div className="reset-artist-selection" onClick={handleRemoveAllArtists}>
                    アーティスト選択のリセット
                  </div>
                </div>
              </div>

              {/* メッセージセクション */}
              <div className="form-section message-section">
                <label className="title-label" htmlFor="message">
                  メッセージ
                </label>
                <textarea
                  id="message"
                  className="fixed-textarea"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="公演の概要、募集の要項等を入力してください。"
                  required
                />
              </div>

              {/* フッター：合計報酬と送信ボタン（合計報酬横に選択アーティスト数を表示） */}
              <div className="form-footer">
                <div className="total-compensation">
                  合計報酬: {calculateTotalCompensation()} 円&nbsp;【人数: {selectedArtists.length} 人】
                </div>
                <button type="submit" className="submit-button">
                  仮押さえ申請を送信
                </button>
              </div>
            </form>

            {/* アーティスト選択ポップアップ */}
            {showArtistPopup && (
              <div className="popup-background" onClick={handlePopupBackgroundClick}>
                <div className="artist-popup">
                  <div className="artist-popup-content">
                    <h3>アーティスト選択</h3>
                    <div className="artist-popup-filter">
                      <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => {
                          setNameFilter(e.target.value);
                          filterAndSortArtists();
                        }}
                        placeholder="名前で絞り込み"
                      />
                      <select
                        name="group"
                        value={selectedGroup}
                        onChange={(e) => {
                          setSelectedGroup(e.target.value);
                          filterAndSortArtists();
                        }}
                      >
                        <option value="">すべてのグループ</option>
                        {groups.map((group) => (
                          <option key={group.group_id} value={group.group_id}>
                            {group.group_name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="part"
                        value={selectedParts[0] || ''}
                        onChange={handlePartSelectionChange}
                      >
                        <option value="">すべてのパート</option>
                        {parts.map((part) => (
                          <option key={part.value} value={part.value}>
                            {part.label}
                          </option>
                        ))}
                      </select>
                      {/* 絞り込み済みのアーティストを一括追加するボタン */}
                      <button
                        type="button"
                        className="select-all-filtered-button"
                        onClick={handleAddAllFilteredArtists}
                      >
                        すべて追加
                      </button>
                    </div>
                    <div className="artist-popup-list">
                      {filteredArtists.map((artist) => {
                        const status = artistHoldStatus[artist.artist_id];
                        let badgeClass = 'artist-badge';
                        if (existingHoldArtists.includes(artist.artist_id)) {
                          badgeClass +=
                            status === 'approved'
                              ? ' approved'
                              : status === 'rejected'
                              ? ' rejected'
                              : ' existing-hold';
                        }
                        return (
                          <div
                            key={artist.artist_id}
                            className={`${badgeClass} ${
                              selectedArtists.includes(artist.artist_id) ? 'selected' : ''
                            }`}
                            onClick={() => handleArtistClick(artist.artist_id)}
                          >
                            {`${getShortName(artist.parts[0])}：${artist.name}`}
                          </div>
                        );
                      })}
                    </div>
                    <div className="artist-popup-close">
                      <button className="close-popup-button" onClick={() => setShowArtistPopup(false)}>
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 確認ポップアップ */}
            {showConfirmationPopup && (
              <div className="popup-background">
                <div className="confirmation-popup">
                  <h3>確認</h3>
                  <p>キャスティングを申請しますか？</p>
                  <button className="confirm-button" onClick={handleConfirmSubmit}>
                    送信
                  </button>
                  <button className="cancel-button" onClick={handleCancelSubmit}>
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {showPopupMessage && (
              <div className="popup-message">
                {submitStatus && <p>{submitStatus}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HoldCasting;

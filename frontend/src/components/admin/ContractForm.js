import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ContractForm.css';

const API_URL = process.env.REACT_APP_API_URL;

const DEFAULT_CANCEL_POLICY = `開催日より起算して、2週間前（2023年4月14日開催の場合は、2023年4月1日）に開催不可の場合、依頼者は出演者に出演料の50%を支払。
開催日より起算して、2週間前に出演不可の場合、出演者は依頼者に出演料の50%を支払。
ただし、不可抗力（台風・地震などの天災、感染症の流行）による公演中止や、出演不可能な場合は、上記支払いはないものとする。`;

const DEFAULT_REMARKS = `※1 インボイス制度施行に伴い、弊社の対応について。
●課税事業者
出演料（税込）の金額より、源泉徴収税10.21％を差し引いた金額をお振り込みいたします。
※『課税事業者登録』をされている方は、速やかに担当までご連絡くださいませ。
●免税事業者
出演料の提示金額は税込表記とさせていただいておりますので、弊社からは免税事業者への消費税はお支払いしないため、出演料より消費税額分と源泉徴収税10.21％を差し引いた金額をお振り込みいたします。`;

const DEFAULT_TRANSFER_INFO = `2025年●月●日までに、指定口座にお振り込みいたします。振込元：株式会社タクティカート`;

const DEFAULT_SECONDARY_CONTENT = `本イベントにおいて、主催者は撮影、録音、録画、編集、配信、その他あらゆる媒体で、出演者の映像、音声、写真等（以下「二次コンテンツ」という）を利用することができます。
本契約に含まれるオプション以外の利用方法も含め、上記二次コンテンツの利用について、予めご了承いただくものとします。
また、肖像、音声、映像等の利用に関して、主催者はこれらを無制限かつ無期限かつ非独占的に利用できる権利を有し、これにより新たな報酬等の請求は行わないものとします。
二次コンテンツは、イベントの広報や宣伝、及びビジネス利用等にも利用されるものとし、出演者個人の尊厳を尊重する方法で行われるものとします。`;

const STORAGE_KEY_PREFIX = 'contractForm_';

const loadStoredData = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('ローカルデータの解析中にエラーが発生しました:', e);
    return null;
  }
};

const ContractForm = () => {
  const { holdCastingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryEventUuid = queryParams.get('event_uuid') || '';

  // 初期化済みフラグ（これ以上再実行しない）
  const [initialized, setInitialized] = useState(false);

  const [contractDetails, setContractDetails] = useState({
    event_uuid: queryEventUuid,
    event_name: '',
    event_date: '',
    schedule: [],
    venue: '',
    open_time: '', // これらはイベント詳細からのみ取得
    start_time: '',
    rehearsal_venue: '',
    contact_person: '',
    contact: '',
    transfer_info: DEFAULT_TRANSFER_INFO,
    cancel_policy: DEFAULT_CANCEL_POLICY,
    program: '',
    remarks: DEFAULT_REMARKS,
    additional_usage_clause: DEFAULT_SECONDARY_CONTENT,
    hold_casting_id: holdCastingId || null,
    autoFilledFromStorage: false,
  });

  const [events, setEvents] = useState([]);
  const [eventCasts, setEventCasts] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [showArtistPopup, setShowArtistPopup] = useState(false);
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [groups, setGroups] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [artistSource, setArtistSource] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState([]);

  // storageKeyは event_uuid が存在する場合のみ設定
  const storageKey = contractDetails.event_uuid ? `${STORAGE_KEY_PREFIX}${contractDetails.event_uuid}` : null;

  const getShortName = (artist) => {
    if (!artist.parts) return '';
    let aParts = artist.parts;
    if (typeof aParts === 'string') {
      try {
        aParts = JSON.parse(aParts);
      } catch (e) {
        aParts = [];
      }
    }
    if (!Array.isArray(aParts) || aParts.length === 0) return '';
    const partValue = aParts[0];
    const matched = parts.find((p) => p.value === partValue);
    return matched ? matched.short_name : '';
  };

  // ContractForm.js の先頭付近（インポートの後、コンポーネント内の最初の useEffect 前など）
  useEffect(() => {
    // フォームページがマウントされたときに送信完了フラグを削除
    localStorage.removeItem('contractSubmitted');
  }, []);

  // 初期化処理（初回のみ実行）
  useEffect(() => {
    const initializeForm = async () => {
      // すでに初期化済みなら何もしない
      if (initialized) return;
      setLoading(true);
      // URLに holdCastingId がある場合
      if (holdCastingId) {
        await fetchContractDetails(holdCastingId);
        const stored = loadStoredData(storageKey);
        if (stored) {
          // 編集可能項目はローカルストレージのデータを優先（スケジュール等）
          setContractDetails((prev) => ({
            ...prev,
            venue: stored.venue,
            rehearsal_venue: stored.rehearsal_venue,
            contact_person: stored.contact_person,
            contact: stored.contact,
            transfer_info: stored.transfer_info,
            cancel_policy: stored.cancel_policy,
            remarks: stored.remarks,
            additional_usage_clause: stored.additional_usage_clause,
            schedule: stored.schedule,
            autoFilledFromStorage: true,
          }));
        }
      } else if (queryEventUuid) {
        // holdCastingId がない場合は、queryEventUuid からイベント詳細を取得
        await fetchEventDetails(queryEventUuid);
        const stored = loadStoredData(storageKey);
        if (stored && queryEventUuid === stored.event_uuid) {
          setContractDetails((prev) => ({
            ...prev,
            venue: stored.venue,
            rehearsal_venue: stored.rehearsal_venue,
            contact_person: stored.contact_person,
            contact: stored.contact,
            transfer_info: stored.transfer_info,
            cancel_policy: stored.cancel_policy,
            remarks: stored.remarks,
            additional_usage_clause: stored.additional_usage_clause,
            schedule: stored.schedule,
            autoFilledFromStorage: true,
          }));
        }
      }
      setInitialized(true);
      setLoading(false);
    };
    initializeForm();
  }, [holdCastingId, queryEventUuid, storageKey, initialized]);

  useEffect(() => {
    // 確認ページから戻ってきた場合、location.state にデータがあるならその値を反映する
    if (location.state) {
      const { event_uuid, additionalInfo, selectedArtists } = location.state;
      setContractDetails((prev) => ({
        ...prev,
        event_uuid: event_uuid || prev.event_uuid,
        event_name: additionalInfo.event_name || prev.event_name,
        event_date: additionalInfo.event_date || prev.event_date,
        venue: additionalInfo.venue || prev.venue,
        // open_time, start_time はイベント詳細から取得するためそのままにする（または必要なら追加）
        rehearsal_venue: additionalInfo.rehearsal_venue || prev.rehearsal_venue,
        contact_person: additionalInfo.contact_person || prev.contact_person,
        contact: additionalInfo.contact || prev.contact,
        transfer_info: additionalInfo.transfer_info || prev.transfer_info,
        cancel_policy: additionalInfo.cancel_policy || prev.cancel_policy,
        program: additionalInfo.program || prev.program,
        remarks: additionalInfo.remarks || prev.remarks,
        additional_usage_clause: additionalInfo.additional_usage_clause || prev.additional_usage_clause,
      }));
      setSelectedArtists(selectedArtists || []);
    }
  }, [location.state]);
  

  // 仮押さえ情報からのデータ取得
  const fetchContractDetails = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/hold-casting-detail/${id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('仮押さえ情報の取得に失敗しました。');
      const data = await response.json();
      const isApproved = data.status === 'approved';
      const effectiveEventUuid = data.event_uuid || data.base_event_uuid || queryEventUuid;
      const scheduleItems = data.event_dates?.map((item) => ({
        date: item.hold_date,
        note: item.note,
        startTime: '', // 仮押さえの場合、時間は空
        endTime: '',
      })) || [];
      setContractDetails((prev) => ({
        ...prev,
        event_uuid: effectiveEventUuid,
        event_name: data.event_name || '',
        schedule: scheduleItems,
        hold_casting_id: id,
      }));
      // アーティストの自動追加（仮押さえ情報から）
      if (data.artist_id) {
        let artistParts = data.parts;
        if (!artistParts || artistParts.length === 0) {
          try {
            const artistRes = await fetch(`${API_URL}/api/admin/artists/${data.artist_id}`);
            if (artistRes.ok) {
              const artistData = await artistRes.json();
              artistParts = artistData.parts || [];
            } else {
              artistParts = [];
            }
          } catch (e) {
            artistParts = [];
          }
        }
        setSelectedArtists([
          {
            artist_id: data.artist_id,
            name: data.artist_name,
            fee: data.fee || '',
            isApproved,
            holdCastingArtistId: id,
            parts: artistParts,
          },
        ]);
      }
    } catch (error) {
      console.error('fetchContractDetails error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // イベント詳細およびローカルストレージからの自動入力
  useEffect(() => {
    if (!contractDetails.event_uuid) return;
    // open_time, start_timeは必ずイベント詳細から取得するので、fetchEventDetails を実行
    fetchEventDetails(contractDetails.event_uuid);
    const stored = loadStoredData(storageKey);
    if (stored && stored.schedule && stored.schedule.length > 0) {
      // ここではローカルストレージのスケジュール・編集項目を優先（open_time, start_timeは更新しない）
      setContractDetails((prev) => ({
        ...prev,
        venue: stored.venue,
        rehearsal_venue: stored.rehearsal_venue,
        contact_person: stored.contact_person,
        contact: stored.contact,
        transfer_info: stored.transfer_info,
        cancel_policy: stored.cancel_policy,
        remarks: stored.remarks,
        additional_usage_clause: stored.additional_usage_clause,
        schedule: stored.schedule,
        autoFilledFromStorage: true,
      }));
    }
  }, [contractDetails.event_uuid, storageKey]);



const fetchEventDetails = async (eventUuid) => {
  try {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/events/${eventUuid}`);
    if (!res.ok) throw new Error('イベント情報の取得に失敗しました。');
    const data = await res.json();
    const ev = data.event;

    // イベント情報をセット
    setContractDetails((prev) => ({
      ...prev,
      event_name: ev.name || '',
      event_date: ev.event_date || '',
      venue: ev.venue || '',
      open_time: ev.open_time ? ev.open_time.slice(0, 5) : '',
      start_time: ev.start_time ? ev.start_time.slice(0, 5) : '',
      program: ev.program || '',
    }));

    setEventCasts(ev.casts || []);
    
    let parsedOptions = [];
    if (ev.selected_options) {
      parsedOptions = typeof ev.selected_options === 'string'
        ? JSON.parse(ev.selected_options)
        : ev.selected_options;
    }
    setEventOptions(parsedOptions);

    // ローカルストレージのスケジュール情報を取得
    const storedData = loadStoredData(storageKey);
    if (storedData && storedData.schedule && storedData.schedule.length > 0) {
      // **ローカルストレージのデータを優先**
      setContractDetails((prev) => ({
        ...prev,
        schedule: storedData.schedule,
        autoFilledFromStorage: true,
      }));
      return; // 追加日程の取得をスキップ
    }

    // 仮押さえ ID がある場合は、追加日程を取得しない
    if (holdCastingId) return;

    // **スケジュールの初期設定**
    setContractDetails((prev) => {
      const newSchedule = [...prev.schedule];

      // **イベント日を追加（重複しないようにチェック）**
      if (ev.event_date) {
        const dateStr = ev.event_date.split('T')[0];
        if (!newSchedule.some(s => s.date === dateStr)) {
          newSchedule.push({
            date: dateStr,
            note: '本番日',
            startTime: '',
            endTime: '',
          });
        }
      }

      return { ...prev, schedule: newSchedule };
    });

    // **追加日程の取得**
    const otherDatesRes = await fetch(`${API_URL}/api/events/${eventUuid}/additional-dates`);
    if (otherDatesRes.ok) {
      const otherDatesData = await otherDatesRes.json();
      setContractDetails((prev) => {
        const updatedSchedule = [...prev.schedule];

        otherDatesData.forEach((od) => {
          const additionalDateStr = od.additional_date.split('T')[0];

          // **重複する日程は追加しない**
          if (!updatedSchedule.some(s => s.date === additionalDateStr)) {
            updatedSchedule.push({
              date: additionalDateStr,
              note: od.description || '追加日程',
              startTime: '',
              endTime: '',
            });
          }
        });

        return { ...prev, schedule: updatedSchedule };
      });
    }

  } catch (error) {
    console.error('fetchEventDetails error:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};




  // イベント一覧取得（event_uuidが未設定の場合のみ）
  useEffect(() => {
    if (!contractDetails.event_uuid) {
      fetch(`${API_URL}/api/admin/event-list`)
        .then((res) => res.json())
        .then((data) => setEvents(data))
        .catch((err) => console.error('イベント一覧の取得に失敗しました:', err));
    }
  }, [contractDetails.event_uuid]);

  // グループとパートの取得
  useEffect(() => {
    fetch(`${API_URL}/api/artist-groups`)
      .then((res) => res.json())
      .then((data) => setGroups(data || []))
      .catch((err) => console.error('グループ取得エラー:', err));
    fetch(`${API_URL}/api/parts`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.sort_order - b.sort_order);
        setParts(sorted);
      })
      .catch((err) => console.error('パート取得エラー:', err));
  }, []);

  // approvedアーティストの取得
  useEffect(() => {
    if (!contractDetails.event_uuid) return;
    if (artistSource === 'all') {
      Promise.all([
        fetch(`${API_URL}/api/admin/artists`).then((res) => res.json()),
        fetch(`${API_URL}/api/admin/approved-artists/${contractDetails.event_uuid}`).then((res) => res.json()),
      ])
        .then(([allData, approvedData]) => {
          if (!allData?.artists) {
            setArtists([]);
            return;
          }
          let approvedMap = {};
          if (approvedData?.success && approvedData?.artists?.length) {
            approvedData.artists.forEach((a) => {
              approvedMap[a.artist_id] = {
                fee: a.fee || '',
                holdCastingArtistId: a.holdCastingArtistId || null,
              };
            });
          }
          const merged = allData.artists.map((a) => {
            const isInMap = approvedMap[a.artist_id];
            return {
              ...a,
              isApproved: !!isInMap,
              fee: isInMap ? (isInMap.fee || '') : (a.fee || ''),
              holdCastingArtistId: isInMap ? (isInMap.holdCastingArtistId || null) : null,
            };
          });
          setArtists(merged);
        })
        .catch((err) => {
          console.error('approvedアーティストの統合エラー:', err);
          setArtists([]);
        });
    } else {
      fetch(`${API_URL}/api/admin/approved-artists/${contractDetails.event_uuid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const approved = data.artists.map((a) => ({
              ...a,
              isApproved: true,
              fee: a.fee || '',
              holdCastingArtistId: a.holdCastingArtistId || null,
            }));
            setArtists(approved);
          } else {
            setArtists([]);
          }
        })
        .catch((err) => console.error('approvedアーティスト取得エラー:', err));
    }
  }, [artistSource, contractDetails.event_uuid]);

  // アーティストのフィルタリング
  useEffect(() => {
    filterArtists();
  }, [artists, selectedGroup, selectedParts, nameFilter, selectedArtists]);

  const filterArtists = () => {
    const selectedIds = selectedArtists.map((a) => a.artist_id);
    let temp = [...artists];
    if (nameFilter) {
      temp = temp.filter((a) =>
        a.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    if (selectedParts.length > 0) {
      temp = temp.filter((a) => {
        let aParts = a.parts;
        if (typeof aParts === 'string') {
          try {
            aParts = JSON.parse(aParts);
          } catch (e) {
            aParts = [];
          }
        }
        return selectedParts.some((sp) => aParts.includes(sp));
      });
    }
    if (selectedGroup) {
      temp = temp.filter((a) => a.group_id === selectedGroup);
    }
    temp = temp.filter((a) => !selectedIds.includes(a.artist_id));
    setFilteredArtists(temp);
  };

  // イベント選択ハンドラ（イベント選択時はイベント詳細を取得）
  const handleEventSelectionChange = (e) => {
    const selectedId = e.target.value;
    setContractDetails((prev) => ({ ...prev, event_uuid: selectedId }));
    fetchEventDetails(selectedId);
  };

  // アーティスト取得ソース切替
  const handleArtistSourceChange = (val) => {
    setArtistSource(val);
  };

  // ポップアップ内でアーティストをクリック
  const handleArtistClick = (artistId) => {
    if (selectedArtists.some((obj) => obj.artist_id === artistId)) return;
    const artist = artists.find((a) => a.artist_id === artistId);
    if (!artist) return;
    const newObj = {
      artist_id: artist.artist_id,
      name: artist.name,
      fee: artist.fee || '',
      isApproved: !!artist.isApproved,
      holdCastingArtistId: artist.holdCastingArtistId || null,
      parts: artist.parts || [],
    };
    setSelectedArtists((prev) => [...prev, newObj]);
  };

  const handleRemoveArtist = (artistId) => {
    setSelectedArtists((prev) => prev.filter((obj) => obj.artist_id !== artistId));
  };

  const addSchedule = () => {
    const newSchedule = [
      ...contractDetails.schedule,
      { date: '', note: '', startTime: '', endTime: '' },
    ];
    setContractDetails((prev) => ({ ...prev, schedule: newSchedule }));
  };

  const removeSchedule = (index) => {
    const newSchedule = contractDetails.schedule.filter((_, i) => i !== index);
    setContractDetails((prev) => ({ ...prev, schedule: newSchedule }));
  };

  const saveToStorage = () => {
    if (!contractDetails.event_uuid) return;
    const dataToSave = {
      venue: contractDetails.venue, 
      schedule: contractDetails.schedule,
      rehearsal_venue: contractDetails.rehearsal_venue,
      contact_person: contractDetails.contact_person,
      contact: contractDetails.contact,
      transfer_info: contractDetails.transfer_info,
      cancel_policy: contractDetails.cancel_policy,
      remarks: contractDetails.remarks,
      additional_usage_clause: contractDetails.additional_usage_clause,
      timestamp: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    console.log('保存済みデータ:', dataToSave);
  };
  

  const validateForm = () => {
    const errors = [];
    // イベントが選択されているかチェック
    if (!contractDetails.event_uuid) {
      errors.push('イベントを選択してください。');
    }
    // アーティストが選択されているかチェック
    if (selectedArtists.length === 0) {
      errors.push('アーティストを追加してください。');
    }
    // 各アーティストの依頼料金が 0 円の場合のチェック（アーティスト名を含む）
    selectedArtists.forEach((artist) => {
      const fee = parseFloat(artist.fee);
      if (!artist.fee || isNaN(fee) || fee === 0) {
        errors.push(`${artist.name}の依頼料金を設定してください。`);
      }
    });
    
    // スケジュールのチェック
    if (contractDetails.schedule.length === 0) {
      errors.push('スケジュールを最低1件は入力してください。');
    } else {
      contractDetails.schedule.forEach((item, idx) => {
        if (!item.date) errors.push(`スケジュール${idx + 1}の日付が未入力です。`);
        if (!item.note) errors.push(`スケジュール${idx + 1}のテキストが未入力です。`);
        if (!item.startTime) errors.push(`スケジュール${idx + 1}の開始時刻が未入力です。`);
        if (!item.endTime) errors.push(`スケジュール${idx + 1}の終了時刻が未入力です。`);
      });
    }
    if (!(contractDetails.venue || '').trim()) errors.push('会場を入力してください。');
    if (!(contractDetails.transfer_info || '').trim()) errors.push('「振込について」を入力してください。');
    if (!(contractDetails.cancel_policy || '').trim()) errors.push('キャンセルポリシーを入力してください。');
    return errors;
  };
  
  
  

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors([]);
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    saveToStorage();
    const payload = {
      event_uuid: contractDetails.event_uuid,
      additionalInfo: {
        venue: contractDetails.venue,
        open_time: contractDetails.open_time,
        start_time: contractDetails.start_time,
        schedule: contractDetails.schedule,
        rehearsal_venue: contractDetails.rehearsal_venue,
        contact_person: contractDetails.contact_person,
        contact: contractDetails.contact,
        transfer_info: contractDetails.transfer_info,
        cancel_policy: contractDetails.cancel_policy,
        program: contractDetails.program,
        remarks: contractDetails.remarks,
        additional_usage_clause: contractDetails.additional_usage_clause,
      },
      selectedArtists,
      submitted: true,  // 送信済みフラグ
    };
    console.log('送信ペイロード:', payload);
    // replaceオプションを利用して履歴を上書きする
    navigate('/admin-dashboard/contract/confirm', { state: payload, replace: true });
  };
  

  const handleReset = () => {
    if (!contractDetails.event_uuid) return;
    localStorage.removeItem(storageKey);
    // 再度イベント詳細から自動入力（仮押さえまたはイベント情報から）
    fetchEventDetails(contractDetails.event_uuid);
    setContractDetails((prev) => ({ ...prev, autoFilledFromStorage: false }));
  };

  const handlePopupBackgroundClick = (e) => {
    if (e.target.className.includes('popup-background')) {
      setShowArtistPopup(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="contractform-container-unique">
        <h1>本契約フォーム</h1>
        {!contractDetails.event_uuid ? (
          <div className="contractform-group">
            <label className="contractform-group-label">イベント名</label>
            <select value={contractDetails.event_uuid} onChange={handleEventSelectionChange}>
              <option value="">-- イベントを選択 --</option>
              {events.map((ev) => (
                <option key={ev.event_uuid} value={ev.event_uuid}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="contractform-group">
            <label className="contractform-group-label">イベント名</label>
            <div className="contractform-static-field">{contractDetails.event_name}</div>
          </div>
        )}
        {contractDetails.autoFilledFromStorage && (
          <div className="contractform-group">
            <label className="contractform-group-label"></label>
            <div className="auto-fill-message">
              過去の入力情報から自動入力しています　
              <button type="button" onClick={handleReset}>リセット</button>
            </div>
          </div>
        )}
        <div className="contractform-group" style={{ alignItems: 'flex-start' }}>
          <label className="contractform-group-label">アーティスト</label>
          <div className="artist-wrapper">
            <div className="selected-artists-container">
              {selectedArtists.map((obj) => {
                const shortName = getShortName(obj);
                return (
                  <div key={obj.artist_id} className="selected-artist">
                    <div className="artist-info">
                      {shortName ? `${shortName}：${obj.name}` : obj.name}
                      {obj.isApproved && <span className="approved-badge">仮承認</span>}
                    </div>
                    <span className="artist-fee-label">依頼料金(税込み)</span>
                    <input
                      type="number"
                      placeholder="0"
                      className="artist-fee-input"
                      value={obj.fee || ''}
                      onChange={(e) => {
                        const updated = [...selectedArtists];
                        const target = updated.find((a) => a.artist_id === obj.artist_id);
                        if (target) {
                          target.fee = e.target.value;
                        }
                        setSelectedArtists(updated);
                      }}
                    />
                    <span>円</span>
                    <button type="button" onClick={() => handleRemoveArtist(obj.artist_id)}>✕</button>
                  </div>
                );
              })}
              {contractDetails.event_uuid && (
                <div className="artist-add-area">
                  <button type="button" className="artist-add-button" onClick={() => setShowArtistPopup(true)}>
                    アーティストを追加
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">スケジュール</label>
          <div className="schedule-container">
            {contractDetails.schedule.map((item, index) => (
              <div key={index} className="schedule-item">
                <input
                  type="date"
                  value={item.date}
                  onChange={(e) => {
                    const newSchedule = [...contractDetails.schedule];
                    newSchedule[index].date = e.target.value;
                    setContractDetails((prev) => ({ ...prev, schedule: newSchedule }));
                  }}
                />
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => {
                    const newSchedule = [...contractDetails.schedule];
                    newSchedule[index].note = e.target.value;
                    setContractDetails((prev) => ({ ...prev, schedule: newSchedule }));
                  }}
                  placeholder="例：本番日、リハーサル日など"
                />
                <input
                  type="time"
                  step="600"
                  value={item.startTime}
                  onChange={(e) => {
                    const newSchedule = [...contractDetails.schedule];
                    newSchedule[index].startTime = e.target.value;
                    setContractDetails((prev) => ({ ...prev, schedule: newSchedule }));
                  }}
                />
                <span>～</span>
                <input
                  type="time"
                  step="600"
                  value={item.endTime}
                  onChange={(e) => {
                    const newSchedule = [...contractDetails.schedule];
                    newSchedule[index].endTime = e.target.value;
                    setContractDetails((prev) => ({ ...prev, schedule: newSchedule }));
                  }}
                />
                <button type="button" className="schedule-delete-btn" onClick={() => removeSchedule(index)}>削除</button>
              </div>
            ))}
            <button className="add-schedule-btn" type="button" onClick={addSchedule}>新しい日程を追加</button>
          </div>
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">開場時間</label>
          <div className="contractform-static-field">{contractDetails.open_time}</div>
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">開演時間</label>
          <div className="contractform-static-field">{contractDetails.start_time}</div>
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">会場</label>
          <input
            type="text"
            name="venue"
            value={contractDetails.venue}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, venue: e.target.value }))}
          />
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">リハーサル会場について</label>
          <input
            type="text"
            name="rehearsal_venue"
            value={contractDetails.rehearsal_venue}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, rehearsal_venue: e.target.value }))}
          />
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">振込について</label>
          <textarea
            name="transfer_info"
            value={contractDetails.transfer_info}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, transfer_info: e.target.value }))}
            rows="2"
          />
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">キャンセルポリシー</label>
          <textarea
            name="cancel_policy"
            value={contractDetails.cancel_policy}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, cancel_policy: e.target.value }))}
            rows="5"
          />
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">プログラム</label>
          <div className="contractform-static-field">{contractDetails.program}</div>
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">出演者</label>
          <div className="contractform-static-field">
            {eventCasts.map((cast, i) => (
              <span key={i} className="contractform-badge">
                {cast.cast_role}：{cast.cast_name}
              </span>
            ))}
          </div>
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">オプション</label>
          <div className="contractform-static-field">
            {eventOptions.map((opt, i) => (
              <span key={i} className="contractform-badge">{opt}</span>
            ))}
          </div>
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">コンテンツ利用について</label>
          <textarea
            name="additional_usage_clause"
            value={contractDetails.additional_usage_clause}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, additional_usage_clause: e.target.value }))}
            rows="5"
          />
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">備考</label>
          <textarea
            name="remarks"
            value={contractDetails.remarks}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, remarks: e.target.value }))}
            rows="5"
          />
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">現場担当者</label>
          <input
            type="text"
            name="contact_person"
            value={contractDetails.contact_person}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, contact_person: e.target.value }))}
          />
        </div>
        <div className="contractform-group">
          <label className="contractform-group-label">当日連絡先</label>
          <input
            type="text"
            name="contact"
            value={contractDetails.contact}
            onChange={(e) => setContractDetails((prev) => ({ ...prev, contact: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          className="contractform-submit-button"
          onClick={handleSubmit}
          disabled={!contractDetails.event_uuid} // 修正：selectedArtistsの条件を削除
        >
          送信内容の確認へ
        </button>

        {formErrors.length > 0 && (
          <div className="form-error-box">
            <ul>
              {formErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}


      </div>
      {showArtistPopup && (
        <div className="popup-background" onClick={handlePopupBackgroundClick}>
          <div className="artist-popup" onClick={(e) => e.stopPropagation()}>
            <h3>アーティスト選択</h3>
            <div className="artist-filter-ui">
              <div className="artist-filter-row">
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => {
                    setNameFilter(e.target.value);
                    filterArtists();
                  }}
                  placeholder="名前で絞り込み"
                />
              </div>
              <div className="artist-filter-row">
                <select value={selectedParts[0] || ''} onChange={(e) => setSelectedParts(e.target.value ? [e.target.value] : [])}>
                  <option value="">すべてのパート</option>
                  {parts.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="artist-filter-row">
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                  <option value="">すべてのグループ</option>
                  {groups.map((g) => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="artist-filter-row source-switch">
                <label>
                  <input
                    type="radio"
                    name="artistSource"
                    value="all"
                    checked={artistSource === 'all'}
                    onChange={() => handleArtistSourceChange('all')}
                  />
                  全アーティスト
                </label>
                <label>
                  <input
                    type="radio"
                    name="artistSource"
                    value="approved"
                    checked={artistSource === 'approved'}
                    onChange={() => handleArtistSourceChange('approved')}
                  />
                  仮承認のみ
                </label>
              </div>
            </div>
            <div className="artist-badge-container">
              {filteredArtists.map((a) => {
                const shortName = getShortName(a);
                return (
                  <span key={a.artist_id} className="artist-badge" onClick={() => handleArtistClick(a.artist_id)}>
                    {shortName ? `${shortName}：${a.name}` : a.name}
                  </span>
                );
              })}
            </div>
            <button type="button" className="selection-confirm-button" onClick={() => setShowArtistPopup(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractForm;

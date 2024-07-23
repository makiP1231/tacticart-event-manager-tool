import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../../css/admin/ArtistGroups.css';

function ArtistGroups() {
    const [artists, setArtists] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [renameGroupName, setRenameGroupName] = useState(''); // 追加
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [parts, setParts] = useState([]);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showPartPopup, setShowPartPopup] = useState(false);
    const [showRenamePopup, setShowRenamePopup] = useState(false);
    const [selectedParts, setSelectedParts] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [showRemoveAllPopup, setShowRemoveAllPopup] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL;

    // パートの順序に基づいてアーティストを並び替える関数
    const sortArtistsByParts = (artists, partsOrder) => {
        return artists.sort((a, b) => {
            const partA = a.parts[0] || ''; // アーティストの最初のパート
            const partB = b.parts[0] || '';
            const indexA = partsOrder.indexOf(partA);
            const indexB = partsOrder.indexOf(partB);
            return indexA - indexB;
        });
    };

    const handleGroupChange = (e) => {
        const selectedGroupId = parseInt(e.target.value, 10); // IDを整数に変換
        setSelectedGroup(selectedGroupId);
        
        // グループの情報を取得して renameGroupName に設定
        const group = groups.find(g => g.group_id === selectedGroupId);
        if (group) {
            setRenameGroupName(group.group_name);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const artistsResponse = await fetch(`${API_URL}/api/admin/artists`);
                const artistsData = await artistsResponse.json();
                setArtists(artistsData.artists);

                const groupsResponse = await fetch(`${API_URL}/api/artist-groups`);
                const groupsData = await groupsResponse.json();
                setGroups(groupsData || []);

                const partsResponse = await fetch(`${API_URL}/api/parts`);
                const partsData = await partsResponse.json();
                setParts(partsData);
                const partsOrder = partsData.map(part => part.value);
                setArtists(prevArtists => sortArtistsByParts(prevArtists, partsOrder));
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);
    

    useEffect(() => {
        if (selectedGroup) {
            fetch(`${API_URL}/api/groups/${selectedGroup}/artists`)
                .then(response => response.json())
                .then(data => {
                    setSelectedArtists(data.artists);  // アーティスト情報の設定
                })
                .catch(error => console.error('Error fetching group artists:', error));
    
            // グループ情報の更新が完了した後にグループ名を更新
            const group = groups.find(g => g.group_id === selectedGroup);
            if (group) {
                setRenameGroupName(group.group_name); // 修正
            }
        }
    }, [selectedGroup, groups]);  // 依存配列に groups を追加
    

    const getShortName = (partValue) => {
        const part = parts.find(p => p.value === partValue);
        return part ? part.short_name : '';
    };

    const toggleArtistSelection = async (artistId) => {
        if (!selectedGroup) {
            setStatusMessage('グループを選択してください。');
            return;
        }
        
        if (selectedArtists.includes(artistId)) {
            try {
                const response = await fetch(`${API_URL}/api/groups/remove-artist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ artistId, groupId: selectedGroup })
                });
                if (response.ok) {
                    setSelectedArtists(prev => prev.filter(id => id !== artistId));
                } else {
                    throw new Error('Error removing artist from group');
                }
            } catch (error) {
                console.error('Error removing artist from group:', error);
            }
        } else {
            try {
                const response = await fetch(`${API_URL}/api/groups/add-artist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ artistId, groupId: selectedGroup })
                });
                if (response.ok) {
                    setSelectedArtists(prev => [...prev, artistId]);
                } else {
                    throw new Error('Error adding artist to group');
                }
            } catch (error) {
                console.error('Error adding artist to group:', error);
            }
        }
    };
    

    const handleGroupSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/groups/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupName: newGroupName })
            });
            if (response.ok) {
                const data = await response.json();
                setGroups([...groups, data]);
                setNewGroupName('');
                setSelectedGroup(data.group_id); // 新しく作成したグループを選択状態にする
                setStatusMessage(`グループ"${data.group_name}"を作成しました`);
            } else {
                const errorText = await response.text();
                console.error('Failed to create group:', errorText);
                throw new Error('Failed to create group');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            setStatusMessage('グループの作成に失敗しました');
        }
    };

    const handleGroupDelete = async () => {
        try {
            const response = await fetch(`${API_URL}/api/groups/delete/${selectedGroup}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setGroups(groups.filter(group => group.group_id !== selectedGroup));
                setSelectedGroup('');
                setSelectedArtists([]);
                setStatusMessage('グループを削除しました');
                setShowDeletePopup(false);
            } else {
                throw new Error('Failed to delete group');
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            setStatusMessage('グループの削除に失敗しました');
            setShowDeletePopup(false);
        }
    };

    // フィルタされたアーティストを並び替える
    const filteredArtists = sortArtistsByParts(
        artists.filter(artist => {
            const matchesName = artist.name.includes(nameFilter);
            const matchesParts = selectedParts.length === 0 || artist.parts.some(part => selectedParts.includes(part));
            return matchesName && matchesParts && !selectedArtists.includes(artist.artist_id);
        }),
        parts.map(part => part.value)
    );

    const togglePartSelection = (part) => {
        setSelectedParts(prev => {
            if (prev.includes(part)) {
                return prev.filter(p => p !== part);
            } else {
                return [...prev, part];
            }
        });
    };

    const handleRemoveAllSelectedArtists = () => {
        setShowRemoveAllPopup(true);
    };
    
    const confirmRemoveAllSelectedArtists = async () => {
        await removeAllSelectedArtists();
        setShowRemoveAllPopup(false);
    };
    
    const cancelRemoveAllSelectedArtists = () => {
        setShowRemoveAllPopup(false);
    };

    const selectAllFilteredArtists = async () => {
        if (!selectedGroup) {
            setStatusMessage('グループを選択してください。');
            return;
        }
        const newSelectedArtists = filteredArtists.map(artist => artist.artist_id);
        try {
            const response = await fetch(`${API_URL}/api/groups/add-multiple-artists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistIds: newSelectedArtists, groupId: selectedGroup })
            });
            if (response.ok) {
                setSelectedArtists([...selectedArtists, ...newSelectedArtists]);
            } else {
                throw new Error('Error adding artists to group');
            }
        } catch (error) {
            console.error('Error adding artists to group:', error);
        }
    };    

    const removeAllSelectedArtists = async () => {
        try {
            const response = await fetch(`${API_URL}/api/groups/remove-multiple-artists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistIds: selectedArtists, groupId: selectedGroup })
            });
            if (response.ok) {
                setSelectedArtists([]);
            } else {
                throw new Error('Error removing artists from group');
            }
        } catch (error) {
            console.error('Error removing artists from group:', error);
        }
    };
     
    const confirmRenameGroup = async () => {
        try {
            const response = await fetch(`${API_URL}/api/groups/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId: selectedGroup, newGroupName: renameGroupName })
            });
            const responseData = await response.json();
            if (response.ok) {
                setGroups(groups.map(group => group.group_id === selectedGroup ? responseData : group));
                setStatusMessage(`グループ名が"${renameGroupName}"に変更されました`);
                setShowRenamePopup(false);
            } else {
                console.error('Failed to rename group:', responseData);
                throw new Error('Failed to rename group');
            }
        } catch (error) {
            console.error('Error renaming group:', error);
            setStatusMessage('グループ名の変更に失敗しました');
        }
    };
    
    
    

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="artist-groups-container">
                <h1>アーティストグループ設定</h1>
                <div className="group-creation-form">
                    <form onSubmit={handleGroupSubmit} className="group-form">
                        <label>新規グループ名:</label>
                        <input 
                            type="text" 
                            value={newGroupName} 
                            onChange={(e) => setNewGroupName(e.target.value)} 
                            required 
                            placeholder="グループ名を入力"
                        />
                        <button type="submit" className="btn-create-group">グループを作成</button>
                    </form>
                </div>
                {statusMessage && <div className="status-message">{statusMessage}</div>}
                <form className="artist-form">
                    <label>グループを選択:</label>
                    <select value={selectedGroup} onChange={handleGroupChange} required>
                        <option value="">グループを選択してください</option>
                        {groups.map(group => (
                            <option key={group.group_id} value={group.group_id}>{group.group_name}</option>
                        ))}
                    </select>
                    {selectedGroup && (
                        <>
                            <div>
                                <strong>グループに追加されているアーティスト:</strong>
                                <div className="selected-artists">
                                    {selectedArtists.map(id => {
                                        const artist = artists.find(a => a.artist_id === id);
                                        const shortName = artist.parts[0] ? getShortName(artist.parts[0]) : '';
                                        return (
                                            <div key={id} className="artist-tag">
                                                {shortName}：{artist.name}
                                                <span className="remove-artist" onClick={() => toggleArtistSelection(id)}>✕</span>
                                            </div>
                                        );
                                    })}
                                    {selectedArtists.length > 0 && (
                                        <div className="remove-all-artists" onClick={handleRemoveAllSelectedArtists}>
                                            すべての選択を解除
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="group-actions">
                                <button type="button" className="btn-rename-group" onClick={() => setShowRenamePopup(true)}>グループ名変更</button>
                                <button type="button" className="btn-delete-group" onClick={() => setShowDeletePopup(true)}>グループを削除</button>
                            </div>
                        </>
                    )}

                    <label>名前で絞る:</label>
                    <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="名前で検索"
                    />
                    <button type="button" className="btn-filter-parts" onClick={() => setShowPartPopup(true)}>パートで絞る</button>
                    <div className="artist-list">
                        <div className="select-all" onClick={selectAllFilteredArtists}>
                            すべて選択
                        </div>
                        {filteredArtists.map(artist => {
                            const shortName = artist.parts[0] ? getShortName(artist.parts[0]) : '';
                            return (
                                <div key={artist.artist_id} 
                                    className={`artist-name ${selectedArtists.includes(artist.artist_id) ? 'selected' : ''}`}
                                    onClick={() => toggleArtistSelection(artist.artist_id)}>
                                    {shortName}：{artist.name}
                                </div>
                            );
                        })}
                    </div>
                </form>
            </div>
            {showRenamePopup && (
                <div className="artist-groups-popup-background">
                    <div className="rename-popup">
                        <h3>グループ名を変更</h3>
                        <input
                            type="text"
                            value={renameGroupName} // 修正
                            onChange={(e) => {
                                setRenameGroupName(e.target.value); // 修正
                            }}
                            placeholder="新しいグループ名を入力"
                        />
                        <button onClick={confirmRenameGroup} className="btn-rename-confirm">修正</button>
                        <button onClick={() => setShowRenamePopup(false)} className="btn-rename-cancel">キャンセル</button>
                    </div>
                </div>
            )}
            {showDeletePopup && (
                <div className="artist-groups-popup-background">
                    <div className="delete-popup">
                        <p>本当にグループを削除しますか？</p>
                        <button onClick={handleGroupDelete} className="delete-button">削除</button>
                        <button onClick={() => setShowDeletePopup(false)} className="cancel-button">キャンセル</button>
                    </div>
                </div>
            )}
            {showPartPopup && (
                <div className="artist-groups-popup-background">
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
            {showRemoveAllPopup && (
                <div className="artist-groups-popup-background">
                    <div className="delete-popup">
                        <p>本当にすべてのアーティストの選択を解除しますか？</p>
                        <button onClick={confirmRemoveAllSelectedArtists} className="delete-button">はい</button>
                        <button onClick={cancelRemoveAllSelectedArtists} className="cancel-button">キャンセル</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ArtistGroups;

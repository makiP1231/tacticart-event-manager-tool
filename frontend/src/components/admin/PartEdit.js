import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../../css/admin/PartEdit.css';

const API_URL = process.env.REACT_APP_API_URL;

function PartEdit() {
  const [parts, setParts] = useState([]);
  const [newPartLabel, setNewPartLabel] = useState('');
  const [newPartValue, setNewPartValue] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = () => {
    fetch(`${API_URL}/api/update-and-fetch-parts`)
      .then(response => response.json())
      .then(data => setParts(data.parts))
      .catch(error => console.error('Error fetching parts:', error));
  };

  const handleAddPart = async () => {
    try {
      const response = await fetch(`${API_URL}/api/parts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newPartLabel,
          value: newPartValue,
          deletable: true,
          sort_order: parts.length + 1
        })
      });
      if (response.ok) {
        fetchParts();
        setNewPartLabel('');
        setNewPartValue('');
        setStatusMessage('新しいパートが追加されました');
      } else {
        throw new Error('Failed to add part');
      }
    } catch (error) {
      console.error('Error adding part:', error);
      setStatusMessage('パートの追加に失敗しました');
    }
  };

  const handleDeletePart = async (partId) => {
    try {
      const response = await fetch(`${API_URL}/api/parts/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partId })
      });
      if (response.ok) {
        fetchParts();
        setStatusMessage('パートが削除されました');
      } else {
        throw new Error('Failed to delete part');
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      setStatusMessage('パートの削除に失敗しました');
    }
  };

  const movePart = async (partId, direction) => {
    try {
      const response = await fetch(`${API_URL}/api/parts/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, direction })
      });
      if (response.ok) {
        fetchParts();
      } else {
        throw new Error('Failed to reorder parts');
      }
    } catch (error) {
      console.error('Error reordering parts:', error);
      setStatusMessage('パートの順序変更に失敗しました');
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="part-edit-container">
        <h2>パート編集</h2>
        {statusMessage && <div className="part-edit-status">{statusMessage}</div>}
        <div className="part-edit-list">
          <ul>
            {parts.map((part, index) => (
              <li key={part.id} className="part-edit-item">
                {part.label}
                <div className="part-edit-actions">
                  <button onClick={() => movePart(part.id, 'up')}>↑</button>
                  <button onClick={() => movePart(part.id, 'down')}>↓</button>
                  <button
                    onClick={() => handleDeletePart(part.id)}
                    disabled={!part.deletable}
                    className={part.deletable ? 'deletable' : 'non-deletable'}
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="part-edit-add">
          <h3>新しいパートを追加</h3>
          <input
            type="text"
            placeholder="日本語"
            value={newPartLabel}
            onChange={(e) => setNewPartLabel(e.target.value)}
          />
          <input
            type="text"
            placeholder="English"
            value={newPartValue}
            onChange={(e) => setNewPartValue(e.target.value)}
          />
          <button onClick={handleAddPart}>追加</button>
        </div>
      </div>
    </div>
  );
}

export default PartEdit;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/EventOptionEdit.css';

function OptionEdit() {
    const [options, setOptions] = useState([]);
    const [newOption, setNewOption] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/event-options`);
            const data = await response.json();
            setOptions(data);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleAddOption = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/event-options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ option_name: newOption }),
            });
            if (response.ok) {
                setMessage('Option added successfully');
                fetchOptions();
                setNewOption('');
            } else {
                const data = await response.json();
                setMessage(data.message || 'Failed to add option');
            }
        } catch (error) {
            console.error('Error adding option:', error);
            setMessage('Failed to add option');
        }
    };

    const handleDeleteOption = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/event-options/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            setMessage(data.message);
            if (response.ok) {
                fetchOptions();
            }
        } catch (error) {
            console.error('Error deleting option:', error);
            setMessage('Failed to delete option');
        }
    };

    const handleBack = () => {
        if (location.state && location.state.from) {
            navigate(location.state.from);
        } else {
            navigate('/admin-dashboard/events/register');
        }
    };

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="option-edit-container">
                <h1>オプション設定</h1>
                {message && <p className="message">{message}</p>}
                <form className="option-form" onSubmit={handleAddOption}>
                    <label>
                        オプション名:
                        <input
                            type="text"
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit">オプションを追加</button>
                </form>
                <div className="option-list">
                    <h2>既存のオプション</h2>
                    {options.map((option) => (
                        <div key={option.id} className="option-item">
                            <span>{option.option_name}</span>
                            <button onClick={() => handleDeleteOption(option.id)}>削除</button>
                        </div>
                    ))}
                </div>
                <button onClick={handleBack} className="back-button">
                    戻る
                </button>
            </div>
        </div>
    );
}

export default OptionEdit;

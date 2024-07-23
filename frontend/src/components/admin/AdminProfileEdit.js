import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import CropModal from './CropModal';
import '../../css/admin/AdminProfileEdit.css';

function AdminProfileEdit() {
    const [profileData, setProfileData] = useState({
        username: '',
        fullName: '',
        position: '',
        nickname: '',
        email: '',
        profilePicture: ''
    });
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState(''); // ステータスメッセージを追加
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [currentProfilePicture, setCurrentProfilePicture] = useState('');
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL;
    const ADMIN_PROFILE_IMAGE_PATH = process.env.REACT_APP_ADMIN_PROFILE_IMAGE_PATH;

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/profile`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setProfileData({
                    username: data.username,
                    fullName: data.full_name,
                    position: data.position,
                    nickname: data.nickname,
                    email: data.email,
                    profilePicture: data.profile_picture
                });
                if (data.profile_picture) {
                    setCurrentProfilePicture(`${API_URL}${ADMIN_PROFILE_IMAGE_PATH}${data.profile_picture}`);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch profile data');
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            setError(error.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                console.log("Image loaded:", reader.result);
                setCropImageSrc(reader.result);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCroppedImage = async (croppedImage) => {
        const formData = new FormData();
        formData.append('profilePicture', croppedImage, 'profile.jpg');

        try {
            const response = await fetch(`${API_URL}/api/admin/profile-picture`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                setCurrentProfilePicture(`${API_URL}${ADMIN_PROFILE_IMAGE_PATH}${data.profilePicture}`);
                setShowCropModal(false);
            } else {
                throw new Error(data.message || 'Failed to update profile picture');
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            setError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage(''); // ステータスメッセージをリセット
        try {
            const response = await fetch(`${API_URL}/api/admin/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: profileData.username,
                    full_name: profileData.fullName,
                    position: profileData.position,
                    nickname: profileData.nickname,
                    email: profileData.email
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                setStatusMessage('プロフィールが更新できました'); // 成功メッセージを設定
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message);
        }
    };

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="admin-profile-edit-container">
                <h1>プロフィール編集</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className="profile-picture-section">
                    {currentProfilePicture && (
                        <div>
                            <img src={currentProfilePicture} alt="Profile" className="profile-picture-preview" />
                        </div>
                    )}
                    <button type="button" onClick={() => document.getElementById('fileInput').click()} className="profile-picture-button">
                        {currentProfilePicture ? 'プロフィール画像を変更' : 'プロフィール画像を追加'}
                    </button>
                    <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
                <form onSubmit={handleSubmit}>
                    <label>ユーザー名</label>
                    <input
                        type="text"
                        name="username"
                        value={profileData.username || ''}
                        onChange={handleChange}
                        placeholder="ユーザー名"
                        required
                    />
                    <label>フルネーム</label>
                    <input
                        type="text"
                        name="fullName"
                        value={profileData.fullName || ''}
                        onChange={handleChange}
                        placeholder="フルネーム"
                    />
                    <label>役職</label>
                    <input
                        type="text"
                        name="position"
                        value={profileData.position || ''}
                        onChange={handleChange}
                        placeholder="役職"
                    />
                    <label>ニックネーム</label>
                    <input
                        type="text"
                        name="nickname"
                        value={profileData.nickname || ''}
                        onChange={handleChange}
                        placeholder="ニックネーム"
                    />
                    <label>メールアドレス</label>
                    <input
                        type="email"
                        name="email"
                        value={profileData.email || ''}
                        onChange={handleChange}
                        placeholder="メールアドレス"
                    />
                    <button type="submit">プロフィールを更新</button>
                    {statusMessage && <p style={{ color: 'green' }}>{statusMessage}</p>} {/* ステータスメッセージの表示 */}
                </form>
                <CropModal
                    show={showCropModal}
                    src={cropImageSrc}
                    onSave={handleSaveCroppedImage}
                    onCancel={() => setShowCropModal(false)}
                />
            </div>
        </div>
    );
}

export default AdminProfileEdit;

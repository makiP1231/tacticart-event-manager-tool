import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtistSidebar from './ArtistSidebar';
import CropModal from '../admin/CropModal'; // 管理者用のものを再利用
import '../../css/artist/ArtistProfileEdit.css';

function ArtistProfileEdit() {
    const [profileData, setProfileData] = useState({
        name: '',
        parts: [],
        email: '',
        profile_picture: '',
        gender: '',
        birth_year: '',
        birth_month: '',
        birth_day: '',
        company_name: '',
        phone_number: '',
        twitter_url: '',
        instagram_url: '',
        facebook_url: '',
        hp_url: '',
        bio: '',
        notes: '',
        youtube_url: ''
    });
    const [birthYear, setBirthYear] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [currentProfilePicture, setCurrentProfilePicture] = useState('');
    const [showPartsModal, setShowPartsModal] = useState(false);
    const [parts, setParts] = useState([]);
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL;
    const ARTIST_PROFILE_IMAGE_PATH = process.env.REACT_APP_ARTIST_PROFILE_IMAGE_PATH;

    useEffect(() => {
        const fetchProfileData = async (userId) => {
            try {
                const response = await fetch(`${API_URL}/api/artists/${userId}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (response.ok) {
                    setProfileData(data);
                    if (data.profile_picture) {
                        setCurrentProfilePicture(`${API_URL}${ARTIST_PROFILE_IMAGE_PATH}/${data.profile_picture}`);
                    }
                    // 生年月日を設定
                    if (data.birth_year) setBirthYear(data.birth_year);
                    if (data.birth_month) setBirthMonth(data.birth_month);
                    if (data.birth_day) setBirthDay(data.birth_day);
                } else {
                    throw new Error(data.message || 'Failed to fetch profile data');
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
                setError(error.message);
            }
        };
    
        const fetchSessionData = async () => {
            try {
                const sessionResponse = await fetch(`${API_URL}/api/session`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const sessionData = await sessionResponse.json();
                if (sessionResponse.ok && sessionData.role === 'artist') {
                    fetchProfileData(sessionData.userId);
                    fetchPartsData(); // パートのデータを取得
                } else {
                    throw new Error('No active session found');
                }
            } catch (error) {
                console.error('Error fetching session data:', error);
                setError(error.message);
            }
        };
    
        const fetchPartsData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/parts`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (response.ok) {
                    setParts(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch parts data');
                }
            } catch (error) {
                console.error('Error fetching parts data:', error);
                setError(error.message);
            }
        };
    
        fetchSessionData();
    }, [API_URL, ARTIST_PROFILE_IMAGE_PATH]);
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
        if (name === 'email') {
            setEmailError(''); // メールアドレス入力時にエラーメッセージをリセット
        }
    };

    const handleBirthdateChange = (e) => {
        const { name, value } = e.target;
        if (name === 'birthYear') {
            setBirthYear(value);
        } else if (name === 'birthMonth') {
            setBirthMonth(value);
        } else if (name === 'birthDay') {
            setBirthDay(value);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
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
            const response = await fetch(`${API_URL}/api/artists/profile-picture`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                setCurrentProfilePicture(`${API_URL}${ARTIST_PROFILE_IMAGE_PATH}/${data.profilePicture}`);
                setShowCropModal(false);
            } else {
                throw new Error(data.message || 'Failed to update profile picture');
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            setError(error.message);
        }
    };

    const handleDeleteProfilePicture = async () => {
        try {
            const response = await fetch(`${API_URL}/api/artists/profile-picture`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setCurrentProfilePicture('');
                setProfileData({ ...profileData, profile_picture: '' });
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete profile picture');
            }
        } catch (error) {
            console.error('Error deleting profile picture:', error);
            setError(error.message);
        }
    };

    const handlePartClick = (partValue) => {
        const index = profileData.parts.indexOf(partValue);
        if (index === -1) {
            setProfileData({ ...profileData, parts: [...profileData.parts, partValue] });
        } else {
            const newParts = [...profileData.parts];
            newParts.splice(index, 1);
            setProfileData({ ...profileData, parts: newParts });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/artists/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...profileData, birth_year: birthYear, birth_month: birthMonth, birth_day: birthDay }),
                credentials: 'include'
            });
    
            const data = await response.json();
            if (response.ok) {
                setStatusMessage('プロフィールが更新されました'); // ステータスメッセージを設定
                setTimeout(() => setStatusMessage(''), 3000); // 3秒後にメッセージを消す
            } else {
                if (response.status === 409) {
                    setEmailError(data.message); // メールアドレスの重複エラーメッセージを設定
                } else {
                    throw new Error(data.message || 'Failed to update profile');
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message);
        }
    };
    

    const getProfilePictureBackground = () => {
        switch (profileData.gender) {
            case 'male':
                return '#add8e6'; // 薄い青
            case 'female':
                return '#ffc0cb'; // 薄いピンク
            default:
                return '#d3d3d3'; // グレー
        }
    };

    return (
        <div className="artist-dashboard">
            <ArtistSidebar />
            <div className="artist-profile-edit-container">
                <div className="profile-picture-section">
                    {currentProfilePicture ? (
                        <div className="profile-picture-wrapper">
                            <img src={currentProfilePicture} alt="Profile" className="profile-picture-preview" />
                            <button type="button" onClick={() => document.getElementById('fileInput').click()} className="profile-picture-button">
                                プロフィール画像を変更
                            </button>
                            <a href="#!" onClick={handleDeleteProfilePicture} className="delete-profile-picture">削除</a>
                        </div>
                    ) : (
                        <div
                            className="profile-picture-placeholder"
                            style={{ backgroundColor: getProfilePictureBackground() }}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            <span>＋</span>
                        </div>
                    )}
                    <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    {!currentProfilePicture && (
                        <button type="button" onClick={() => document.getElementById('fileInput').click()} className="profile-picture-button">
                            プロフィール画像を追加
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>アーティスト名</label>
                        <input
                            type="text"
                            name="name"
                            value={profileData.name || ''}
                            onChange={handleChange}
                            placeholder="アーティスト名"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>パート</label>
                        <div className="parts-display">
                            {profileData.parts.map(part => (
                                <span key={part} className="part-badge">
                                    {parts.find(p => p.value === part)?.label}
                                </span>
                            ))}
                            <button type="button" onClick={() => setShowPartsModal(true)} className="edit-parts-button">パートを編集</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>メール</label>
                        <input
                            type="text"
                            name="email"
                            value={profileData.email || ''}
                            onChange={handleChange}
                            placeholder="メール"
                            required
                        />
                    </div>
                    {emailError && <p className="email-error" style={{ color: 'red' }}>{emailError}</p>}
                    <div className="form-group">
                        <label>性別</label>
                        <select name="gender" className="gender-selects" value={profileData.gender || ''} onChange={handleChange}>
                            <option value="">未設定</option>
                            <option value="male">男性</option>
                            <option value="female">女性</option>
                            <option value="secret">非公表</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>生年月日</label>
                        <div className="birthdate-select">
                            <select name="birthYear" className="birthday-set" value={birthYear} onChange={handleBirthdateChange}>
                                <option value="">年</option>
                                {Array.from({ length: 100 }, (_, i) => (
                                    <option key={i} value={new Date().getFullYear() - i}>
                                        {new Date().getFullYear() - i}
                                    </option>
                                ))}
                            </select>
                            <select name="birthMonth" className="birthday-set" value={birthMonth} onChange={handleBirthdateChange}>
                                <option value="">月</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {i + 1}
                                    </option>
                                ))}
                            </select>
                            <select name="birthDay" className="birthday-set" value={birthDay} onChange={handleBirthdateChange}>
                                <option value="">日</option>
                                {Array.from({ length: 31 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>法人名/所属事務所等</label>
                        <input
                            type="text"
                            name="company_name"
                            value={profileData.company_name || ''}
                            onChange={handleChange}
                            placeholder="法人名/所属事務所等"
                        />
                    </div>
                    <div className="form-group">
                        <label>電話番号</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={profileData.phone_number || ''}
                            onChange={handleChange}
                            placeholder="電話番号"
                        />
                    </div>
                    <div className="form-group">
                        <label>X(Twitter) URL</label>
                        <input
                            type="text"
                            name="twitter_url"
                            value={profileData.twitter_url || ''}
                            onChange={handleChange}
                            placeholder="X(Twitter)URL"
                        />
                    </div>
                    <div className="form-group">
                        <label>Instagram URL</label>
                        <input
                            type="text"
                            name="instagram_url"
                            value={profileData.instagram_url || ''}
                            onChange={handleChange}
                            placeholder="InstagramURL"
                        />
                    </div>
                    <div className="form-group">
                        <label>Facebook URL</label>
                        <input
                            type="text"
                            name="facebook_url"
                            value={profileData.facebook_url || ''}
                            onChange={handleChange}
                            placeholder="FacebookURL"
                        />
                    </div>
                    <div className="form-group">
                        <label>YouTubeURL</label>
                        <input
                            type="text"
                            name="youtube_url"
                            value={profileData.youtube_url || ''}
                            onChange={handleChange}
                            placeholder="YouTubeURL"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>HP URL</label>
                        <input
                            type="text"
                            name="hp_url"
                            value={profileData.hp_url || ''}
                            onChange={handleChange}
                            placeholder="HPURL"
                        />
                    </div>
                    <div className="form-group-textarea">
                        <label>紹介プロフィール</label>
                        <textarea
                            name="bio"
                            value={profileData.bio || ''}
                            onChange={handleChange}
                            placeholder="イベントなどの紹介文のプロフィール文を入力してください。"
                        />
                    </div>
                    <div className="form-group-textarea">
                        <label>備考欄</label>
                        <textarea
                            name="notes"
                            value={profileData.notes || ''}
                            onChange={handleChange}
                            placeholder="運営に伝えておきたいメッセージ等を入力してください。"
                        />
                    </div>
                    <button type="submit" className="profile-submit-btn">プロフィールを更新</button>
                </form>
                <div className="profile-links">
                    <button onClick={() => navigate('/artist-photography')}>宣材写真を登録</button>
                    <button onClick={() => navigate('/artist-bank-info')}>振込先口座情報を登録</button>
                    <button onClick={() => navigate('/artist-change-password')}>パスワードを変更</button>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {statusMessage && <p style={{ color: 'green' }}>{statusMessage}</p>}
                <CropModal
                    show={showCropModal}
                    src={cropImageSrc}
                    onSave={handleSaveCroppedImage}
                    onCancel={() => setShowCropModal(false)}
                />
                {showPartsModal && (
                    <div className="parts-modal">
                        <div className="parts-modal-content">
                            <h2>パートを選択</h2>
                            <p>複数選択可。一つ目の選択がメインパートになります。</p>
                            <div className="part-checkboxes">
                                {parts.map(part => (
                                    <label
                                        key={part.value}
                                        className={profileData.parts.includes(part.value)
                                            ? profileData.parts[0] === part.value ? 'main-part' : 'sub-part'
                                            : ''}
                                        onClick={() => handlePartClick(part.value)}
                                    >
                                        {part.label}
                                    </label>
                                ))}
                                <label onClick={() => setProfileData({ ...profileData, parts: [] })} className="reset-button">
                                    リセット
                                </label>
                            </div>
                            <button onClick={() => setShowPartsModal(false)} className="close-button">閉じる</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ArtistProfileEdit;

// ContractSuccess.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../css/admin/ContractSuccess.css';

const ContractSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // ブラウザ履歴のstateをクリア
    window.history.replaceState(null, '', window.location.href);
    // 送信済みフラグを設定
    localStorage.setItem('contractSubmitted', 'true');
  }, []);

  const handleContinue = () => {
    // 次回フォーム開始時にフラグをクリアする場合はここで削除
    localStorage.removeItem('contractSubmitted');
    navigate('/admin-dashboard/contract/form');
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="contract-success-container">
        <h1>本契約の送信が完了しました！</h1>
        <p>本契約の内容が正常に送信されました。</p>
        <div className="contract-success-actions">
          <button onClick={() => navigate('/admin-dashboard/contract/history')}>
            本契約履歴へ
          </button>
          <button onClick={handleContinue}>
            つづけて本契約
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractSuccess;

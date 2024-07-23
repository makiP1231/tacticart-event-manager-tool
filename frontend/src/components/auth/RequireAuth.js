import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';  // 正しいフックをインポート

const RequireAuth = ({ children, role }) => {
    const { user, isAuthenticated } = useAuth(); // useAuth フックからユーザー情報と認証状態を取得
    const location = useLocation();

    console.log('RequireAuth - user:', user); // コンソールログを追加
    console.log('RequireAuth - isAuthenticated:', isAuthenticated); // コンソールログを追加

    if (!isAuthenticated || !user || user.role !== role) {
        // ログインページにリダイレクトする
        const redirectTo = role === 'admin' ? '/admin-login' : '/artist-login';
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return children;  // 認証が通れば子コンポーネントを表示
};

export default RequireAuth;

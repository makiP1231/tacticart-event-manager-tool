import { useState, useEffect, useContext, createContext } from 'react';

// 認証コンテキストの作成
const AuthContext = createContext({ user: null });

// 認証プロバイダー
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // セッション情報を取得してユーザーを設定
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/session`, {
          credentials: 'include', // クッキーを含める
        });
        const data = await response.json();
        if (response.ok) {
          setUser({ userId: data.userId, role: data.role });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuthフック
export const useAuth = () => {
  return useContext(AuthContext);
};

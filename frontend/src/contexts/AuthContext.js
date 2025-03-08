import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // fetchSession 関数を定義
  const fetchSession = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/session`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);  
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

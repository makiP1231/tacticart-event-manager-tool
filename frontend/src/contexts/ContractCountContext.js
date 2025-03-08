// src/contexts/ContractCountContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ContractCountContext = createContext();

export const ContractCountProvider = ({ children }) => {
  const [contractCount, setContractCount] = useState(0);
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchContractCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/contract-count`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setContractCount(data.count);
      } else {
        console.error('Failed to fetch contract count:', data.message);
      }
    } catch (error) {
      console.error('Error fetching contract count:', error);
    }
  };

  // マウント時に1回取得
  useEffect(() => {
    fetchContractCount();
  }, []);

  // 他コンポーネントから再取得できるように関数を公開
  const refreshContractCount = async () => {
    await fetchContractCount();
  };

  return (
    <ContractCountContext.Provider value={{ contractCount, refreshContractCount }}>
      {children}
    </ContractCountContext.Provider>
  );
};

export const useContractCount = () => useContext(ContractCountContext);

// src/contexts/OfferCountContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const OfferCountContext = createContext();

export const OfferCountProvider = ({ children }) => {
  const [offerCount, setOfferCount] = useState(0);
  const API_URL = process.env.REACT_APP_API_URL;

  // バッチ用の件数を取得する関数
  const fetchOfferCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/artist/offer-count`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setOfferCount(data.count);
      } else {
        console.error('Failed to fetch offer count:', data.message);
      }
    } catch (error) {
      console.error('Error fetching offer count:', error);
    }
  };

  // 回答後に呼び出すための公開関数
  const refreshOfferCount = async () => {
    await fetchOfferCount();
  };

  // マウント時に1回だけ取得
  useEffect(() => {
    fetchOfferCount();
  }, []);

  return (
    <OfferCountContext.Provider value={{ offerCount, refreshOfferCount }}>
      {children}
    </OfferCountContext.Provider>
  );
};

export const useOfferCount = () => useContext(OfferCountContext);

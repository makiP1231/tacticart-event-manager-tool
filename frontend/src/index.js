// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { OfferCountProvider } from './contexts/OfferCountContext';
import { ContractCountProvider } from './contexts/ContractCountContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <OfferCountProvider>
        <ContractCountProvider>
          <App />
        </ContractCountProvider>
      </OfferCountProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();

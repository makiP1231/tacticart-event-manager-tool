import React, { useState } from 'react';

const TestConnection = () => {
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    console.log('Test connection button clicked');
    try {
      const response = await fetch('http://localhost:5001/api/test-connection');
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('Connection failed');
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>Test Connection</h1>
      <button onClick={testConnection}>Test Connection</button>
      <p>{message}</p>
    </div>
  );
};

export default TestConnection;

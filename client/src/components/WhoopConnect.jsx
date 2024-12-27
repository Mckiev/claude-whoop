import React, { useState } from 'react';
import axios from 'axios';

const WhoopConnect = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/whoop/auth');
      window.location.href = response.data.authUrl;
    } catch (error) {
      setError('Failed to initialize WHOOP connection');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Connecting...' : 'Connect WHOOP Account'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default WhoopConnect;
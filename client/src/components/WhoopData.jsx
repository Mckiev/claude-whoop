import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WhoopData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (endpoint) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/whoop/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setData(response.data);
    } catch (error) {
      setError('Failed to fetch WHOOP data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => fetchData('recovery')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Get Recovery Data
        </button>
        <button
          onClick={() => fetchData('sleep')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Get Sleep Data
        </button>
        <button
          onClick={() => fetchData('workouts')}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Get Workout Data
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {data && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default WhoopData;
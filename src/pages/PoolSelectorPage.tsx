import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { POOLS } from '../config/constants';


const PoolSelectorPage = () => {
  const [selected, setSelected] = useState(POOLS[0].address);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-white to-blue-50 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Select a Pool to Trade</h1>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-64 p-3 mb-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 focus:ring-2 focus:ring-blue-400"
      >
        {POOLS.map((pool) => (
          <option key={pool.address} value={pool.address}>
            {pool.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => navigate(`/swap?pool=${selected}`)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Enter Pool
      </button>
    </div>
  );
};

export default PoolSelectorPage;
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { POOLS } from '../config/constants';


const PoolSelectorPage = () => {
  const [selected, setSelected] = useState(POOLS[0].address);
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Select a Pool to Trade</h1>
      <div className="swap-container">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="dropdown"
        >
          {POOLS.map((pool) => (
            <option key={pool.address} value={pool.address}>
              {pool.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => navigate(`/swap?pool=${selected}`)}
          className="swap-button"
        >
          Enter Pool
        </button>
      </div>
    </div>
  );
};

export default PoolSelectorPage;
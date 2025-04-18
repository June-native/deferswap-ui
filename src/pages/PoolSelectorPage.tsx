import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { POOLS } from '../config/constants';


const PoolSelectorPage = () => {
  const [selected, setSelected] = useState(POOLS[0].address);
  const navigate = useNavigate();

  return (
    <div className="main-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem', marginTop: '2rem' }}>
      <h2 className="main-title">🐳 🔸 DeferSwap</h2>
      <div className="sub-container">
        <h2 className="oracle-title">Select a Pool to Start</h2>
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
          className="swap-button full-width-button"
        >
          Swap
        </button>

        <button
          onClick={() => navigate(`/mm?pool=${selected}`)}
          className="swap-button full-width-button"
        >
          PMM Quote
        </button>
      </div>
    </div>
  );
};

export default PoolSelectorPage;
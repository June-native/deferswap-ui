import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { factoryAbi } from '../config/abi';
import { factoryLimitOrder as factoryAddress, LIMIT_ORDER_POOLS as POOLS, NETWORK, SKIP_FIRST_X_LIMIT_ORDER_POOLS as SKIP_FIRST_X_POOLS, APP_TITLE } from '../config/constants';
import { publicClient } from '../lib/viem';

const SelectPoolLimitPage = () => {
  const [selected, setSelected] = useState('');
  const [factoryPools, setFactoryPools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to fetch a pool at a specific index
  const fetchPoolAtIndex = async (index: number) => {
    try {
      const pool = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: factoryAbi,
        functionName: 'allPools',
        args: [BigInt(index)],
      });
      return pool as string;
    } catch (err) {
      return null;
    }
  };

  // Function to fetch all pools from factory
  const fetchAllFactoryPools = async () => {
    const pools: string[] = [];
    let index = SKIP_FIRST_X_POOLS;
    
    while (true) {
      const pool = await fetchPoolAtIndex(index);
      if (!pool) break;
      pools.push(pool);
      index++;
    }
    
    setFactoryPools(pools);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllFactoryPools();
  }, []);

  // Update selected pool when factory pools are loaded
  useEffect(() => {
    if (!loading && factoryPools.length > 0) {
      setSelected(factoryPools[0]); // Select the first (newest) factory pool
    }
  }, [loading, factoryPools]);

  // Combine POOLS and factory pools
  const factoryPoolsSorted = factoryPools.map((address, index) => ({
    label: `Public Pool 0x...${address.slice(-6)}`,
    address,
    isFactory: true,
  })).reverse();

  const allPools = [
    ...factoryPoolsSorted,
    ...POOLS.map(pool => ({
      ...pool,
      isFactory: false,
    })),
  ];

  // Ensure we have a valid selected pool
  useEffect(() => {
    if (!loading && allPools.length > 0 && !selected) {
      setSelected(allPools[0].address);
    }
  }, [loading, allPools, selected]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', position: 'relative' }}>
      <h1 
        style={{ 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          cursor: 'pointer',
          display: 'inline-block',
          textAlign: 'center',
          width: '100%',
        }}
      >
        {APP_TITLE.LIMIT_ORDER}
      </h1>
      <div className="main-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem', marginTop: '2rem' }}>
        <h2 className="oracle-title">Select a Pool to Start</h2>
        <select
          value={loading ? '' : selected}
          onChange={(e) => setSelected(e.target.value)}
          className="dropdown"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? (
            <option value="">Loading Pools...</option>
          ) : (
            console.log(allPools),
            allPools.map((pool) => (
              <option key={pool.address} value={pool.address}>
                {pool.label}
              </option>
            ))
          )}
        </select>

        <button
          onClick={() => navigate(`/limit-order/take?pool=${selected}`)}
          className="swap-button full-width-button"
          style={{ margin: '0rem 0rem 0.5rem 0rem' }}
          disabled={loading || allPools.length === 0}
        >
          Take Order
        </button>

        <button
          onClick={() => navigate(`/limit-order/make?pool=${selected}`)}
          className="swap-button full-width-button"
          disabled={loading || allPools.length === 0}
          style={{ margin: '0rem 0rem 0.5rem 0rem' }}
        >
          Make Quote
        </button>

        <button
          onClick={() => navigate('/limit-order/deploy')}
          className="swap-button full-width-button"
          style={{ margin: '1rem 0rem 0rem 0rem', backgroundColor: '#4CAF50' }} 
        >
          Deploy New Pool
        </button>

        <button
          onClick={() => navigate('/spread-order')}
          className="swap-button full-width-button"
          style={{ margin: '1rem 0rem 0rem 0rem', backgroundColor: '#2196F3' }} 
        >
          ↕️ Switch to Spread Order
        </button>
      </div>
    </div>
  );
};

export default SelectPoolLimitPage; 
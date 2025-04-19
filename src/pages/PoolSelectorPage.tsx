import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { factoryAbi } from '../config/abi';
import { factoryAddress, POOLS, NETWORK } from '../config/constants';
import { publicClient } from '../lib/viem';

const PoolSelectorPage = () => {
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
    let index = 1;
    
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
  const allPools = [
    // Factory pools in descending order (newest first)
    ...factoryPools.map((address, index) => ({
      label: `Public Pool 0x...${address.slice(-6)}`,
      address,
      isFactory: true,
      index: factoryPools.length - 1 - index, // Reverse the index for descending order
    })).sort((a, b) => b.index - a.index), // Sort by index in descending order
    // Pre-configured pools
    ...POOLS.map(pool => ({
      ...pool,
      isFactory: false,
      index: -1, // Pre-configured pools come after factory pools
    })),
  ];

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
        🐳 🔸 DeferSwap
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
            allPools.map((pool) => (
              <option key={pool.address} value={pool.address}>
                {pool.isFactory ? `Public Pool 0x...${pool.address.slice(-6)}` : pool.label}
              </option>
            ))
          )}
        </select>

        <button
          onClick={() => navigate(`/swap?pool=${selected}`)}
          className="swap-button full-width-button"
          style={{ margin: '0rem 0rem 0.5rem 0rem' }}
          disabled={loading}
        >
          Swap
        </button>

        <button
          onClick={() => navigate(`/mm?pool=${selected}`)}
          className="swap-button full-width-button"
          disabled={loading}
          style={{ margin: '0rem 0rem 0.5rem 0rem' }}
        >
          PMM Quote
        </button>

        <button
          onClick={() => navigate('/deploy')}
          className="swap-button full-width-button"
          style={{ margin: '1rem 0rem 0rem 0rem', backgroundColor: '#4CAF50' }} 
        >
          Deploy New Pool
        </button>
      </div>
    </div>
  );
};

export default PoolSelectorPage;
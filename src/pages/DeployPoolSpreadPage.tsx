import { useState, useMemo } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { factoryAbi } from '../config/abi';
import { factoryAddress, PAIRS, DEFAULT_POOL_CONFIG, NETWORK, APP_TITLE } from '../config/constants';
import WalletConnectButton from '../components/WalletConnectButton';
import { useNavigate } from 'react-router-dom';
import { publicClient } from '../lib/viem';
import { useDeferswapPoolInfo } from '../hooks/usePoolInfo';

const DeployPoolSpreadPage = () => {
  const { address } = useAccount();
  const [selectedPair, setSelectedPair] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const { writeContractAsync: writeCreatePool } = useWriteContract();
  const navigate = useNavigate();

  // Get available pairs for current network
  const availablePairs = PAIRS[NETWORK.name.toLowerCase()] || [];

  // Fetch all spread pools
  const { pools: spreadPools } = useDeferswapPoolInfo(50, 0);

  // Check if pool already exists
  const existingPool = useMemo(() => {
    if (!spreadPools || !address || !selectedPair) return null;

    const pair = availablePairs.find(p => p.label === selectedPair);
    if (!pair) return null;

    return spreadPools.find(pool => 
      pool.baseToken.toLowerCase() === pair.baseToken.toLowerCase() &&
      pool.quoteToken.toLowerCase() === pair.quoteToken.toLowerCase() &&
      pool.marketMaker.toLowerCase() === address.toLowerCase()
    );
  }, [spreadPools, address, selectedPair, availablePairs]);

  const handleDeploy = async () => {
    if (!address || !selectedPair) return;

    try {
      setSendingTx(true);
      const pair = availablePairs.find(p => p.label === selectedPair);
      if (!pair) throw new Error('Invalid pair selected');

      const hash = await writeCreatePool({
        address: factoryAddress as `0x${string}`,
        abi: factoryAbi,
        functionName: 'createPool',
        args: [
          pair.flipOraclePrice,
          pair.quoteToken,
          pair.baseToken,
          pair.priceFeed,
          parseUnits(DEFAULT_POOL_CONFIG.minQuoteSize.toString(), 18),
          BigInt(DEFAULT_POOL_CONFIG.settlementPeriod),
          BigInt(DEFAULT_POOL_CONFIG.penaltyRate),
        ],
        account: address,
        chain: NETWORK.chain,
      });
      console.log("Pool deployed: ", hash);

      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Navigate to all-pools with myPools=true
      navigate('/all-pools?tab=deferswap&myPools=true');
    } catch (err) {
      console.error('Pool deployment failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleUseExistingPool = () => {
    if (existingPool) {
      navigate(`/spread-order/make?pool=${existingPool.poolAddress}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', position: 'relative' }}>
      <h1 
        style={{ 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          cursor: 'pointer',
          display: 'inline-block'
        }}
        onClick={() => window.location.href = '/all-pools?tab=deferswap'}
      >
        {APP_TITLE.SPREAD_ORDER} ({NETWORK.name})
      </h1>
      <WalletConnectButton />
      <div className="main-container">
        <h2 className="main-title">Deploy New Pool</h2>
        
        {address && (
          <>
            <div className="input-group-container">
              <label style={{ marginRight: '0.5rem' }}>Select Trading Pair:</label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="dropdown"
                disabled={sendingTx}
                style={{ minWidth: '250px' }}
              >
                <option value="">Select a pair</option>
                {availablePairs.map((pair) => (
                  <option key={pair.label} value={pair.label}>
                    {pair.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="compact-list">
              <div><b>Min Quote Size:</b> {DEFAULT_POOL_CONFIG.minQuoteSize}</div>
              <div><b>Settlement Period:</b> {DEFAULT_POOL_CONFIG.settlementPeriod / (60 * 60)} hours</div>
              <div><b>Penalty Rate:</b> {DEFAULT_POOL_CONFIG.penaltyRate / 100}%</div>
            </div>

            {existingPool && (
              <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>An existing pool was found with these parameters:</p>
                <div className="compact-list">
                  <div><b>Pool Address:</b> {existingPool.poolAddress}</div>
                  <div><b>Min Quote Size:</b> {formatUnits(BigInt(existingPool.minQuoteSize), 18)}</div>
                  <div><b>Settlement Period:</b> {Number(BigInt(existingPool.settlementPeriod)) / (60 * 60)} hours</div>
                  <div><b>Penalty Rate:</b> {(Number(BigInt(existingPool.penaltyRate)) / 100).toFixed(2)}%</div>
                </div>
              </div>
            )}

            <button
              onClick={existingPool ? handleUseExistingPool : handleDeploy}
              disabled={!address || !selectedPair || sendingTx}
              className="button full-width-button"
            >
              {sendingTx ? 'Deploying...' : existingPool ? 'Make Quote using Existing Pool' : 'Deploy Pool'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DeployPoolSpreadPage; 
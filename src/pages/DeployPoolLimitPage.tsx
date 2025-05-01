import { useState, useMemo } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { factoryAbiLimit as factoryAbi } from '../config/abi';
import { factoryLimitOrder, LIMIT_ORDER_PAIRS as PAIRS, NETWORK, APP_TITLE } from '../config/constants';
import WalletConnectButton from '../components/WalletConnectButton';
import { useNavigate } from 'react-router-dom';
import { publicClient } from '../lib/viem';
import { useLimitswapPoolInfo } from '../hooks/usePoolInfo';

const DeployPoolLimitPage = () => {
  const { address } = useAccount();
  const [selectedPair, setSelectedPair] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const [useCustomParams, setUseCustomParams] = useState(false);
  const [baseToken, setBaseToken] = useState('');
  const [quoteToken, setQuoteToken] = useState('');
  const [collateralIsBase, setCollateralIsBase] = useState(true);
  const { writeContractAsync: writeCreatePool } = useWriteContract();
  const navigate = useNavigate();

  // Get available pairs for current network
  const availablePairs = PAIRS[NETWORK.name.toLowerCase()] || [];

  // Fetch all limit pools
  const { pools: limitPools } = useLimitswapPoolInfo(50, 0);

  // Check if pool already exists
  const existingPool = useMemo(() => {
    if (!limitPools || !address) return null;

    const targetBaseToken = useCustomParams ? baseToken : availablePairs.find(p => p.label === selectedPair)?.baseToken;
    const targetQuoteToken = useCustomParams ? quoteToken : availablePairs.find(p => p.label === selectedPair)?.quoteToken;
    const targetCollateralIsBase = useCustomParams ? collateralIsBase : availablePairs.find(p => p.label === selectedPair)?.collateralIsBase;

    if (!targetBaseToken || !targetQuoteToken) return null;

    return limitPools.find(pool => 
      pool.baseToken.toLowerCase() === targetBaseToken.toLowerCase() &&
      pool.quoteToken.toLowerCase() === targetQuoteToken.toLowerCase() &&
      pool.collateralIsBase === targetCollateralIsBase &&
      pool.marketMaker.toLowerCase() === address.toLowerCase()
    );
  }, [limitPools, address, selectedPair, baseToken, quoteToken, collateralIsBase, useCustomParams, availablePairs]);

  const handleDeploy = async () => {
    if (!address) return;
    if (!useCustomParams && !selectedPair) return;
    if (useCustomParams && (!baseToken || !quoteToken)) return;

    try {
      setSendingTx(true);
      let quoteTokenAddress, baseTokenAddress, collateralIsBaseValue, collateralRateLimit;

      if (useCustomParams) {
        quoteTokenAddress = quoteToken;
        baseTokenAddress = baseToken;
        collateralIsBaseValue = collateralIsBase;
        collateralRateLimit = 2000; // 20% default collateral rate
      } else {
        const pair = availablePairs.find(p => p.label === selectedPair);
        if (!pair) throw new Error('Invalid pair selected');
        quoteTokenAddress = pair.quoteToken;
        baseTokenAddress = pair.baseToken;
        collateralIsBaseValue = pair.collateralIsBase;
        collateralRateLimit = pair.collateralRateLimit;
      }

      const hash = await writeCreatePool({
        address: factoryLimitOrder as `0x${string}`,
        abi: factoryAbi,
        functionName: 'createPool',
        args: [
          quoteTokenAddress,
          baseTokenAddress,
          address,
          collateralIsBaseValue,
          collateralRateLimit,
        ],
        account: address,
        chain: NETWORK.chain,
      });
      console.log("Limit Order Pool deployed: ", hash);

      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Navigate back to limit order pool select page
      navigate('/limit-order');
    } catch (err) {
      console.error('Limit Order Pool deployment failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleUseExistingPool = () => {
    if (existingPool) {
      navigate(`/limit-order/make?pool=${existingPool.poolAddress}`);
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
        onClick={() => window.location.href = '/limit-order'}
      >
        {APP_TITLE.LIMIT_ORDER} ({NETWORK.name})
      </h1>
      <WalletConnectButton />
      <div className="main-container">
        <h2 className="main-title">Deploy New Limit Order Pool</h2>
        
        {address && (
          <>
            <div className="input-group-container" style={{ marginBottom: '1rem' }}>
              <label style={{ marginRight: '0.5rem' }}>Use Custom Parameters:</label>
              <input
                type="checkbox"
                checked={useCustomParams}
                onChange={(e) => setUseCustomParams(e.target.checked)}
                disabled={sendingTx}
              />
            </div>

            {!useCustomParams ? (
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
                  <div><b>Collateral In:</b> {selectedPair ? (availablePairs.find(p => p.label === selectedPair)?.collateralIsBase ? 'Base Token' : 'Quote Token') : '-'}</div>
                  <div><b>Collateral Rate Limit:</b> {selectedPair ? availablePairs.find(p => p.label === selectedPair)?.collateralRateLimit / 100 : '-'}%</div>
                </div>
              </>
            ) : (
              <>
                <div className="input-group-container">
                  <label style={{ marginRight: '0.5rem' }}>Selling(base) Token Address:</label>
                  <input
                    type="text"
                    value={baseToken}
                    onChange={(e) => setBaseToken(e.target.value)}
                    className="dropdown"
                    disabled={sendingTx}
                    style={{ minWidth: '250px' }}
                    placeholder="0x..."
                  />
                </div>

                <div className="input-group-container">
                  <label style={{ marginRight: '0.5rem' }}>Buying(quote) Token Address:</label>
                  <input
                    type="text"
                    value={quoteToken}
                    onChange={(e) => setQuoteToken(e.target.value)}
                    className="dropdown"
                    disabled={sendingTx}
                    style={{ minWidth: '250px' }}
                    placeholder="0x..."
                  />
                </div>

                <div className="input-group-container">
                  <label style={{ marginRight: '0.5rem' }}>Collateral Token:</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label>
                      <input
                        type="radio"
                        checked={collateralIsBase}
                        onChange={() => setCollateralIsBase(true)}
                        disabled={sendingTx}
                      />
                      Selling(base) Token
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={!collateralIsBase}
                        onChange={() => setCollateralIsBase(false)}
                        disabled={sendingTx}
                      />
                      Buying(quote) Token
                    </label>
                  </div>
                </div>

                <div className="compact-list">
                  <div><b>Collateral In:</b> {collateralIsBase ? 'Base Token' : 'Quote Token'}</div>
                  <div><b>Collateral Rate Limit:</b> 20%</div>
                </div>
              </>
            )}

            {existingPool && (
              <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>An existing pool was found with these parameters:</p>
                <div className="compact-list">
                  <div><b>Pool Address:</b> {existingPool.poolAddress}</div>
                  <div><b>Collateral In:</b> {existingPool.collateralIsBase ? 'Base Token' : 'Quote Token'}</div>
                  <div><b>Collateral Rate Limit:</b> {(Number(existingPool.collateralRateLimit) / 100).toFixed(2)}%</div>
                </div>
              </div>
            )}

            <button
              onClick={existingPool ? handleUseExistingPool : handleDeploy}
              disabled={!address || (!useCustomParams && !selectedPair) || (useCustomParams && (!baseToken || !quoteToken)) || sendingTx}
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

export default DeployPoolLimitPage; 
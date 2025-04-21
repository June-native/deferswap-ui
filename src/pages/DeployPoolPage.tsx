import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { factoryAbi } from '../config/abi';
import { factoryAddress, PAIRS, DEFAULT_POOL_CONFIG, NETWORK } from '../config/constants';
import WalletConnectButton from '../components/WalletConnectButton';

const DeployPoolPage = () => {
  const { address } = useAccount();
  const [selectedPair, setSelectedPair] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const { writeContractAsync: writeCreatePool } = useWriteContract();

  // Get available pairs for current network
  const availablePairs = PAIRS[NETWORK.name.toLowerCase()] || [];

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
    } catch (err) {
      console.error('Pool deployment failed:', err);
    } finally {
      setSendingTx(false);
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
        onClick={() => window.location.href = '/'}
      >
        🐳 🔸 DeferSwap ({NETWORK.name})
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

            <button
              onClick={handleDeploy}
              disabled={!address || !selectedPair || sendingTx}
              className="button full-width-button"
            >
              {sendingTx ? 'Deploying...' : 'Deploy Pool'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DeployPoolPage; 
import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { factoryAbiLimit as factoryAbi } from '../config/abi';
import { factoryLimitOrder, LIMIT_ORDER_PAIRS as PAIRS, NETWORK, APP_TITLE } from '../config/constants';
import WalletConnectButton from '../components/WalletConnectButton';
import { useNavigate } from 'react-router-dom';
import { publicClient } from '../lib/viem';

const DeployPoolLimitPage = () => {
  const { address } = useAccount();
  const [selectedPair, setSelectedPair] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const { writeContractAsync: writeCreatePool } = useWriteContract();
  const navigate = useNavigate();

  // Get available pairs for current network
  const availablePairs = PAIRS[NETWORK.name.toLowerCase()] || [];

  const handleDeploy = async () => {
    if (!address || !selectedPair) return;

    try {
      setSendingTx(true);
      const pair = availablePairs.find(p => p.label === selectedPair);
      if (!pair) throw new Error('Invalid pair selected');

      console.log(pair, address);

      const hash = await writeCreatePool({
        address: factoryLimitOrder as `0x${string}`,
        abi: factoryAbi,
        functionName: 'createPool',
        args: [
          pair.quoteToken,
          pair.baseToken,
          address,
          pair.collateralIsBase,
          pair.collateralRateLimit,
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

export default DeployPoolLimitPage; 
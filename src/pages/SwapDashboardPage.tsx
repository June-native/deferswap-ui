import { useAccount, useConnect, useDisconnect } from 'wagmi';
import TakeSwapComponent from '../components/TakeSwapComponent';
import OraclePriceDisplay from '../components/OraclePriceDisplay';
import UserSwapHistory from '../components/UserSwapHistory';
import WalletConnectButton from '../components/WalletConnectButton';
import { useState } from 'react';


const SwapDashboardPage = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>🐳 DeferSwap PoC</h1>
      <WalletConnectButton />

      <OraclePriceDisplay />
      <div style={{ marginBottom: '2rem' }}/>
      <TakeSwapComponent onSwapSuccess={() => setRefreshKey(k => k + 1)} />
      <div style={{ marginBottom: '2rem' }}/>
      <UserSwapHistory refreshKey={refreshKey} />
    </div>
  );
};

export default SwapDashboardPage;

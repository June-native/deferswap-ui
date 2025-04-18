import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useLocation } from 'react-router-dom';
import TakeSwapComponent from '../components/TakeSwapComponent';
import OraclePriceDisplay from '../components/OraclePriceDisplay';
import UserSwapHistory from '../components/UserSwapHistory';
import WalletConnectButton from '../components/WalletConnectButton';
import { useEffect, useState } from 'react';
import { publicClient } from '../lib/viem';
import { erc20Abi } from 'viem';
import { poolAbi } from '../config/abi';
import { bsc as chain } from 'viem/chains';


const useQuery = () => new URLSearchParams(useLocation().search);

const SwapDashboardPage = () => {
  const query = useQuery();
  const poolAddress = query.get('pool');
  if (!poolAddress) return <p>No pool selected.</p>;

  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [refreshKey, setRefreshKey] = useState(0);

  const [baseTokenMeta, setBaseTokenMeta] = useState({ symbol: '', decimals: 18 });
  const [quoteTokenMeta, setQuoteTokenMeta] = useState({ symbol: '', decimals: 18 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!poolAddress) return;

      const [baseToken, quoteToken] = await Promise.all([
        publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: poolAbi,
          functionName: 'baseToken',
        }),
        publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: poolAbi,
          functionName: 'quoteToken',
        }),
      ]);

      const [baseSymbol, baseDecimals] = await Promise.all([
        publicClient.readContract({ address: baseToken as `0x${string}`, abi: erc20Abi, functionName: 'symbol' }),
        publicClient.readContract({ address: baseToken as `0x${string}`, abi: erc20Abi, functionName: 'decimals' }),
      ]);

      const [quoteSymbol, quoteDecimals] = await Promise.all([
        publicClient.readContract({ address: quoteToken as `0x${string}`, abi: erc20Abi, functionName: 'symbol' }),
        publicClient.readContract({ address: quoteToken as `0x${string}`, abi: erc20Abi, functionName: 'decimals' }),
      ]);

      setBaseTokenMeta({ symbol: baseSymbol, decimals: baseDecimals });
      setQuoteTokenMeta({ symbol: quoteSymbol, decimals: quoteDecimals });
      setReady(true);
    };

    loadMetadata();
  }, [poolAddress]);

  if (!ready || !poolAddress) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <p className="animate-spin loader">↻</p> 
          <h2 style={{ fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>Loading Pool Information...</h2>
      </div>
    );
  }

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
        🐳 🔸 DeferSwap (Bsc {baseTokenMeta.symbol}/{quoteTokenMeta.symbol})
      </h1>
      <WalletConnectButton />

      <OraclePriceDisplay poolAddress={poolAddress} baseTokenMeta={baseTokenMeta} quoteTokenMeta={quoteTokenMeta} />
      <div style={{ marginBottom: '2rem' }}/>
      <TakeSwapComponent onSwapSuccess={() => setRefreshKey(k => k + 1)} poolAddress={poolAddress} baseTokenMeta={baseTokenMeta} quoteTokenMeta={quoteTokenMeta} />
      <div style={{ marginBottom: '2rem' }}/>
      <UserSwapHistory refreshKey={refreshKey} poolAddress={poolAddress} baseTokenMeta={baseTokenMeta} quoteTokenMeta={quoteTokenMeta} />
    </div>
  );
};

export default SwapDashboardPage;

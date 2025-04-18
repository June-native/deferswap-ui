import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useLocation } from 'react-router-dom';
import TakeSwapComponent from '../components/TakeSwapComponent';
import OraclePriceDisplay from '../components/OraclePriceDisplay';
import UserSwapHistory from '../components/UserSwapHistory';
import AllQuoteHistory from '../components/AllQuoteHistory';
import WalletConnectButton from '../components/WalletConnectButton';
import MakeQuoteComponent from '../components/MakeQuoteComponent';
import { useEffect, useState, useRef } from 'react';
import { publicClient } from '../lib/viem';
import { erc20Abi } from 'viem';
import { poolAbi } from '../config/abi';
import { bsc as chain } from 'viem/chains';


const useQuery = () => new URLSearchParams(useLocation().search);

const SwapMMPage = () => {
  const query = useQuery();
  const poolAddress = query.get('pool');
  if (!poolAddress) return <p>No pool selected.</p>;

  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [refreshKey, setRefreshKey] = useState(0);
  const allQuoteHistoryRef = useRef<{ refresh: () => void }>(null);

  const [baseTokenMeta, setBaseTokenMeta] = useState({ symbol: '', decimals: 18 });
  const [quoteTokenMeta, setQuoteTokenMeta] = useState({ symbol: '', decimals: 18 });
  const [ready, setReady] = useState(false);
  const [marketMaker, setMarketMaker] = useState<string | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!poolAddress) return;

      const [baseToken, quoteToken, mm] = await Promise.all([
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
        publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: poolAbi,
          functionName: 'marketMaker',
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
      setMarketMaker(mm);
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
      <div style={{ marginBottom: '2rem' }}/>
      <AllQuoteHistory ref={allQuoteHistoryRef} poolAddress={poolAddress} baseTokenMeta={baseTokenMeta} quoteTokenMeta={quoteTokenMeta} />
      <div style={{ marginBottom: '2rem' }}/>
      <MakeQuoteComponent
        poolAddress={poolAddress}
        baseTokenMeta={baseTokenMeta}
        quoteTokenMeta={quoteTokenMeta}
        onQuoteSuccess={() => {
        }}
        onRefreshQuotes={() => {
          allQuoteHistoryRef.current?.refresh();
        }}
        marketMaker={marketMaker}
      />
    </div>
  );
};

export default SwapMMPage;

import { useLocation } from 'react-router-dom';
import { useReadContract, useAccount } from 'wagmi';
import { poolAbiLimit as poolAbi } from '../config/abi';
import { erc20Abi } from 'viem';
import MakeQuoteComponentV2 from '../components/MakeQuoteComponentV2';
import AllQuoteHistoryV2 from '../components/AllQuoteHistoryV2';
import WalletConnectButton from '../components/WalletConnectButton';
import { NETWORK } from '../config/constants';

const useQuery = () => new URLSearchParams(useLocation().search);

const SwapMMPageV2 = () => {
  const query = useQuery();
  const poolAddress = query.get('pool');
  const { address, isConnected } = useAccount();

  if (!poolAddress) return <p>No pool selected.</p>;

  // Get pool parameters
  const { data: baseToken } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'baseToken',
  });

  const { data: quoteToken } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'quoteToken',
  });

  const { data: baseTokenDecimals } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
  });

  const { data: quoteTokenDecimals } = useReadContract({
    address: quoteToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
  });

  const { data: baseTokenSymbol } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
  });

  const { data: quoteTokenSymbol } = useReadContract({
    address: quoteToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
  });

  if (!poolAddress || !baseToken || !quoteToken || !baseTokenDecimals || !quoteTokenDecimals || !baseTokenSymbol || !quoteTokenSymbol) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <p className="animate-spin loader">↻</p> 
        <h2 style={{ fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>Loading Pool Information...</h2>
      </div>
    );
  }

  const baseTokenMeta = {
    symbol: baseTokenSymbol as string,
    decimals: Number(baseTokenDecimals),
  };

  const quoteTokenMeta = {
    symbol: quoteTokenSymbol as string,
    decimals: Number(quoteTokenDecimals),
  };

  const handleQuoteSuccess = () => {
    // Refresh the page or update the quote list
    window.location.reload();
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
        🐳 🔸 DeferSwap - LimitOrder ({NETWORK.name} {baseTokenMeta.symbol}/{quoteTokenMeta.symbol})
      </h1>
      <WalletConnectButton />
      <div style={{ marginBottom: '2rem' }}/>
      <AllQuoteHistoryV2
        poolAddress={poolAddress}
        baseTokenMeta={baseTokenMeta}
        quoteTokenMeta={quoteTokenMeta}
      />
      <div style={{ marginBottom: '2rem' }}/>
      <MakeQuoteComponentV2
        poolAddress={poolAddress}
        baseTokenMeta={baseTokenMeta}
        quoteTokenMeta={quoteTokenMeta}
        onQuoteSuccess={handleQuoteSuccess}
      />
    </div>
  );
};

export default SwapMMPageV2; 
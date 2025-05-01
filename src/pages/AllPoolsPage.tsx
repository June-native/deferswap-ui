import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeferswapPoolInfo, useLimitswapPoolInfo } from '../hooks/usePoolInfo';
import { formatUnits } from 'viem';
import { APP_TITLE, NETWORK } from '../config/constants';
import WalletConnectButton from '../components/WalletConnectButton';

const AllPoolsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'deferswap' | 'limitswap'>('deferswap');
  
  const { pools: deferswapPools, isLoading: isLoadingDeferswap } = useDeferswapPoolInfo(50, 0);
  const { pools: limitswapPools, isLoading: isLoadingLimitswap } = useLimitswapPoolInfo(50, 0);

  const reversedDeferswapPools = deferswapPools?.slice().reverse();
  const reversedLimitswapPools = limitswapPools?.slice().reverse();

  console.log(deferswapPools, limitswapPools);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const getSwapStatus = (swap: any) => {
    if (swap.cancelled) return 'Cancelled';
    if (swap.claimed) return 'Claimed';
    if (swap.settled) return 'Settled';
    if (swap.taken) return 'Taken';
    return 'Open';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#22c55e';
      case 'Taken': return '#3b82f6';
      case 'Settled': return '#a855f7';
      case 'Claimed': return '#eab308';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    return formatUnits(BigInt(amount), decimals);
  };

  const TokenDisplay = ({ address, tokenInfo }: { address: string, tokenInfo?: { symbol: string, name: string } }) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{tokenInfo?.symbol || formatAddress(address)}</span>
        <span style={{ color: '#666' }}>({tokenInfo?.name || 'Unknown'})</span>
        <a 
          href={`${NETWORK.explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', fontSize: '0.875rem' }}
        >
          {formatAddress(address)}
        </a>
      </div>
    );
  };

  if (isLoadingDeferswap || isLoadingLimitswap) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <p className="animate-spin loader">↻</p> 
        <h2 style={{ fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>Loading All Pools</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 
          style={{ 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            cursor: 'pointer',
            display: 'inline-block'
          }}
          onClick={() => window.location.href = '/'}
        >
          {APP_TITLE.BASE}
        </h1>
        <WalletConnectButton />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', borderRadius: '0.375rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <button
            onClick={() => setActiveTab('deferswap')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '0.375rem 0 0 0.375rem',
              backgroundColor: activeTab === 'deferswap' ? '#333' : '#eee',
              color: activeTab === 'deferswap' ? 'white' : '#333',
            }}
          >
            Spread Pools
          </button>
          <button
            onClick={() => setActiveTab('limitswap')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '0 0.375rem 0.375rem 0',
              backgroundColor: activeTab === 'limitswap' ? '#333' : '#eee',
              color: activeTab === 'limitswap' ? 'white' : '#333',
            }}
          >
            Limit Pools
          </button>
        </div>
      </div>

      {activeTab === 'deferswap' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reversedDeferswapPools?.map((pool) => (
            <div 
              key={pool.poolAddress} 
              style={{ 
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Pool {formatAddress(pool.poolAddress)}
                  </h2>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    Base: <TokenDisplay address={pool.baseToken} tokenInfo={pool.baseTokenInfo} />
                  </p>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    Quote: <TokenDisplay address={pool.quoteToken} tokenInfo={pool.quoteTokenInfo} />
                  </p>
                  <p style={{ color: '#666' }}>
                    Market Maker: 
                    <a 
                      href={`${NETWORK.explorerUrl}/address/${pool.marketMaker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', marginLeft: '0.5rem' }}
                    >
                      {formatAddress(pool.marketMaker)}
                    </a>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => navigate(`/spread-order/make?pool=${pool.poolAddress}`)}
                    className="button"
                  >
                    Make Quote
                  </button>
                  <button
                    onClick={() => navigate(`/spread-order/take?pool=${pool.poolAddress}`)}
                    className="swap-button"
                  >
                    Take Swap
                  </button>
                </div>
              </div>

              {pool.latestSwap && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Latest Swap</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p>
                        Swapper: 
                        <a 
                          href={`${NETWORK.explorerUrl}/address/${pool.latestSwap.swapper}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', marginLeft: '0.5rem' }}
                        >
                          {formatAddress(pool.latestSwap.swapper)}
                        </a>
                      </p>
                      <p>Quote Amount: {formatAmount(pool.latestSwap.quoteAmount, pool.quoteTokenInfo?.decimals)} {pool.quoteTokenInfo?.symbol}</p>
                      <p>Base Amount: {formatAmount(pool.latestSwap.baseAmount, pool.baseTokenInfo?.decimals)} {pool.baseTokenInfo?.symbol}</p>
                    </div>
                    <div>
                      <p>Status: <span style={{ color: getStatusColor(getSwapStatus(pool.latestSwap)) }}>
                        {getSwapStatus(pool.latestSwap)}
                      </span></p>
                      <p>Expiry: {formatTimestamp(pool.latestSwap.expiry)}</p>
                      <p>Price: {pool.latestSwap.price}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reversedLimitswapPools?.map((pool) => (
            <div 
              key={pool.poolAddress} 
              style={{ 
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Pool {formatAddress(pool.poolAddress)}
                  </h2>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    Base: <TokenDisplay address={pool.baseToken} tokenInfo={pool.baseTokenInfo} />
                  </p>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    Quote: <TokenDisplay address={pool.quoteToken} tokenInfo={pool.quoteTokenInfo} />
                  </p>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    Market Maker: 
                    <a 
                      href={`${NETWORK.explorerUrl}/address/${pool.marketMaker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', marginLeft: '0.5rem' }}
                    >
                      {formatAddress(pool.marketMaker)}
                    </a>
                  </p>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>Collateral: {pool.collateralIsBase ? 'Base' : 'Quote'}</p>
                  <p style={{ color: '#666' }}>Collateral Rate Limit: {(Number(pool.collateralRateLimit) / 100).toFixed(2)}%</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => navigate(`/limit-order/make?pool=${pool.poolAddress}`)}
                    className="button"
                  >
                    Make Quote
                  </button>
                  <button
                    onClick={() => navigate(`/limit-order/take?pool=${pool.poolAddress}`)}
                    className="swap-button"
                  >
                    Take Swap
                  </button>
                </div>
              </div>

              {pool.latestSwap && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Latest Swap</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p>
                        Swapper: 
                        <a 
                          href={`${NETWORK.explorerUrl}/address/${pool.latestSwap.swapper}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', marginLeft: '0.5rem' }}
                        >
                          {formatAddress(pool.latestSwap.swapper)}
                        </a>
                      </p>
                      <p>Quote Amount: {formatAmount(pool.latestSwap.quoteAmount, pool.quoteTokenInfo?.decimals)} {pool.quoteTokenInfo?.symbol}</p>
                      <p>Base Amount: {formatAmount(pool.latestSwap.baseAmount, pool.baseTokenInfo?.decimals)} {pool.baseTokenInfo?.symbol}</p>
                      <p>Min Quote: {formatAmount(pool.latestSwap.minQuoteAmount, pool.quoteTokenInfo?.decimals)} {pool.quoteTokenInfo?.symbol}</p>
                    </div>
                    <div>
                      <p>Status: <span style={{ color: getStatusColor(getSwapStatus(pool.latestSwap)) }}>
                        {getSwapStatus(pool.latestSwap)}
                      </span></p>
                      <p>Order Expiry: {formatTimestamp(pool.latestSwap.orderExpiry)}</p>
                      <p>Settle Expiry: {formatTimestamp(pool.latestSwap.settleExpiry)}</p>
                      <p>Collateral Rate: {(Number(pool.latestSwap.collateralRate) / 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPoolsPage; 
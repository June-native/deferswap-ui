import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDeferswapPoolInfo, useLimitswapPoolInfo } from '../hooks/usePoolInfo';
import { useTokenInfo, TokenInfo } from '../hooks/useTokenInfo';
import { formatUnits } from 'viem';
import { APP_TITLE, NETWORK } from '../config/constants';
import WalletConnectButton from '../components/WalletConnectButton';
import { useAccount } from 'wagmi';

const TokenInfoProvider = ({ 
  addresses, 
  children 
}: { 
  addresses: string[], 
  children: (props: { tokenInfoMap: Record<string, TokenInfo>, isLoading: boolean }) => React.ReactNode 
}) => {
  const tokenInfoMap: Record<string, TokenInfo> = {};
  let isLoading = false;

  addresses.forEach(address => {
    const { tokenInfo, isLoading: isTokenLoading } = useTokenInfo(address);
    if (tokenInfo) {
      tokenInfoMap[address] = tokenInfo;
    }
    if (isTokenLoading) {
      isLoading = true;
    }
  });

  return <>{children({ tokenInfoMap, isLoading })}</>;
};

const AllPoolsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { address } = useAccount();
  
  const activeTab = (searchParams.get('tab') || 'deferswap') as 'deferswap' | 'limitswap';
  const showMyPoolsOnly = searchParams.get('myPools') === 'true';
  const showOpenOrdersOnly = searchParams.get('openOrders') === 'true';
  
  const handleTabChange = (tab: 'deferswap' | 'limitswap') => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    });
  };

  const handleMyPoolsToggle = (checked: boolean) => {
    setSearchParams(prev => {
      prev.set('myPools', checked.toString());
      return prev;
    });
  };

  const handleOpenOrdersToggle = (checked: boolean) => {
    setSearchParams(prev => {
      prev.set('openOrders', checked.toString());
      return prev;
    });
  };

  const { pools: deferswapPools, isLoading: isLoadingDeferswap } = useDeferswapPoolInfo(50, 0);
  const { pools: limitswapPools, isLoading: isLoadingLimitswap } = useLimitswapPoolInfo(50, 0);

  const filteredDeferswapPools = useMemo(() => {
    if (!deferswapPools) return [];
    return deferswapPools.slice().reverse().filter(pool => {
      const isMyPool = !showMyPoolsOnly || !address || 
        pool.marketMaker.toLowerCase() === address.toLowerCase() ||
        (pool.latestSwap && pool.latestSwap.swapper.toLowerCase() === address.toLowerCase());
      
      const hasOpenOrder = !showOpenOrdersOnly || 
        (pool.latestSwap && !pool.latestSwap.taken && !pool.latestSwap.cancelled && Number(pool.latestSwap.maxQuoteSize) > 0);
      
      return isMyPool && hasOpenOrder;
    });
  }, [deferswapPools, showMyPoolsOnly, showOpenOrdersOnly, address]);

  const filteredLimitswapPools = useMemo(() => {
    if (!limitswapPools) return [];
    return limitswapPools.slice().reverse().map(pool => {
      if (pool.latestSwap && !pool.latestSwap.taken && !pool.latestSwap.cancelled) {
        const now = Math.floor(Date.now() / 1000);
        const orderExpiry = Number(pool.latestSwap.orderExpiry);
        if (orderExpiry > 0 && orderExpiry < now) {
          pool.latestSwap = { ...pool.latestSwap, expired: true };
        }
      }
      return pool;
    }).filter(pool => {
      const isMyPool = !showMyPoolsOnly || !address || 
        pool.marketMaker.toLowerCase() === address.toLowerCase() ||
        (pool.latestSwap && pool.latestSwap.swapper.toLowerCase() === address.toLowerCase());
      
      const hasOpenOrder = !showOpenOrdersOnly || 
        (pool.latestSwap && !pool.latestSwap.taken && !pool.latestSwap.cancelled && !pool.latestSwap.expired && Number(pool.latestSwap.orderExpiry) > 0 );
      
      return isMyPool && hasOpenOrder;
    });
  }, [limitswapPools, showMyPoolsOnly, showOpenOrdersOnly, address]);

  const uniqueTokenAddresses = useMemo(() => {
    const addresses = new Set<string>();
    if (deferswapPools) {
      deferswapPools.forEach(pool => {
        addresses.add(pool.baseToken);
        addresses.add(pool.quoteToken);
      });
    }
    if (limitswapPools) {
      limitswapPools.forEach(pool => {
        addresses.add(pool.baseToken);
        addresses.add(pool.quoteToken);
      });
    }
    return Array.from(addresses);
  }, [deferswapPools, limitswapPools]);

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
    if (swap.expired) return 'Expired';
    return 'Open';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#22c55e';
      case 'Taken': return '#3b82f6';
      case 'Settled': return '#a855f7';
      case 'Claimed': return '#eab308';
      case 'Cancelled': return '#ef4444';
      case 'Expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    return formatUnits(BigInt(amount), decimals);
  };

  const TokenDisplay = ({ address }: { address: string }) => {
    const { tokenInfo } = useTokenInfo(address);
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{tokenInfo?.symbol || formatAddress(address)}</span>
        <span style={{ color: '#666' }}>({tokenInfo?.name || 'Unknown'})</span>
        <a 
          href={`${NETWORK.explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#333', fontSize: '0.875rem' }}
        >
          {formatAddress(address)}
        </a>
      </span>
    );
  };

  const getUserRole = (pool: any) => {
    if (!address) return null;
    if (pool.latestSwap && pool.latestSwap.swapper.toLowerCase() === address.toLowerCase()) return 'taker';
    if (pool.marketMaker.toLowerCase() === address.toLowerCase()) return 'maker';
    return null;
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
    <TokenInfoProvider addresses={uniqueTokenAddresses}>
      {({ tokenInfoMap, isLoading: isLoadingTokens }) => {
        if (isLoadingTokens) {
          return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
              <p className="animate-spin loader">↻</p> 
              <h2 style={{ fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>Loading Token Info</h2>
            </div>
          );
        }

        return (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}} onClick={() => navigate('/start')}>{APP_TITLE.BASE}</h1>
            <WalletConnectButton />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleTabChange('deferswap')}
                  className='swap-button'
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    backgroundColor: activeTab === 'deferswap' ? '#333' : '#eee',
                    color: activeTab === 'deferswap' ? 'white' : '#333',
                    fontWeight: 'bold',
                  }}
                >
                  Spread Pools
                </button>
                <button
                  onClick={() => handleTabChange('limitswap')}
                  className='swap-button'
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    backgroundColor: activeTab === 'limitswap' ? '#333' : '#eee',
                    color: activeTab === 'limitswap' ? 'white' : '#333',
                    fontWeight: 'bold',
                  }}
                >
                  Limit Pools
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {address && (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={showMyPoolsOnly}
                        onChange={(e) => handleMyPoolsToggle(e.target.checked)}
                      />
                      Show my pools only
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={showOpenOrdersOnly}
                        onChange={(e) => handleOpenOrdersToggle(e.target.checked)}
                      />
                      Show open orders only
                    </label>
                  </>
                )}
              </div>
            </div>

            {activeTab === 'deferswap' && (
              <div>
                <h2 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Spread Pools</h2>
                {filteredDeferswapPools.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>No spread pools found</p>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredDeferswapPools.map((pool) => {
                      const userRole = getUserRole(pool);
                      return (
                        <div
                          key={pool.poolAddress}
                          style={{
                            padding: '1rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontWeight: 'bold' }}>
                              <a
                                href={`${NETWORK.explorerUrl}/address/${pool.poolAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#333' }}
                              >
                                {formatAddress(pool.poolAddress)}
                              </a>
                            </h3>
                            {userRole && (
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  backgroundColor: userRole === 'maker' ? '#dbeafe' : '#e0e7ff',
                                  color: userRole === 'maker' ? '#1e40af' : '#3730a3',
                                  fontSize: '0.875rem',
                                  fontWeight: 'medium',
                                }}
                              >
                                {userRole === 'maker' ? 'Maker' : 'Taker'}
                              </span>
                            )}
                          </div>
                          <div className='sub-container' style={{ border: 'none', background: 'none', padding: '0', paddingLeft: '0.5rem' }}>
                            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                              <b>Base: </b><TokenDisplay address={pool.baseToken} />
                            </p>
                          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                              <b>Quote: </b><TokenDisplay address={pool.quoteToken} />
                            </p>
                            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                              <b>Market Maker: </b>
                              <a
                              href={`${NETWORK.explorerUrl}/address/${pool.marketMaker}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#333' }}
                            >
                              {formatAddress(pool.marketMaker)}
                              </a>
                            </p>
                          </div>
                          {pool.latestSwap && (
                            <div className='sub-container'>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Latest Swap: </b>
                                <span style={{ color: getStatusColor(getSwapStatus(pool.latestSwap)) }}>
                                  {getSwapStatus(pool.latestSwap)}
                                </span>
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Swapper: </b>
                                <a
                                  href={`${NETWORK.explorerUrl}/address/${pool.latestSwap.swapper}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#333' }}
                                >
                                  {formatAddress(pool.latestSwap.swapper)}
                                </a>
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Quote Amount: </b>{formatAmount(pool.latestSwap.quoteAmount, tokenInfoMap[pool.quoteToken]?.decimals)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Base Amount: </b>{formatAmount(pool.latestSwap.baseAmount, tokenInfoMap[pool.baseToken]?.decimals)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Max Quote Size: </b>{formatAmount(pool.latestSwap.maxQuoteSize, tokenInfoMap[pool.quoteToken]?.decimals)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Collateral: </b>{formatAmount(pool.latestSwap.collateral, tokenInfoMap[pool.baseToken]?.decimals)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Settlement Expiry: </b>{formatTimestamp(pool.latestSwap.expiry)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Set Price: </b>{formatAmount(pool.latestSwap.price)}
                              </p>
                            </div>
                          )}
                          <div className='sub-container'>
                            <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                              <b>Min Quote Size: </b>{formatAmount(pool.minQuoteSize, tokenInfoMap[pool.quoteToken]?.decimals)}
                            </p>
                            <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                              <b>Settlement Period: </b>{Number(pool.settlementPeriod) / 3600} hours
                            </p>
                            <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                              <b>Collateral Rate: </b>{formatAmount(pool.penaltyRate, 2)}%
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            {userRole === 'maker' ? (
                              <button
                                onClick={() => navigate(`/spread-order/make?pool=${pool.poolAddress}`)}
                                className='swap-button'
                              >
                                Make Quote
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/spread-order/take?pool=${pool.poolAddress}`)}
                                className='swap-button'
                              >
                                Take Swap
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'limitswap' && (
              <div>
                <h2 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Limit Pools</h2>
                {filteredLimitswapPools.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>No limit pools found</p>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredLimitswapPools.map((pool) => {
                      const userRole = getUserRole(pool);
                      return (
                        <div
                          key={pool.poolAddress}
                          style={{
                            padding: '1rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontWeight: 'bold' }}>
                              <a
                                href={`${NETWORK.explorerUrl}/address/${pool.poolAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#333' }}
                              >
                                {formatAddress(pool.poolAddress)}
                              </a>
                            </h3>
                            {userRole && (
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  backgroundColor: userRole === 'maker' ? '#dbeafe' : '#e0e7ff',
                                  color: userRole === 'maker' ? '#1e40af' : '#3730a3',
                                  fontSize: '0.875rem',
                                  fontWeight: 'medium',
                                }}
                              >
                                {userRole === 'maker' ? 'Maker' : 'Taker'}
                              </span>
                            )}
                          </div>
                          <div className='sub-container' style={{ border: 'none', background: 'none', padding: '0', paddingLeft: '0.5rem' }}>
                          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                            <b>Base: </b><TokenDisplay address={pool.baseToken} />
                          </p>
                          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                            <b>Quote: </b><TokenDisplay address={pool.quoteToken} />
                          </p>
                          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                            <b>Market Maker: </b>
                            <a
                              href={`${NETWORK.explorerUrl}/address/${pool.marketMaker}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#333' }}
                            >
                              {formatAddress(pool.marketMaker)}
                            </a>
                          </p>
                          </div>
                          {pool.latestSwap && (
                            <div className='sub-container'>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Latest Swap: </b>
                                <span style={{ color: getStatusColor(getSwapStatus(pool.latestSwap)) }}>
                                  {getSwapStatus(pool.latestSwap)}
                                </span>
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Swapper: </b>
                                <a
                                  href={`${NETWORK.explorerUrl}/address/${pool.latestSwap.swapper}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#333' }}
                                >
                                  {formatAddress(pool.latestSwap.swapper)}
                                </a>
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Quote Amount: </b>{formatAmount(pool.latestSwap.quoteAmount, tokenInfoMap[pool.quoteToken]?.decimals)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Base Amount: </b>{formatAmount(pool.latestSwap.baseAmount, tokenInfoMap[pool.baseToken]?.decimals)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Min Quote Amount: </b>{formatAmount(pool.latestSwap.minQuoteAmount)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Collateral: </b>{formatAmount(pool.latestSwap.collateral, tokenInfoMap[pool.collateralIsBase ? pool.baseToken : pool.quoteToken]?.decimals)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Order Expiry: </b>{formatTimestamp(pool.latestSwap.orderExpiry)}
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Settle Expiry: </b>{pool.latestSwap.taken ? formatTimestamp(pool.latestSwap.settleExpiry) : Number(pool.latestSwap.settleExpiry) / 3600 + " hours"} 
                              </p>
                              <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                                <b>Collateral Rate: </b>{formatAmount(pool.latestSwap.collateralRate, 2)}%
                              </p>
                            </div>
                          )}
                          <div className='sub-container'>
                            <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                              <b>Collateral Token: </b>{pool.collateralIsBase ? 'Base Token' : 'Quote Token'}
                            </p>
                            <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                              <b>Collateral Rate Limit: </b>{formatAmount(pool.collateralRateLimit, 2)}%
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            {userRole === 'maker' ? (
                              <button
                                onClick={() => navigate(`/limit-order/make?pool=${pool.poolAddress}`)}
                                className='swap-button'
                              >
                                Make Quote
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/limit-order/take?pool=${pool.poolAddress}`)}
                                className='swap-button'
                              >
                                Take Swap
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    </TokenInfoProvider>
  );
};

export default AllPoolsPage; 
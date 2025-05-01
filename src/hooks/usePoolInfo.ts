import { useReadContract } from 'wagmi';
import { helperAbi } from '../config/abi';
import { factoryAddress, factoryLimitOrder, NETWORK, poolInfoHelper } from '../config/constants';
import { useTokenInfo, TokenInfo } from './useTokenInfo';
import { useEffect, useState } from 'react';

// Types for pool information
export interface DeferswapPoolInfo {
  factoryAddress: string;
  poolAddress: string;
  baseToken: string;
  quoteToken: string;
  marketMaker: string;
  latestSwapId: string;
  latestSwap: {
    swapper: string;
    quoteAmount: string;
    baseAmount: string;
    maxQuoteSize: string;
    collateral: string;
    expiry: string;
    price: string;
    taken: boolean;
    settled: boolean;
    claimed: boolean;
    cancelled: boolean;
    spreads: string[];
    sizeTiers: string[];
  };
  minQuoteSize: string;
  settlementPeriod: string;
  penaltyRate: string;
  baseTokenInfo?: TokenInfo;
  quoteTokenInfo?: TokenInfo;
}

export interface LimitswapPoolInfo {
  factoryAddress: string;
  poolAddress: string;
  baseToken: string;
  quoteToken: string;
  marketMaker: string;
  latestSwapId: string;
  latestSwap: {
    swapper: string;
    quoteAmount: string;
    baseAmount: string;
    minQuoteAmount: string;
    collateral: string;
    orderExpiry: string;
    settleExpiry: string;
    collateralRate: string;
    taken: boolean;
    settled: boolean;
    claimed: boolean;
    cancelled: boolean;
  };
  collateralIsBase: boolean;
  collateralRateLimit: string;
  baseTokenInfo?: TokenInfo;
  quoteTokenInfo?: TokenInfo;
}

export const useDeferswapPoolInfo = (limit: number = 10, skip: number = 0) => {
  const { data, isLoading: isLoadingPools, error } = useReadContract({
    address: poolInfoHelper as `0x${string}`,
    abi: helperAbi,
    functionName: 'getAllDeferswapPoolInfo',
    args: [factoryAddress, limit, skip],
    chainId: NETWORK.chain.id,
  });

  const pools = data as DeferswapPoolInfo[] | undefined;
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
  const [tokenInfoMap, setTokenInfoMap] = useState<Record<string, TokenInfo>>({});
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  useEffect(() => {
    if (pools) {
      const addresses = new Set<string>();
      pools.forEach(pool => {
        addresses.add(pool.baseToken);
        addresses.add(pool.quoteToken);
      });
      setTokenAddresses(Array.from(addresses));
    }
  }, [pools]);

  // Fetch token info for each address
  const baseTokenInfo = useTokenInfo(tokenAddresses[0] || '');
  const quoteTokenInfo = useTokenInfo(tokenAddresses[1] || '');

  useEffect(() => {
    const newTokenInfoMap: Record<string, TokenInfo> = {};
    let anyLoading = false;

    if (tokenAddresses[0] && baseTokenInfo.tokenInfo) {
      newTokenInfoMap[tokenAddresses[0]] = baseTokenInfo.tokenInfo;
    }
    if (tokenAddresses[1] && quoteTokenInfo.tokenInfo) {
      newTokenInfoMap[tokenAddresses[1]] = quoteTokenInfo.tokenInfo;
    }

    if (baseTokenInfo.isLoading || quoteTokenInfo.isLoading) {
      anyLoading = true;
    }

    setTokenInfoMap(newTokenInfoMap);
    setIsLoadingTokens(anyLoading);
  }, [baseTokenInfo, quoteTokenInfo, tokenAddresses]);

  const poolsWithTokenInfo = pools?.map(pool => ({
    ...pool,
    baseTokenInfo: tokenInfoMap[pool.baseToken],
    quoteTokenInfo: tokenInfoMap[pool.quoteToken],
  }));

  return {
    pools: poolsWithTokenInfo,
    isLoading: isLoadingPools || isLoadingTokens,
    error,
  };
};

export const useLimitswapPoolInfo = (limit: number = 10, skip: number = 0) => {
  const { data, isLoading: isLoadingPools, error } = useReadContract({
    address: poolInfoHelper as `0x${string}`,
    abi: helperAbi,
    functionName: 'getAllLimitswapPoolInfo',
    args: [factoryLimitOrder, limit, skip],
    chainId: NETWORK.chain.id,
  });

  const pools = data as LimitswapPoolInfo[] | undefined;
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
  const [tokenInfoMap, setTokenInfoMap] = useState<Record<string, TokenInfo>>({});
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  useEffect(() => {
    if (pools) {
      const addresses = new Set<string>();
      pools.forEach(pool => {
        addresses.add(pool.baseToken);
        addresses.add(pool.quoteToken);
      });
      setTokenAddresses(Array.from(addresses));
    }
  }, [pools]);

  // Fetch token info for each address
  const baseTokenInfo = useTokenInfo(tokenAddresses[0] || '');
  const quoteTokenInfo = useTokenInfo(tokenAddresses[1] || '');

  useEffect(() => {
    const newTokenInfoMap: Record<string, TokenInfo> = {};
    let anyLoading = false;

    if (tokenAddresses[0] && baseTokenInfo.tokenInfo) {
      newTokenInfoMap[tokenAddresses[0]] = baseTokenInfo.tokenInfo;
    }
    if (tokenAddresses[1] && quoteTokenInfo.tokenInfo) {
      newTokenInfoMap[tokenAddresses[1]] = quoteTokenInfo.tokenInfo;
    }

    if (baseTokenInfo.isLoading || quoteTokenInfo.isLoading) {
      anyLoading = true;
    }

    setTokenInfoMap(newTokenInfoMap);
    setIsLoadingTokens(anyLoading);
  }, [baseTokenInfo, quoteTokenInfo, tokenAddresses]);

  const poolsWithTokenInfo = pools?.map(pool => ({
    ...pool,
    baseTokenInfo: tokenInfoMap[pool.baseToken],
    quoteTokenInfo: tokenInfoMap[pool.quoteToken],
  }));

  return {
    pools: poolsWithTokenInfo,
    isLoading: isLoadingPools || isLoadingTokens,
    error,
  };
}; 
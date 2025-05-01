import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { NETWORK } from '../config/constants';

export interface TokenInfo {
  symbol: string;
  decimals: number;
  name: string;
}

export const useTokenInfo = (address: string) => {
  const { data: symbol, isLoading: isLoadingSymbol } = useReadContract({
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
    chainId: NETWORK.chain.id,
  });

  const { data: decimals, isLoading: isLoadingDecimals } = useReadContract({
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: NETWORK.chain.id,
  });

  const { data: name, isLoading: isLoadingName } = useReadContract({
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'name',
    chainId: NETWORK.chain.id,
  });

  const isLoading = isLoadingSymbol || isLoadingDecimals || isLoadingName;
  const tokenInfo = isLoading ? undefined : {
    symbol: symbol as string || '',
    decimals: decimals as number || 18,
    name: name as string || '',
  };

  return { tokenInfo, isLoading };
}; 
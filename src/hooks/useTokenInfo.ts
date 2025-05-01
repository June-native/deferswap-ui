import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { NETWORK } from '../config/constants';

export interface TokenInfo {
  symbol: string;
  decimals: number;
  name: string;
}

export const useTokenInfo = (addresses: string[]) => {
  const { data: symbols, isLoading: isLoadingSymbols } = useReadContract({
    address: addresses[0] as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
    chainId: NETWORK.chain.id,
  });

  const { data: decimals, isLoading: isLoadingDecimals } = useReadContract({
    address: addresses[0] as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: NETWORK.chain.id,
  });

  const { data: names, isLoading: isLoadingNames } = useReadContract({
    address: addresses[0] as `0x${string}`,
    abi: erc20Abi,
    functionName: 'name',
    chainId: NETWORK.chain.id,
  });

  const isLoading = isLoadingSymbols || isLoadingDecimals || isLoadingNames;

  if (isLoading) {
    return { tokenInfo: undefined, isLoading: true };
  }

  const tokenInfo: Record<string, TokenInfo> = {};
  addresses.forEach((address, index) => {
    tokenInfo[address] = {
      symbol: symbols as string,
      decimals: decimals as number,
      name: names as string,
    };
  });

  return { tokenInfo, isLoading: false };
}; 
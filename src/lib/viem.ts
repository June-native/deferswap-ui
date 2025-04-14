import { createPublicClient, http } from 'viem';
import { mainnet, bsc as chain } from 'wagmi/chains';

export const publicClient = createPublicClient({
  chain: chain,
  transport: http()
});

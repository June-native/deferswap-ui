import { createPublicClient, http } from 'viem';
import { bsc as chain } from 'wagmi/chains';

export const publicClient = createPublicClient({
  chain: chain,
  transport: http()
});

import { createPublicClient, http } from 'viem';
import { mainnet, arbitrumSepolia } from 'wagmi/chains';

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http()
});

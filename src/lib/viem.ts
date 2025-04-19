import { createPublicClient, http, fallback } from 'viem';
import { NETWORK } from '../config/constants';

export const publicClient = createPublicClient({
  chain: NETWORK.chain,
  transport: fallback(NETWORK.rpcUrls.map(url => http(url))),
});

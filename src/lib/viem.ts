import { createPublicClient, http, fallback } from 'viem';
import { bsc as chain } from 'wagmi/chains';

export const publicClient = createPublicClient({
  chain: chain,
  transport: fallback([
    http('https://binance.llamarpc.com'),
    http('https://bsc-dataseed1.binance.org'),
    http('https://bsc-dataseed2.binance.org'),
    http('https://bsc-dataseed3.binance.org'),
    http('https://bsc-dataseed4.binance.org')
  ]),
});

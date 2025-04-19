import { bsc, mainnet } from 'wagmi/chains';

export const POOLS = [
  { label: 'DODO/USDC Halo', address: '0xB6DaAaa477aCEAC7E45d42420c752AFF3013D058' },
  { label: 'DODO/USDC June Test New', address: '0x0863E0f715b16fe3E56DBcD7F7c0d4C68973e427' },
  { label: 'DODO/USDC June Test', address: '0x68a84d670d525079016c3754cba0A2975987E9Ca' },
];

export const factoryAddress = '0xF1d727C658fE68B103373d64bA8AdDE83bf24768';

// Network Configuration
export const NETWORK = {
  chain: bsc,
  name: 'BSC',
  rpcUrls: [
    'https://binance.llamarpc.com',
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org'
  ],
  explorerUrl: 'https://bscscan.com'
};
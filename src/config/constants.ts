import { bsc, mainnet } from 'wagmi/chains';

// pool configs
export const SKIP_FIRST_X_POOLS = 3; // Skip the first X pools when fetching from factory
export const POOLS = [
  { label: 'June Test - Reverse Pool', address: '0x2576cd8a53411c5dbB5B5Df4390A3b318Cca2323' },
  // { label: 'DODO/USDC Halo', address: '0xB6DaAaa477aCEAC7E45d42420c752AFF3013D058' },
  // { label: 'DODO/USDC June Test New', address: '0x0863E0f715b16fe3E56DBcD7F7c0d4C68973e427' },
  // { label: 'DODO/USDC June Test', address: '0x68a84d670d525079016c3754cba0A2975987E9Ca' },
];

// factory configs
export const factoryAddress = '0x46569bd4cd7D8C7920c87B62176E26B7a2c64907';
export const DEFAULT_POOL_CONFIG = {
  minQuoteSize: 0,
  settlementPeriod: 60 * 60 * 24 * 1, // 1 days
  penaltyRate: 500, // 5%
}
export const PAIRS = {
  bsc: [
    {
      flipOraclePrice: false,
      label: 'Bsc - quote:DODO base:USDC',
      baseToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
      quoteToken: '0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2', // DODO
      priceFeed: '0x87701B15C08687341c2a847ca44eCfBc8d7873E1', // chainlink
    },
    {
      flipOraclePrice: true, 
      label: 'Bsc - quote:USDC base:DODO',
      baseToken: '0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2', // DODO
      quoteToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
      priceFeed: '0x87701B15C08687341c2a847ca44eCfBc8d7873E1', // chainlink
    }
  ]
}

// network configs
export const NETWORK = {
  chain: bsc,
  name: 'BSC',
  rpcUrls: [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
    'https://binance.llamarpc.com',
  ],
  explorerUrl: 'https://bscscan.com'
};




import { bsc, mainnet } from 'wagmi/chains';

// predefined pool configs
export const POOLS = [
  { label: 'June Test - DODO/USDC', address: '0xe840f917D573a3E2d3202c21A3f9c282F84f67BF' },
  { label: 'June Test - USDC/DODO (reversed)', address: '0x15704f816F369C0f94274c7B3613eb8ACfe66e78' },
  // { label: 'June Test - Reverse Pool', address: '0x2576cd8a53411c5dbB5B5Df4390A3b318Cca2323' },
  // { label: 'DODO/USDC Halo', address: '0xB6DaAaa477aCEAC7E45d42420c752AFF3013D058' },
  // { label: 'DODO/USDC June Test New', address: '0x0863E0f715b16fe3E56DBcD7F7c0d4C68973e427' },
  // { label: 'DODO/USDC June Test', address: '0x68a84d670d525079016c3754cba0A2975987E9Ca' },
];

export const LIMIT_ORDER_POOLS = [
  { label: 'June Test - USDC/DODO', address: '0x08323526d17F73af8DA57386C7E154433F6400CD' },
  { label: 'June Test - CAKE/USDT', address: '0x993796C408ae8E415a3297c394372880C035f46D' },
]

// factory configs
export const factoryAddress = '0xa2087A11C04Bd577571278E5397083082e8E3Da2';
export const factoryLimitOrder = '0xC766C053E7d47aa9139FA75C161a511593086b94';
export const SKIP_FIRST_X_POOLS = 2; // Skip the first X pools when fetching from factory
export const SKIP_FIRST_X_LIMIT_ORDER_POOLS = 2; // Skip the first X pools when fetching from factory
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

export const LIMIT_ORDER_PAIRS = {
  bsc: [
    {
      label: 'Bsc - quote/buy:DODO base/sell:USDC',
      baseToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
      quoteToken: '0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2', // DODO 
      collateralIsBase: true,
      collateralRateLimit: 5000,
    },
    {
      label: 'Bsc - quote/buy:USDC base/sell:DODO',
      baseToken: '0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2', // DODO
      quoteToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
      collateralIsBase: false,
      collateralRateLimit: 5000,
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

export const APP_TITLE = {
  BASE: '🐳 🔸 PatienceSwap',
  LIMIT_ORDER: '🐳 🔸 PatienceSwap - Limit Order',
  SPREAD_ORDER: '🐳 🔸 PatienceSwap - Spread Order',
};




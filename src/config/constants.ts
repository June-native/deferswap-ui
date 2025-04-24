import { mainnet } from 'wagmi/chains';

// predefined pool configs
export const POOLS = [

];

// factory configs
export const factoryAddress = '0xd9cc6421b44cd0b0a6cc8a61fa2aff0ea2cef0a7';
export const SKIP_FIRST_X_POOLS = 3; // Skip the first X pools when fetching from factory
export const DEFAULT_POOL_CONFIG = {
  minQuoteSize: 0,
  settlementPeriod: 60 * 60 * 24 * 1, // 1 days
  penaltyRate: 500, // 5%
}
export const PAIRS = {
  ethereum: [
    {
      flipOraclePrice: false,
      label: 'ETH - quote:FHE base:USDT',
      baseToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      quoteToken: '0xd55C9fB62E176a8Eb6968f32958FeFDD0962727E', // FHE
      priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // mock ETH/USD Chainlink
    },
    {
      flipOraclePrice: true,
      label: 'ETH - quote:USDT base:FHE',
      baseToken: '0xd55C9fB62E176a8Eb6968f32958FeFDD0962727E', // FHE
      quoteToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // mock ETH/USD Chainlink
    },
    {
      flipOraclePrice: false,
      label: 'ETH - quote:WETH base:USDC',
      baseToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      quoteToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD Chainlink
    },
    {
      flipOraclePrice: true, 
      label: 'ETH - quote:USDC base:WETH',
      baseToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      quoteToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      priceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD Chainlink
    },
  ]
}

// network configs
export const NETWORK = {
  chain: mainnet,
  name: 'Ethereum',
  rpcUrls: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://eth-mainnet.public.blastapi.io',
    'https://ethereum.publicnode.com',
    'https://1rpc.io/eth',
  ],
  explorerUrl: 'https://etherscan.io'
};




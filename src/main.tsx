import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';

import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { metaMask, walletConnect, coinbaseWallet } from '@wagmi/connectors';

const config = createConfig({
  chains: [bsc],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // You'll need to get this from https://cloud.walletconnect.com/
    }),
    coinbaseWallet({
      appName: 'DeferSwap',
    }),
  ],
  transports: {
    [bsc.id]: fallback([
      http('https://binance.llamarpc.com'),
      http('https://bsc-dataseed1.binance.org'),
      http('https://bsc-dataseed2.binance.org'),
      http('https://bsc-dataseed3.binance.org'),
      http('https://bsc-dataseed4.binance.org')
    ]),
  },
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

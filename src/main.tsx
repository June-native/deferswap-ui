import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';

import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { metaMask, walletConnect, coinbaseWallet } from '@wagmi/connectors';
import { NETWORK } from './config/constants';

const config = createConfig({
  chains: [NETWORK.chain],
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
    [NETWORK.chain.id]: fallback(NETWORK.rpcUrls.map(url => http(url))),
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

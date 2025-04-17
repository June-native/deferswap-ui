import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { WagmiProvider, createConfig, http, fallback } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = createConfig({
  chains: [bsc],
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

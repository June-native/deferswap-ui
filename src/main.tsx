import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { WagmiConfig, createConfig, http } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://binance.llamarpc.com'),
  },
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <App />
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);

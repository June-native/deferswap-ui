import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';

const WalletConnectButton = () => {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}>
      {isConnected ? (
        <>
          <span style={{ fontSize: '0.875rem' }}>
            Connected with <b>{connector?.name}</b>: {formatAddress(address || '')}
          </span>
          <button className="swap-button" id='wallet_connect' onClick={() => disconnect()} style={{ padding: '0.5rem 1rem' }}>
            Disconnect
          </button>
        </>
      ) : (
        <div style={{ position: 'relative' }}>
          <button 
            className="swap-button" 
            id='wallet_connect' 
            onClick={() => setShowDropdown(!showDropdown)} 
            style={{ padding: '0.5rem 1rem' }}
          >
            Connect Wallet
          </button>
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '0.5rem',
              marginTop: '0.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 1000
            }}>
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowDropdown(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {connector.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnectButton;

import { useAccount, useConnect, useDisconnect } from 'wagmi';

const WalletConnectButton = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      {isConnected ? (
        <>
          <span style={{ fontSize: '0.875rem' }}>Connected: <b>{address}</b></span>
          <button  className="swap-button" id='wallet_connect' onClick={() => disconnect()} style={{ padding: '0.5rem 1rem' }}>
            Disconnect
          </button>
        </>
      ) : (
        <button className="swap-button" id='wallet_connect' onClick={() => connect({ connector: connectors[0] })} style={{ padding: '0.5rem 1rem' }}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnectButton;

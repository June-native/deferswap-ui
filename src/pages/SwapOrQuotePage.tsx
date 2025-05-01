import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_TITLE, NETWORK } from '../config/constants';
import WalletConnectButton from '../components/WalletConnectButton';

const SwapOrQuotePage = () => {
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<'swap' | 'quote' | null>(null);
  const [selectedType, setSelectedType] = useState<'spread' | 'limit' | null>(null);

  const handleActionSelect = (action: 'swap' | 'quote') => {
    setSelectedAction(action);
    setSelectedType(null);
  };

  const handleTypeSelect = (type: 'spread' | 'limit') => {
    setSelectedType(type);
    if (selectedAction === 'swap') {
      // For swap/take, navigate to all pools with appropriate tab and open orders filter
      navigate(`/all-pools?tab=${type === 'spread' ? 'deferswap' : 'limitswap'}&openOrders=true`);
    } else {
      // For quote/make, navigate to appropriate deploy page
      navigate(type === 'spread' ? '/spread-order/deploy' : '/limit-order/deploy');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 
        style={{ 
          fontWeight: 'bold', 
          marginBottom: '1rem', 
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/')}
      >
        {APP_TITLE.BASE}
      </h1>
      <WalletConnectButton />
      
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>What would you like to do?</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => handleActionSelect('swap')}
            className='swap-button'
            style={{
              padding: '1rem 2rem',
              borderRadius: '0.375rem',
              backgroundColor: selectedAction === 'swap' ? '#333' : '#eee',
              color: selectedAction === 'swap' ? 'white' : '#333',
              fontWeight: 'bold',
              flex: 1,
            }}
          >
            Swap/Take
          </button>
          <button
            onClick={() => handleActionSelect('quote')}
            className='swap-button'
            style={{
              padding: '1rem 2rem',
              borderRadius: '0.375rem',
              backgroundColor: selectedAction === 'quote' ? '#333' : '#eee',
              color: selectedAction === 'quote' ? 'white' : '#333',
              fontWeight: 'bold',
              flex: 1,
            }}
          >
            Quote/Make
          </button>
        </div>

        {selectedAction && (
          <div>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
              Choose order type:
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => handleTypeSelect('spread')}
                className='swap-button'
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '0.375rem',
                  backgroundColor: selectedType === 'spread' ? '#333' : '#eee',
                  color: selectedType === 'spread' ? 'white' : '#333',
                  fontWeight: 'bold',
                  flex: 1,
                }}
              >
                Spread Orders
              </button>
              <button
                onClick={() => handleTypeSelect('limit')}
                className='swap-button'
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '0.375rem',
                  backgroundColor: selectedType === 'limit' ? '#333' : '#eee',
                  color: selectedType === 'limit' ? 'white' : '#333',
                  fontWeight: 'bold',
                  flex: 1,
                }}
              >
                Limit Orders
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/all-pools')}
          className='swap-button'
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            backgroundColor: '#333',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          Check all Pools
        </button>
      </div>
    </div>
  );
};

export default SwapOrQuotePage; 
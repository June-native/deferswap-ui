import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { publicClient } from '../lib/viem';
import { poolAbiLimit as poolAbi } from '../config/abi';
import { NETWORK } from '../config/constants';

interface MakeQuoteProps {
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
  onQuoteSuccess: () => void;
}

const MakeQuoteLimit = ({
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
  onQuoteSuccess,
}: MakeQuoteProps) => {
  const { address } = useAccount();
  const [quoteAmount, setQuoteAmount] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [minQuoteAmount, setMinQuoteAmount] = useState('');
  const [orderExpiry, setOrderExpiry] = useState('');
  const [settleExpiry, setSettleExpiry] = useState('');
  const [collateralRate, setCollateralRate] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const [requiredBaseAmount, setRequiredBaseAmount] = useState<bigint>(0n);
  const [hasAllowance, setHasAllowance] = useState(false);
  const [swapId, setSwapId] = useState('');
  const [priceDirection, setPriceDirection] = useState<'base' | 'quote'>('base');
  const [price, setPrice] = useState<string>('');
  const [debugSwap, setDebugSwap] = useState(null);

  // Get token addresses and pool parameters
  const { data: baseToken } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'baseToken',
  });

  const { data: quoteToken } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'quoteToken',
  });

  const { data: collateralIsBase } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'collateralIsBase',
  });

  const { data: collateralRateLimit } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'collateralRateLimit',
  });

  const { data: marketMaker } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'marketMaker',
  });

  const { data: swapCounter } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swapCounter',
  });

  const { data: swap } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swaps',
    args: [swapId ? BigInt(swapId) : 0n],
  });

  // Get base token balance and allowance
  const { data: balance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, poolAddress as `0x${string}`],
  });

  // Add isMarketMaker check
  const isMarketMaker = address && marketMaker && address.toLowerCase() === (marketMaker as string).toLowerCase();

  // Calculate required base amount (baseAmount + collateral if collateralIsBase)
  useEffect(() => {
    if (baseAmount) {
      setRequiredBaseAmount(parseUnits(baseAmount, baseTokenMeta.decimals));
    }
  }, [baseAmount, collateralRate, collateralIsBase, baseTokenMeta.decimals]);

  // Check allowance
  useEffect(() => {
    if (allowance && requiredBaseAmount) {
      setHasAllowance(BigInt(allowance) >= requiredBaseAmount);
    }
  }, [allowance, requiredBaseAmount]);

  // Calculate price when base or quote amount changes
  useEffect(() => {
    if (baseAmount && quoteAmount) {
      const baseNum = parseFloat(baseAmount);
      const quoteNum = parseFloat(quoteAmount);
      if (baseNum > 0 && quoteNum > 0) {
        if (priceDirection === 'base') {
          setPrice((baseNum / quoteNum).toFixed(6));
        } else {
          setPrice((quoteNum / baseNum).toFixed(6));
        }
      } else {
        setPrice('');
      }
    } else {
      setPrice('');
    }
  }, [baseAmount, quoteAmount, priceDirection]);

  useEffect(() => {
    console.log('Debug values:', {
      swapId,
      isMarketMaker,
      sendingTx,
      swapCounter: swapCounter && BigInt(swapId) >= BigInt(swapCounter.toString()),
      swapStatus: swap && swap[7]
    });
  }, [swapId, isMarketMaker, sendingTx, swapCounter, swap]);

  // Validate inputs
  const validateInputs = () => {
    const warnings = [];

    if (!address) {
      warnings.push('Please connect your wallet');
    }

    if (balance && requiredBaseAmount && BigInt(balance) < requiredBaseAmount) {
      warnings.push('Insufficient balance for required base amount');
    }

    if (orderExpiry && Number(orderExpiry) < 1) {
      console.log(orderExpiry);
      warnings.push('Order expiry must be at least 1 hour');
    }

    if (settleExpiry && Number(settleExpiry) < 1) {
      warnings.push('Settle expiry must be at least 1 hour');
    }

    if (collateralRate && collateralRateLimit) {
      const collateralRateBigInt = parseUnits(collateralRate, 2);
      console.log(collateralRateBigInt, collateralRateLimit);
      if (collateralRateBigInt > BigInt(collateralRateLimit.toString())) {
        warnings.push('Collateral rate exceeds pool limit');
      }
    }

    if (minQuoteAmount && quoteAmount) {
      const minQuoteAmountBigInt = parseUnits(minQuoteAmount, quoteTokenMeta.decimals);
      const quoteAmountBigInt = parseUnits(quoteAmount, quoteTokenMeta.decimals);
      console.log(minQuoteAmountBigInt, quoteAmountBigInt);
      if (minQuoteAmountBigInt > quoteAmountBigInt) {
        warnings.push('Min quote amount cannot exceed quote amount');
      }
    }

    if (!quoteAmount || !baseAmount || !minQuoteAmount || !orderExpiry || !settleExpiry || !collateralRate) {
      warnings.push('Please fill in all fields');
    }

    return warnings;
  };

  const warnings = validateInputs();
  const isFormValid = warnings.length === 0;

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeMakeQuote } = useWriteContract();
  const { writeContractAsync: writeCancelSwap } = useWriteContract();

  const handleApprove = async () => {
    try {
      setSendingTx(true);
      const hash = await writeApprove({
        address: baseToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [poolAddress as `0x${string}`, requiredBaseAmount],
        account: address,
        chain: NETWORK.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchAllowance();
    } catch (err) {
      console.error('Approve transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleMakeQuote = async () => {
    try {
      setSendingTx(true);
      const quoteAmountBigInt = parseUnits(quoteAmount, quoteTokenMeta.decimals);
      const baseAmountBigInt = parseUnits(baseAmount, baseTokenMeta.decimals);
      const minQuoteAmountBigInt = parseUnits(minQuoteAmount, quoteTokenMeta.decimals);
      const orderExpiryBigInt = BigInt(Math.floor(Date.now() / 1000) + parseInt(orderExpiry) * 3600);
      const settleExpiryBigInt = parseInt(settleExpiry) * 3600;
      const collateralRateBigInt = parseUnits(collateralRate, 2);

      // Validate inputs
      if (collateralRateBigInt > BigInt(collateralRateLimit?.toString() || '0')) {
        throw new Error('Collateral rate exceeds limit');
      }
      if (minQuoteAmountBigInt > quoteAmountBigInt) {
        throw new Error('Min quote amount cannot exceed quote amount');
      }
      if (orderExpiryBigInt <= BigInt(Math.floor(Date.now() / 1000))) {
        throw new Error('Order expiry must be in the future');
      }
      if (settleExpiryBigInt <= 0n) {
        throw new Error('Settle expiry must be positive');
      }

      const hash = await writeMakeQuote({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'makeQuote',
        args: [
          quoteAmountBigInt,
          baseAmountBigInt,
          minQuoteAmountBigInt,
          orderExpiryBigInt,
          settleExpiryBigInt,
          collateralRateBigInt,
        ],
        account: address,
        chain: NETWORK.chain,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      onQuoteSuccess();
    } catch (err) {
      console.error('Make quote transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleCancelSwap = async () => {
    try {
      setSendingTx(true);
      const hash = await writeCancelSwap({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'cancelQuote',
        args: [BigInt(swapId)],
        account: address,
        chain: NETWORK.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      onQuoteSuccess();
    } catch (err) {
      console.error('Cancel swap transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  return (
    <div className="main-container">
      <h2 className="main-title">Manage Orders</h2>
      
      {!isMarketMaker ? (
        <div className="warning-message">
          Connect to Maker wallet {marketMaker as string} to manage this pool
        </div>
      ) : (
        <>
          <div className="sub-container">
            <h3>Submit Order</h3>
            <div className='input-group-container'>
              <b>Quote Amount (Buying)</b>
              <input
                type="text"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="swap-input"
                placeholder={quoteTokenMeta.symbol}
              />
            </div>

            <div className='input-group-container'>
              <b>Base Amount (Selling)</b>
              <input
                type="text"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                className="swap-input"
                placeholder={baseTokenMeta.symbol}
              />
              <p className='input-group-container-note'>Balance: {balance ? formatUnits(balance, baseTokenMeta.decimals) : 0} {baseTokenMeta.symbol}</p>

            </div>

            <div className='input-group-container'>
              <b>Min Quote Amount (Buying)</b>
              <input
                type="text"
                value={minQuoteAmount}
                onChange={(e) => setMinQuoteAmount(e.target.value)}
                className="swap-input"
                placeholder={quoteTokenMeta.symbol}
              />
              <p className='input-group-container-note'>Enter 0 for complete partial fill, enter quote amount for full fill.</p>

            </div>

            <div className='input-group-container'>
              <b>Order Expiry</b>
              <input
                type="number"
                value={orderExpiry}
                onChange={(e) => setOrderExpiry(e.target.value)}
                className="swap-input"
                placeholder="in hours"
              />
              <p className='input-group-container-note'>Order will be expired if no taker takes within this time after submission.</p>
            </div>

            <div className='input-group-container'>
              <b>Settle Expiry</b>
              <input
                type="number"
                value={settleExpiry}
                onChange={(e) => setSettleExpiry(e.target.value)}
                className="swap-input"
                placeholder="in hours"
              />
              <p className='input-group-container-note'>Order will be defaulted if taker can not pay within this time after taking.</p>
            </div>

            <div className='input-group-container'>
              <b>Collateral Rate</b>
              <input
                type="text"
                value={collateralRate}
                onChange={(e) => setCollateralRate(e.target.value)}
                className="swap-input"
                placeholder="%"
              />
              <p className='input-group-container-note'>% of the order amount as collateral. Taker will be charged for collateral if defaulted.</p>
            </div>

            <div className="wallet-info">
              <div><b>Collateral in: </b>{collateralIsBase ? baseTokenMeta.symbol : quoteTokenMeta.symbol}</div>
              <div><b>Required Base Amount: </b>{formatUnits(BigInt(requiredBaseAmount.toString()), baseTokenMeta.decimals)} {baseTokenMeta.symbol}</div>
              <div><b>Max Collateral Rate: </b>{formatUnits(BigInt(collateralRateLimit.toString()), 2)}%</div>
              <div className="flex items-center gap-2">
                <b>Limit Price: </b>
                <span>{price ? `${price} ${priceDirection === 'base' ? baseTokenMeta.symbol : quoteTokenMeta.symbol} per ${priceDirection === 'base' ? quoteTokenMeta.symbol : baseTokenMeta.symbol}` : '-'}</span>
                <button 
                  onClick={() => setPriceDirection(prev => prev === 'base' ? 'quote' : 'base')}
                  style={{border: 'none', background: 'none', padding: '0 5px', cursor: 'pointer'}}
                >
                  ↔️
                </button>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="warning-message">
                <b>Warnings:</b>
                {warnings.map((warning, index) => (
                  <div key={index} style={{ color: '#ff4444' }}>{warning}</div>
                ))}
              </div>
            )}

            {!hasAllowance ? (
              <button
                onClick={handleApprove}
                disabled={sendingTx || !isFormValid}
                className="button full-width-button"
              >
                {sendingTx ? 'Approving...' : 'Approve'}
              </button>
            ) : (
              <button
                onClick={handleMakeQuote}
                disabled={sendingTx || !isFormValid}
                className="button full-width-button"
              >
                {sendingTx ? 'Making Quote...' : 'Make Quote'}
              </button>
            )}
          </div>

          <div className="sub-container">
            <h3>Cancel Order</h3>
            <div style={{textAlign: 'center'}}>
              <b>ID:</b>
              <input
                type="number"
                value={swapId}
                onChange={(e) => setSwapId(e.target.value)}
                placeholder="Enter swap ID"
                min="0"
                className="swap-input"
                disabled={!isMarketMaker}
              />
              <button 
                onClick={handleCancelSwap} 
                disabled={!swapId || !isMarketMaker || sendingTx || (swapCounter && BigInt(swapId) >= BigInt(swapCounter.toString())) || (swap && swap[8])} 
                className="button" 
                style={{ backgroundColor: '#ff4444' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MakeQuoteLimit; 
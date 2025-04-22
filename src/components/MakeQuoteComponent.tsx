import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
// import { bsc as chain } from 'viem/chains';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { publicClient } from '../lib/viem';
import { poolAbi } from '../config/abi';
import { NETWORK } from '../config/constants';

const MakeQuoteComponent = ({
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
  onQuoteSuccess,
  onRefreshQuotes,
  marketMaker,
}: {
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
  onQuoteSuccess: () => void;
  onRefreshQuotes: () => void;
  marketMaker: string | null;
}) => {
  const { address } = useAccount();
  const [sizeTiers, setSizeTiers] = useState<string[]>(['']);
  const [spreads, setSpreads] = useState<string[]>(['']);
  const [penaltyRate, setPenaltyRate] = useState('');
  const [minQuoteSize, setMinQuoteSize] = useState('');
  const [settlementPeriod, setSettlementPeriod] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const [swapId, setSwapId] = useState('');
  const [oraclePrice, setOraclePrice] = useState<bigint>(0n);
  const [requiredBaseAmount, setRequiredBaseAmount] = useState<bigint>(0n);
  const [lastSwapStatus, setLastSwapStatus] = useState<string>('');
  const [canSubmitQuote, setCanSubmitQuote] = useState<boolean>(false);
  const [sizeTiersValid, setSizeTiersValid] = useState<boolean>(true);
  const { address: account } = useAccount();
  const chainId = useChainId();

  // Add state for current pool parameters
  const [currentPenaltyRate, setCurrentPenaltyRate] = useState<bigint>(0n);
  const [currentMinQuoteSize, setCurrentMinQuoteSize] = useState<bigint>(0n);
  const [currentSettlementPeriod, setCurrentSettlementPeriod] = useState<bigint>(0n);

  // Add state for settlement
  const [settlementBaseAmount, setSettlementBaseAmount] = useState<bigint>(0n);
  const [hasSettlementAllowance, setHasSettlementAllowance] = useState<boolean>(false);

  // Add isMarketMaker check
  const isMarketMaker = address && marketMaker && address.toLowerCase() === marketMaker.toLowerCase();

  const { data: baseToken } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'baseToken',
  });

  const { data: swapCounter, refetch: refetchSwapCounter } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swapCounter',
  });

  const { data: lastSwap } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swaps',
    args: [swapCounter ? (BigInt(String(swapCounter)) - 1n) : 0n],
  });

  const { data: oraclePriceData, error: oraclePriceError } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'getOraclePrice',
  });

  // Add contract calls for current parameters
  const { data: currentPenaltyRateData } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'penaltyRate',
  });

  const { data: currentMinQuoteSizeData } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'minQuoteSize',
  });

  const { data: currentSettlementPeriodData } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'settlementPeriod',
  });

  // Add contract calls for settlement
  const { data: settlementAllowance, refetch: refetchSettlementAllowance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, poolAddress as `0x${string}`],
  });

  useEffect(() => {
    if (oraclePriceError) {
      console.error('Error fetching oracle price:', oraclePriceError);
      return;
    }
    if (oraclePriceData) {
      console.log('Oracle price data:', oraclePriceData);
      try {
        const price = BigInt(String(oraclePriceData));
        console.log('Parsed oracle price:', price);
        setOraclePrice(price);
      } catch (err) {
        console.error('Error parsing oracle price:', err);
      }
    }
  }, [oraclePriceData, oraclePriceError]);

  useEffect(() => {
    // Check if size tiers are in ascending order
    const isValid = sizeTiers.every((tier, index) => {
      if (index === 0) return true;
      const current = parseFloat(tier || '0');
      const previous = parseFloat(sizeTiers[index - 1] || '0');
      return current > previous;
    });
    setSizeTiersValid(isValid);
  }, [sizeTiers]);

  const updateSwapStatus = (swap: any) => {
    const [taken, settled, claimed, cancelled] = [swap[7], swap[8], swap[9], swap[10]];
    
    // Determine status based on boolean flags
    let status = 'pending';
    if (cancelled) status = 'cancelled';
    else if (claimed) status = 'claimed';
    else if (settled) status = 'settled';
    else if (taken) status = 'taken';
    
    setLastSwapStatus(status);
    setCanSubmitQuote(cancelled || settled || claimed);
  };

  useEffect(() => {
    if (lastSwap) {
      updateSwapStatus(lastSwap);
    }
  }, [lastSwap, sizeTiersValid]);

  const updateLastSwapStatus = async () => {
    // Refresh last swap data
    const lastSwap = await publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: poolAbi,
      functionName: 'swaps',
      args: [swapCounter ? (BigInt(String(swapCounter)) - 1n) : 0n],
    });
    
    updateSwapStatus(lastSwap);
  };

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

  const { data: penaltyRateData } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'penaltyRate',
  });

  useEffect(() => {
    if (sizeTiers.length > 0 && oraclePrice && penaltyRateData) {
      const lastSizeTier = parseUnits(sizeTiers[sizeTiers.length - 1] || '0', quoteTokenMeta.decimals);
      const required = (lastSizeTier * oraclePrice * BigInt(String(penaltyRateData))) / 10000n;
      const withBuffer = (required * 105n) / 100n; // Add 5% buffer
      const withBufferParsed = formatUnits(withBuffer, baseTokenMeta.decimals);
      setRequiredBaseAmount(BigInt(withBufferParsed));
    }
  }, [sizeTiers, oraclePrice, penaltyRateData, quoteTokenMeta.decimals]);

  const hasEnoughBalance = balance && BigInt(balance) >= requiredBaseAmount;
  const hasEnoughAllowance = allowance && requiredBaseAmount <= BigInt(allowance);

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeQuote } = useWriteContract();
  const { writeContractAsync: writeSetPenaltyRate } = useWriteContract();
  const { writeContractAsync: writeSetMinQuoteSize } = useWriteContract();
  const { writeContractAsync: writeSetSettlementPeriod } = useWriteContract();
  const { writeContractAsync: writeCancelSwap } = useWriteContract();
  const { writeContractAsync: writeSettleSwap } = useWriteContract();

  const handleApprove = async () => {
    try {
      setSendingTx(true);
      const hash = await writeApprove({
        address: baseToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [poolAddress as `0x${string}`, requiredBaseAmount],
        account,
        chain: NETWORK.chain,
      });
      console.log("Approved: ", hash);
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      // Recheck allowance
      await refetchAllowance();
    } catch (err) {
      console.error('Approve transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleQuote = async () => {
    try {
      setSendingTx(true);
      const sizeTiersParsed = sizeTiers.map(amount => 
        parseUnits(amount || '0', quoteTokenMeta.decimals));
      const spreadsParsed = spreads.map(amount => 
        BigInt(Math.floor(parseFloat(amount) * 100)));
      console.log(sizeTiersParsed, spreadsParsed);

      const hash = await writeQuote({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'quote',
        args: [spreadsParsed, sizeTiersParsed, 0n],
        account,
        chain: NETWORK.chain,
      });
      console.log("Quote submitted: ", hash);
      
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Update last swap status
      await updateLastSwapStatus();
      
      // Refresh swap counter
      await refetchSwapCounter();
      
      // Trigger refresh of quotes
      onRefreshQuotes?.();
      onQuoteSuccess?.();
    } catch (err) {
      console.error('Quote transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleSetPenaltyRate = async () => {
    try {
      setSendingTx(true);
      const rate = BigInt(Math.floor(parseFloat(penaltyRate) * 100));
      const hash = await writeSetPenaltyRate({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'setPenaltyRate',
        args: [rate],
        account,
        chain: NETWORK.chain,
      });
      console.log("Penalty rate set: ", hash);
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      // Refresh parameters
      setCurrentPenaltyRate(rate);
      // Clear input
      setPenaltyRate('');
    } catch (err) {
      console.error('Set penalty rate transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleSetMinQuoteSize = async () => {
    try {
      setSendingTx(true);
      const size = parseUnits(minQuoteSize || '0', quoteTokenMeta.decimals);
      const hash = await writeSetMinQuoteSize({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'setMinQuoteSize',
        args: [size],
        account,
        chain: NETWORK.chain,
      });
      console.log("Min quote size set: ", hash);
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      // Refresh parameters
      setCurrentMinQuoteSize(size);
      // Clear input
      setMinQuoteSize('');
    } catch (err) {
      console.error('Set min quote size transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleSetSettlementPeriod = async () => {
    try {
      setSendingTx(true);
      const period = BigInt(parseInt(settlementPeriod) * 3600); // Convert hours to seconds
      const hash = await writeSetSettlementPeriod({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'setSettlementPeriod',
        args: [period],
        account,
        chain: NETWORK.chain,
      });
      console.log("Settlement period set: ", hash);
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      // Refresh parameters
      setCurrentSettlementPeriod(period);
      // Clear input
      setSettlementPeriod('');
    } catch (err) {
      console.error('Set settlement period transaction failed:', err);
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
        functionName: 'cancelSwap',
        args: [BigInt(swapId)],
        account,
        chain: NETWORK.chain,
      });
      console.log("Swap cancelled: ", hash);
      
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Update last swap status
      await updateLastSwapStatus();
      
      // Trigger refresh of quotes
      onRefreshQuotes?.();
    } catch (err) {
      console.error('Cancel swap transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const addQuotePair = () => {
    if (sizeTiers.length < 10) {
      setSizeTiers([...sizeTiers, '']);
      setSpreads([...spreads, '']);
    }
  };

  const removeQuotePair = (index: number) => {
    if (sizeTiers.length > 1) {
      const newSizeTiers = [...sizeTiers];
      const newSpreads = [...spreads];
      newSizeTiers.splice(index, 1);
      newSpreads.splice(index, 1);
      setSizeTiers(newSizeTiers);
      setSpreads(newSpreads);
    }
  };

  const updateSizeTier = (index: number, value: string) => {
    const newSizeTiers = [...sizeTiers];
    newSizeTiers[index] = value;
    setSizeTiers(newSizeTiers);
  };

  const updateSpread = (index: number, value: string) => {
    const newSpreads = [...spreads];
    newSpreads[index] = value;
    setSpreads(newSpreads);
  };

  // Update current parameters when data changes
  useEffect(() => {
    if (currentPenaltyRateData) {
      setCurrentPenaltyRate(BigInt(String(currentPenaltyRateData)));
    }
  }, [currentPenaltyRateData]);

  useEffect(() => {
    if (currentMinQuoteSizeData) {
      setCurrentMinQuoteSize(BigInt(String(currentMinQuoteSizeData)));
    }
  }, [currentMinQuoteSizeData]);

  useEffect(() => {
    if (currentSettlementPeriodData) {
      setCurrentSettlementPeriod(BigInt(String(currentSettlementPeriodData)));
    }
  }, [currentSettlementPeriodData]);

  useEffect(() => {
    if (swapCounter) {
      setSwapId(String(BigInt(String(swapCounter)) - 1n));
    }
  }, [swapCounter]);

  // Update settlement state when last swap changes
  useEffect(() => {
    if (lastSwap) {
      setSettlementBaseAmount(lastSwap[2]); // baseAmount is at index 2
    }
  }, [lastSwap]);

  // Update allowance state
  useEffect(() => {
    if (settlementAllowance && settlementBaseAmount) {
      setHasSettlementAllowance(BigInt(settlementAllowance) >= settlementBaseAmount);
    }
  }, [settlementAllowance, settlementBaseAmount]);

  // Add handlers for settlement
  const handleSettlementApprove = async () => {
    try {
      setSendingTx(true);
      const hash = await writeApprove({
        address: baseToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [poolAddress as `0x${string}`, settlementBaseAmount],
        account,
        chain: NETWORK.chain,
      });
      console.log("Approved for settlement: ", hash);
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchSettlementAllowance();
    } catch (err) {
      console.error('Settlement approval failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleSettleSwap = async () => {
    try {
      setSendingTx(true);
      const hash = await writeSettleSwap({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'settleSwap',
        args: [BigInt(swapId)],
        account,
        chain: NETWORK.chain,
      });
      console.log("Swap settled: ", hash);
      await publicClient.waitForTransactionReceipt({ hash });
      await updateLastSwapStatus();
      onRefreshQuotes?.();
    } catch (err) {
      console.error('Settlement transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  return (
    <div className="main-container">
      {!isMarketMaker ? (
        <div className="warning-message">
          Connect to MM wallet {marketMaker} to manage this pool
        </div>
      ) : (
        <>
          <h2 className="main-title">Manage Pool</h2>
          
          <div className="sub-container">
            <h3>Submit Quotes</h3>
            <div className="tiers-container">
              {sizeTiers.map((_, index) => (
                <div key={index} className="tier-container">
                  <b>Size ({quoteTokenMeta.symbol}): </b>
                  <input
                    type="number"
                    value={sizeTiers[index]}
                    onChange={(e) => updateSizeTier(index, e.target.value)}
                    className="tier-input"
                    disabled={!isMarketMaker}
                  />
                  <b>Spread %: </b>
                  <input
                    type="number"
                    value={spreads[index]}
                    onChange={(e) => updateSpread(index, e.target.value)}
                    className="tier-input"
                    disabled={!isMarketMaker}
                  />
                  <button onClick={() => removeQuotePair(index)} className="button">
                    Remove
                  </button>
                </div>
              ))}
              <button onClick={addQuotePair} className="button" disabled={sizeTiers.length >= 10 || !isMarketMaker}>
                Add Tier
              </button>
            </div>
            <div className="wallet-info">
              <div><b>Oracle Price:</b> {oraclePrice ? formatUnits(oraclePrice, baseTokenMeta.decimals) : 'Loading...'} {baseTokenMeta.symbol} per {quoteTokenMeta.symbol}</div>
              <div><b>Required Collateral:</b> {formatUnits(requiredBaseAmount, baseTokenMeta.decimals)} {baseTokenMeta.symbol} (with 5% buffer)</div>
              <div><b>Wallet Balance:</b> {balance ? formatUnits(balance, baseTokenMeta.decimals) : 0} {baseTokenMeta.symbol}</div>
              <div><b>Last Swap Status:</b> {Number(swapCounter) > 0 ? lastSwapStatus : 'No Swaps Yet'}</div>
              <div><b>Warnings:</b></div>
              {!hasEnoughBalance && <div style={{ color: '#ff4444' }}>Insufficient balance for collateral</div>}
              {swapCounter != 0 && !canSubmitQuote && lastSwapStatus && <div style={{ color: '#ff4444' }}>Cannot submit quote until last swap is settled, claimed, or cancelled</div>}
              {!sizeTiersValid && <div style={{ color: '#ff4444' }}>Size tiers must be in ascending order</div>}
            </div>
            {!hasEnoughAllowance ? (
              <button onClick={handleApprove} disabled={!isMarketMaker || sendingTx || !hasEnoughBalance} className="button full-width-button">
                Approve {baseTokenMeta.symbol}
              </button>
            ) : (
              <button onClick={handleQuote} disabled={!isMarketMaker || sendingTx || !hasEnoughBalance || (!canSubmitQuote && swapCounter != 0) || !sizeTiersValid} className="button full-width-button">
                Submit Quotes
              </button>
            )}
          </div>
          <div className="sub-container">
            <h3>Cancel Quote</h3>
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
              <button onClick={handleCancelSwap} 
                disabled={!swapId || !swapCounter || !isMarketMaker || sendingTx || (swapCounter && BigInt(swapId) >= BigInt(String(swapCounter))) || lastSwapStatus === 'settled' || lastSwapStatus === 'taken' || lastSwapStatus === 'claimed' || lastSwapStatus === 'cancelled'} 
                className="button" 
                style={{ backgroundColor: '#ff4444' }}>
                Cancel
              </button>
            </div>
          </div>
          <div className="sub-container">
            <h3>Settle Quote</h3>
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
              {!hasSettlementAllowance ? (
                <button 
                  onClick={handleSettlementApprove} 
                  disabled={!isMarketMaker || sendingTx || !balance || BigInt(balance) < settlementBaseAmount || !lastSwap?.[7]}
                  className="button" 
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  Approve {baseTokenMeta.symbol}
                </button>
              ) : (
                <button 
                  onClick={handleSettleSwap} 
                  disabled={!isMarketMaker || sendingTx || !balance || BigInt(balance) < settlementBaseAmount || lastSwapStatus === 'settled' || lastSwapStatus === 'claimed' || !lastSwap?.[7]}
                  className="button" 
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  Settle
                </button>
              )}
              <div style={{ marginTop: '0.5rem', color: '#666' }}>
                Required: {formatUnits(settlementBaseAmount, baseTokenMeta.decimals)} {baseTokenMeta.symbol}
              </div>
            </div>
          </div>
          <div className="sub-container">
            <h3>Pool Parameters</h3>
            <div className="pool-params-container">
              <div className="pool-param-row">
                <span className="pool-param-label">Collateral Rate (%):</span>
                <input
                  type="number"
                  value={penaltyRate}
                  onChange={(e) => setPenaltyRate(e.target.value)}
                  placeholder={`${formatUnits(currentPenaltyRate, 2)}%`}
                  step="0.01"
                  min="0"
                  className="pool-param-input"
                  disabled={!isMarketMaker}
                />
                <button onClick={handleSetPenaltyRate} disabled={!isMarketMaker || sendingTx} className="button">
                  Set
                </button>
              </div>
              <div className="pool-param-row">
                <span className="pool-param-label">Min Quote Size ({quoteTokenMeta.symbol}):</span>
                <input
                  type="number"
                  value={minQuoteSize}
                  onChange={(e) => setMinQuoteSize(e.target.value)}
                  placeholder={`${formatUnits(currentMinQuoteSize, quoteTokenMeta.decimals)}`}
                  className="pool-param-input"
                  disabled={!isMarketMaker}
                />
                <button onClick={handleSetMinQuoteSize} disabled={!isMarketMaker || sendingTx} className="button">
                  Set
                </button>
              </div>
              <div className="pool-param-row">
                <span className="pool-param-label">Settlement Period (hours):</span>
                <input
                  type="number"
                  value={settlementPeriod}
                  onChange={(e) => setSettlementPeriod(e.target.value)}
                  placeholder={`${Number(formatUnits(currentSettlementPeriod, 0)) / 3600} hours`}
                  min="0"
                  className="pool-param-input"
                  disabled={!isMarketMaker}
                />
                <button onClick={handleSetSettlementPeriod} disabled={!isMarketMaker || sendingTx} className="button">
                  Set
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MakeQuoteComponent; 
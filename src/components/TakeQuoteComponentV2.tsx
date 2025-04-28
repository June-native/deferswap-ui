import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { poolAbiLimit as poolAbi } from '../config/abi';
import { publicClient } from '../lib/viem';
import { NETWORK } from '../config/constants';

interface TakeQuoteComponentV2Props {
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
  onQuoteSuccess: () => void;
}

const TakeQuoteComponentV2 = ({
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
  onQuoteSuccess,
}: TakeQuoteComponentV2Props) => {
  const { address } = useAccount();
  const [swapId, setSwapId] = useState('');
  const [amount, setAmount] = useState('');
  const [sendingTx, setSendingTx] = useState(false);
  const [requiredCollateralAmount, setRequiredCollateralAmount] = useState<bigint>(0n);
  const [requiredQuoteAmount, setRequiredQuoteAmount] = useState<bigint>(0n);
  const [minQuoteAmount, setMinQuoteAmount] = useState<bigint>(0n);
  const [hasCollateralAllowance, setHasCollateralAllowance] = useState(false);
  const [hasQuoteAllowance, setHasQuoteAllowance] = useState(false);

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

  // Get swap details
  const { data: swap } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swaps',
    args: [swapId ? BigInt(swapId) : 0n],
  });

  // Get balances and allowances
  const { data: baseBalance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: quoteBalance } = useReadContract({
    address: quoteToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: collateralAllowance } = useReadContract({
    address: collateralIsBase ? baseToken as `0x${string}` : quoteToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, poolAddress as `0x${string}`],
  });

  const { data: quoteAllowance } = useReadContract({
    address: quoteToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, poolAddress as `0x${string}`],
  });

  // Calculate required amounts when swap changes
  useEffect(() => {
    if (swap) {
      const baseAmount = swap[2];
      const collateralRate = swap[7];
      const quoteAmount = swap[1];
      const minQuote = swap[3];
      // Calculate collateral amount
      const collateralAmount = collateralIsBase ? (BigInt(baseAmount) * BigInt(collateralRate)) / 10000n : (BigInt(quoteAmount) * BigInt(collateralRate)) / 10000n;
      setRequiredCollateralAmount(collateralAmount);
      setRequiredQuoteAmount(quoteAmount);
      setMinQuoteAmount(minQuote);
    }
  }, [swap]);

  // Update allowance states
  useEffect(() => {
    if (collateralAllowance && requiredCollateralAmount) {
      setHasCollateralAllowance(BigInt(collateralAllowance) >= requiredCollateralAmount);
    }
  }, [collateralAllowance, requiredCollateralAmount]);

  useEffect(() => {
    if (quoteAllowance && requiredQuoteAmount) {
      setHasQuoteAllowance(BigInt(quoteAllowance) >= requiredQuoteAmount);
    }
  }, [quoteAllowance, requiredQuoteAmount]);

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeTakeQuote } = useWriteContract();
  const { writeContractAsync: writePayQuote } = useWriteContract();

  const handleApproveCollateral = async () => {
    try {
      setSendingTx(true);
      const token = collateralIsBase ? baseToken : quoteToken;
      const hash = await writeApprove({
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [poolAddress as `0x${string}`, requiredCollateralAmount],
        account: address,
        chain: NETWORK.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      // Refetch allowances
      const newCollateralAllowance = await publicClient.readContract({
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, poolAddress as `0x${string}`],
      });
      setHasCollateralAllowance(BigInt(newCollateralAllowance) >= requiredCollateralAmount);
    } catch (err) {
      console.error('Approve transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleApproveQuote = async () => {
    try {
      setSendingTx(true);
      const hash = await writeApprove({
        address: quoteToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [poolAddress as `0x${string}`, requiredQuoteAmount],
        account: address,
        chain: NETWORK.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      // Refetch allowances
      const newQuoteAllowance = await publicClient.readContract({
        address: quoteToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, poolAddress as `0x${string}`],
      });
      setHasQuoteAllowance(BigInt(newQuoteAllowance) >= requiredQuoteAmount);
    } catch (err) {
      console.error('Approve transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handleTakeQuote = async () => {
    try {
      setSendingTx(true);
      const parsedAmount = parseUnits(amount, quoteTokenMeta.decimals);
      console.log(swapId, parsedAmount);
      const hash = await writeTakeQuote({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'takeSwap',
        args: [BigInt(swapId), parsedAmount],
        account: address,
        chain: NETWORK.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      onQuoteSuccess();
    } catch (err) {
      console.error('Take quote transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const handlePayQuote = async () => {
    try {
      setSendingTx(true);
      const hash = await writePayQuote({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'paySwap',
        args: [BigInt(swapId)],
        account: address,
        chain: NETWORK.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      onQuoteSuccess();
    } catch (err) {
      console.error('Pay quote transaction failed:', err);
    } finally {
      setSendingTx(false);
    }
  };

  const validateTakeQuoteInputs = () => {
    const warnings = [];

    if (!address) {
      warnings.push('Please connect your wallet');
    }

    if (!swapId) {
      warnings.push('Please enter a swap ID');
    }

    if (!amount) {
      warnings.push('Please enter an amount');
    }

    if (swap) {
      if (swap[8]) { // taken
        warnings.push('This quote has already been taken');
      }
      if (swap[11]) { // cancelled
        warnings.push('This quote has been cancelled');
      }
      if (swap[9]) { // settled
        warnings.push('This quote has already been settled');
      }
      if (swap[10]) { // claimed
        warnings.push('This quote has already been claimed');
      }

      // Check if amount meets minimum requirement
      try {
        const parsedAmount = parseUnits(amount, quoteTokenMeta.decimals);
        if (parsedAmount < minQuoteAmount) {
          warnings.push(`Amount must be at least ${formatUnits(minQuoteAmount, quoteTokenMeta.decimals)} ${quoteTokenMeta.symbol}`);
        }
      } catch (err) {
        warnings.push('Invalid amount format');
      }

      // Check balances
      if (collateralIsBase && baseBalance && BigInt(baseBalance) < requiredCollateralAmount) {
        warnings.push('Insufficient base token balance for collateral');
      }
      if (!collateralIsBase && quoteBalance && BigInt(quoteBalance) < requiredCollateralAmount) {
        warnings.push('Insufficient quote token balance for collateral');
      }
      if (quoteBalance && BigInt(quoteBalance) < requiredQuoteAmount) {
        warnings.push('Insufficient quote token balance for payment');
      }
    }

    return warnings;
  };

  const validatePayQuoteInputs = () => {
    const warnings = [];

    if (!address) {
      warnings.push('Please connect your wallet');
    }

    if (!swapId) {
      warnings.push('Please enter a swap ID');
    }

    if (swap) {
      if (!swap[8]) { // not taken
        warnings.push('This quote has not been taken yet');
      }
      if (swap[9]) { // settled
        warnings.push('This quote has already been settled');
      }
      if (swap[10]) { // claimed
        warnings.push('This quote has already been claimed');
      }
      if (swap[11]) { // cancelled
        warnings.push('This quote has been cancelled');
      }

      // Check quote balance
      if (quoteBalance && BigInt(quoteBalance) < requiredQuoteAmount) {
        warnings.push('Insufficient quote token balance for payment');
      }
    }

    return warnings;
  };

  const takeQuoteWarnings = validateTakeQuoteInputs();
  const isTakeQuoteValid = takeQuoteWarnings.length === 0;

  const payQuoteWarnings = validatePayQuoteInputs();
  const isPayQuoteValid = payQuoteWarnings.length === 0;

  return (
    <div className="main-container">
      <h2 className="main-title">Take & Pay Orders</h2>
      
      <div className="sub-container">
        <h3>Take Order</h3>
        <div className='input-group-container'>
          <b>ID:</b>
          <input
            type="number"
            value={swapId}
            onChange={(e) => setSwapId(e.target.value)}
            placeholder="Enter swap ID"
            min="0"
            className="swap-input"
          />
        </div>
        <div className='input-group-container'>
          <b>Amount:</b>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            className="swap-input"
          />
        </div>

        {swap && (
          <div className="wallet-info">
            <div><b>Required Collateral: </b>{formatUnits(requiredCollateralAmount, collateralIsBase ? baseTokenMeta.decimals : quoteTokenMeta.decimals)} {collateralIsBase ? baseTokenMeta.symbol : quoteTokenMeta.symbol}</div>
            <div><b>Required Quote Amount: </b>{formatUnits(requiredQuoteAmount, quoteTokenMeta.decimals)} {quoteTokenMeta.symbol}</div>
            <div><b>Collateral Balance: </b>{formatUnits(collateralIsBase ? baseBalance || 0n : quoteBalance || 0n, collateralIsBase ? baseTokenMeta.decimals : quoteTokenMeta.decimals)} {collateralIsBase ? baseTokenMeta.symbol : quoteTokenMeta.symbol}</div>
            <div><b>Quote Balance: </b>{formatUnits(quoteBalance || 0n, quoteTokenMeta.decimals)} {quoteTokenMeta.symbol}</div>
            <div><b>Min Quote Amount: </b>{formatUnits(minQuoteAmount, quoteTokenMeta.decimals)} {quoteTokenMeta.symbol}</div>
          </div>
        )}

        {takeQuoteWarnings.length > 0 && (
          <div className="warning-message">
            <b>Warnings:</b>
            {takeQuoteWarnings.map((warning, index) => (
              <div key={index} style={{ color: '#ff4444' }}>{warning}</div>
            ))}
          </div>
        )}

        {!hasCollateralAllowance ? (
          <button
            onClick={handleApproveCollateral}
            disabled={sendingTx || !isTakeQuoteValid}
            className="button full-width-button"
          >
            {sendingTx ? 'Approving...' : 'Approve Collateral'}
          </button>
        ) : !hasQuoteAllowance ? (
          <button
            onClick={handleApproveQuote}
            disabled={sendingTx || !isTakeQuoteValid}
            className="button full-width-button"
          >
            {sendingTx ? 'Approving...' : 'Approve Quote'}
          </button>
        ) : (
          <button
            onClick={handleTakeQuote}
            disabled={sendingTx || !isTakeQuoteValid}
            className="button full-width-button"
          >
            {sendingTx ? 'Taking Quote...' : 'Take Quote'}
          </button>
        )}
      </div>

      <div className="sub-container">
        <h3>Pay Order</h3>
        <div className='input-group-container'>
          <b>ID:</b>
          <input
            type="number"
            value={swapId}
            onChange={(e) => setSwapId(e.target.value)}
            placeholder="Enter swap ID"
            min="0"
            className="swap-input"
          />
        </div>

        {swap && (
          <div className="wallet-info">
            <div><b>Required Quote Amount: </b>{formatUnits(requiredQuoteAmount, quoteTokenMeta.decimals)} {quoteTokenMeta.symbol}</div>
            <div><b>Quote Balance: </b>{formatUnits(quoteBalance || 0n, quoteTokenMeta.decimals)} {quoteTokenMeta.symbol}</div>
          </div>
        )}

        {payQuoteWarnings.length > 0 && (
          <div className="warning-message">
            <b>Warnings:</b>
            {payQuoteWarnings.map((warning, index) => (
              <div key={index} style={{ color: '#ff4444' }}>{warning}</div>
            ))}
          </div>
        )}

        {!hasQuoteAllowance ? (
          <button
            onClick={handleApproveQuote}
            disabled={sendingTx || !isPayQuoteValid}
            className="button full-width-button"
          >
            {sendingTx ? 'Approving...' : 'Approve Quote'}
          </button>
        ) : (
          <button
            onClick={handlePayQuote}
            disabled={sendingTx || !isPayQuoteValid}
            className="button full-width-button"
          >
            {sendingTx ? 'Paying Quote...' : 'Pay Quote'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TakeQuoteComponentV2; 
import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { bsc as chain } from 'viem/chains';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { publicClient } from '../lib/viem';
import { poolAbi } from '../config/abi';

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
};

const TakeSwapComponent = ({
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
  onSwapSuccess,
}: {
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
  onSwapSuccess: () => void;
}) => {
  console.log(baseTokenMeta, quoteTokenMeta);

  const { address } = useAccount();
  const [quoteAmount, setQuoteAmount] = useState('');
  const debouncedQuoteAmount = useDebounce(quoteAmount, 1000);
  const [expectedBaseAmount, setExpectedBaseAmount] = useState('');
  const [slippage, setSlippage] = useState('1');
  const [isApproved, setIsApproved] = useState(false);
  const [latestSwap, setLatestSwap] = useState<any>(null);
  const [minQuoteSize, setMinQuoteSize] = useState<any>(0n);
  const [sendingTx, setSendingTx] = useState(false);
  const { address: account } = useAccount();
  const chainId = useChainId();

  const { data: quoteToken } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'quoteToken',
  });

  const { data: balance } = useReadContract({
    address: quoteToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: allowance } = useReadContract({
    address: quoteToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, poolAddress as `0x${string}`],
  });

  const { data: collateralRate } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'penaltyRate',
  });

  const { data: settlementPeriod } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'settlementPeriod',
  });

  useEffect(() => {
    if (debouncedQuoteAmount) {
      const required = parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals);
      console.log(`Required: ${required}, Allowance: ${BigInt(allowance)}, Approved: ${(allowance ? BigInt(allowance) : BigInt(0)) >= required}`)
      setIsApproved((allowance ? BigInt(allowance) : BigInt(0)) >= required);
    }
  }, [allowance, debouncedQuoteAmount]);

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeSwap } = useWriteContract();

  const handleApprove = async () => {
    try {
      setSendingTx(true);
      const hash = await writeApprove({
        address: quoteToken as `0x${string}`,
        abi: erc20Abi, // replace with your actual ABI
        functionName: 'approve',
        args: [poolAddress as `0x${string}`, parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals)],
        account,
        chain: chain,
      });
      console.log("Approved: ", hash);
    } catch (err) {
      console.error('Swap transaction failed:', err);
    } finally {
      const updatedAllowance = await publicClient.readContract({
        address: quoteToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, poolAddress as `0x${string}`],
      });
      const required = parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals);
      setIsApproved(BigInt(updatedAllowance) >= required);
      setSendingTx(false);
    }
  };

  const { data: swapCounter } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swapCounter',
  });
  // const swapId = swapCounter ? BigInt(swapCounter) - 1n : 0n;
  const swapId = swapCounter ? BigInt(swapCounter as string) - 1n : 0n;

  const {
    data: swapInfo,
    refetch: refetchSwapInfo,
  } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swaps',
    args: [swapId],
  });

  useEffect(() => {
    if (swapInfo) setLatestSwap(swapInfo);
  }, [swapInfo]);

  const {
    data: minQuoteSizeInfo,
    refetch: refetchMinQuoteSize,
  } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'minQuoteSize',
  });

  useEffect(() => {
    if (minQuoteSizeInfo) setMinQuoteSize(minQuoteSizeInfo);
  }, [minQuoteSizeInfo]);

  const {
    data: priceWithSpread,
    refetch: refetchPrice,
  } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'getEffectivePriceWithSpread',
    args: [swapId, parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals)],
  });

  useEffect(() => {
    if (!debouncedQuoteAmount || isNaN(Number(debouncedQuoteAmount))) return;
    refetchPrice();
    refetchSwapInfo();
  }, [debouncedQuoteAmount, refetchPrice]);

  useEffect(() => {
    if (priceWithSpread) {
      // setExpectedBaseAmount(formatUnits(priceWithSpread, quoteTokenMeta.decimals));
      setExpectedBaseAmount(formatUnits(priceWithSpread as bigint, quoteTokenMeta.decimals));
    }
  }, [priceWithSpread]);

  const spread = priceWithSpread as bigint;
  const minBaseAmount = priceWithSpread && slippage
    ? spread - (spread * BigInt(Math.floor(parseFloat(slippage) * 100)) / 10000n)
    : 0n;

  const handleSwap = async () => {
    try {
      setSendingTx(true);
      const hash = await writeSwap({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'takeSwap',
        chain: chain,
        account,
        // TODO: handle slippage
        // args: [parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals), minBaseAmount],
        args: [parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals), 0],
      });
      console.log("Swapped: ", parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals), hash);
    } catch (err) {
      console.error('Swap transaction failed:', err);
    } finally {
      setQuoteAmount("0");
      setSendingTx(false);
      onSwapSuccess?.();
    }
  };

  const quoteAmountParsed = parseUnits(debouncedQuoteAmount || '0', quoteTokenMeta.decimals);
  const exceedsMaxQuote = latestSwap && Number(quoteAmountParsed) > (latestSwap ? Number(latestSwap[3]) : Number(0n));
  const lowerThanMinQuote = minQuoteSize &&  Number(quoteAmountParsed) < Number(minQuoteSize);

  const isTaken = latestSwap && latestSwap[5];

  // check swap
  let isSwapOkay = {
    status: true,
    reason: "optimistic",
  };

  if (!quoteAmount || Number(quoteAmount) == 0) {
    isSwapOkay.status = false;
    isSwapOkay.reason = "Enter Amount to Swap";
  }

  if (Number(quoteAmount) > balance) {
    isSwapOkay.status = false;
    isSwapOkay.reason = "Swap Amount Exceeds Balance";
  }

  if (isTaken) {
    isSwapOkay.status = false;
    isSwapOkay.reason = "Latest Quote is Already Taken";
  }

  if (lowerThanMinQuote) {
    isSwapOkay.status = false;
    isSwapOkay.reason = "Swap Amount Lower Than Min Quote";
  }

  if (exceedsMaxQuote) {
    isSwapOkay.status = false;
    isSwapOkay.reason = "Swap Amount Exceeds Max Quote";
  }

  if (sendingTx) {
    isSwapOkay.status = false;
    isSwapOkay.reason = "Pending Tx Confirm...";
  }

  return (
    <div className="swap-container">
      <h2 className="oracle-title">Swap</h2>
      <b> Input ({quoteTokenMeta.symbol}):</b>
      <input
        type="number"
        value={quoteAmount}
        onChange={(e) => setQuoteAmount(e.target.value)}
        placeholder="Enter amount to swap"
        max={balance ? formatUnits(balance, quoteTokenMeta.decimals) : ''}
        className="swap-input"
      />
      <b>Output ({baseTokenMeta.symbol}):</b>
      <input
        type="number"
        value={
          !exceedsMaxQuote && !lowerThanMinQuote ? Number(expectedBaseAmount) * Number(quoteAmount) : 0
        }
        placeholder="0"
        disabled
        className="swap-input"
      />
      <b>Slippage %:</b>
      <input
        type="number"
        value={slippage}
        onChange={(e) => setSlippage(e.target.value)}
        placeholder="Slippage %"
        step="0.1"
        min="0"
        className="swap-input"
      />
      <div><b>Price:</b> {!exceedsMaxQuote ? expectedBaseAmount : 0} {baseTokenMeta.symbol} per {quoteTokenMeta.symbol}</div>
      <div><b>Wallet Balance:</b> {balance ? formatUnits(balance, quoteTokenMeta.decimals) : 0} {quoteTokenMeta.symbol}</div>
      <div><b>Min/Max Quote Size:</b> {minQuoteSize ? formatUnits(minQuoteSize, quoteTokenMeta.decimals) : 0}/{latestSwap ? formatUnits(latestSwap[3], quoteTokenMeta.decimals) : 0} {quoteTokenMeta.symbol}</div>
      <div><b>Settlement Period:</b> {settlementPeriod ? Number(settlementPeriod) / 60 / 60 : ''} hours</div>
      <div><b>Collateral</b> {collateralRate && debouncedQuoteAmount && !exceedsMaxQuote && !lowerThanMinQuote ? (Number(collateralRate) / 10000 * Number(expectedBaseAmount) * Number(quoteAmount)).toFixed(2) : 0} {baseTokenMeta.symbol} ({ collateralRate ? Number(collateralRate) / 100 : 0 }%)</div>
      {!isApproved ? (
        <button onClick={handleApprove} disabled={!isSwapOkay.status} className="swap-button">
          {isSwapOkay.status ? 'Approve' : isSwapOkay.reason}
        </button>
      ) : (
        <button onClick={handleSwap} disabled={!isSwapOkay.status} className="swap-button">
          {isSwapOkay.status ? 'Submit Swap' : isSwapOkay.reason}
        </button>
      )}
    </div>
  );
};

export default TakeSwapComponent;

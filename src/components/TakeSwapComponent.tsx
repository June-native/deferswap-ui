import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { arbitrumSepolia } from 'viem/chains';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { publicClient } from '../lib/viem';
import { poolAbi } from '../config/abi';
import { POOL_ADDRESS, QUOTE_TOKEN_DECIMALS, BASE_TOKEN_DECIMALS, BASE_TOKEN_TICKER, QUOTE_TOKEN_TICKER } from '../config/constants';


const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
};

const TakeSwapComponent = ({ onSwapSuccess }: { onSwapSuccess: () => void }) => {
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
    address: POOL_ADDRESS,
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
    args: [address, POOL_ADDRESS],
  });

  const { data: collateralRate } = useReadContract({
    address: POOL_ADDRESS,
    abi: poolAbi,
    functionName: 'penaltyRate',
  });

  const { data: settlementPeriod } = useReadContract({
    address: POOL_ADDRESS,
    abi: poolAbi,
    functionName: 'settlementPeriod',
  });

  useEffect(() => {
    if (debouncedQuoteAmount) {
      const required = parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS);
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
        args: [POOL_ADDRESS, parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS)],
        account,
        chain: arbitrumSepolia,
      });
      console.log("Approved: ", hash);
    } catch (err) {
      console.error('Swap transaction failed:', err);
    } finally {
      const updatedAllowance = await publicClient.readContract({
        address: quoteToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, POOL_ADDRESS],
      });
      const required = parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS);
      setIsApproved(BigInt(updatedAllowance) >= required);
      setSendingTx(false);
    }
  };

  const { data: swapCounter } = useReadContract({
    address: POOL_ADDRESS,
    abi: poolAbi,
    functionName: 'swapCounter',
  });
  // const swapId = swapCounter ? BigInt(swapCounter) - 1n : 0n;
  const swapId = swapCounter ? BigInt(swapCounter as string) - 1n : 0n;

  const {
    data: swapInfo,
    refetch: refetchSwapInfo,
  } = useReadContract({
    address: POOL_ADDRESS,
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
    address: POOL_ADDRESS,
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
    address: POOL_ADDRESS,
    abi: poolAbi,
    functionName: 'getEffectivePriceWithSpread',
    args: [swapId, parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS)],
  });

  useEffect(() => {
    if (!debouncedQuoteAmount || isNaN(Number(debouncedQuoteAmount))) return;
    refetchPrice();
    refetchSwapInfo();
  }, [debouncedQuoteAmount, refetchPrice]);

  useEffect(() => {
    if (priceWithSpread) {
      // setExpectedBaseAmount(formatUnits(priceWithSpread, QUOTE_TOKEN_DECIMALS));
      setExpectedBaseAmount(formatUnits(priceWithSpread as bigint, QUOTE_TOKEN_DECIMALS));
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
        address: POOL_ADDRESS,
        abi: poolAbi,
        functionName: 'takeSwap',
        chain: arbitrumSepolia,
        account,
        // TODO: handle slippage
        // args: [parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS), minBaseAmount],
        args: [parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS), 0],
      });
      console.log("Swapped: ", parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS), hash);
    } catch (err) {
      console.error('Swap transaction failed:', err);
    } finally {
      setQuoteAmount("0");
      setSendingTx(false);
      onSwapSuccess?.();
    }
  };

  const quoteAmountParsed = parseUnits(debouncedQuoteAmount || '0', QUOTE_TOKEN_DECIMALS);
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
      <b> Input ({QUOTE_TOKEN_TICKER}):</b>
      <input
        type="number"
        value={quoteAmount}
        onChange={(e) => setQuoteAmount(e.target.value)}
        placeholder="Enter amount to swap"
        max={balance ? formatUnits(balance, QUOTE_TOKEN_DECIMALS) : ''}
        className="swap-input"
      />
      <b>Output ({BASE_TOKEN_TICKER}):</b>
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
      <div><b>Price:</b> {!exceedsMaxQuote ? expectedBaseAmount : 0} {BASE_TOKEN_TICKER} per {QUOTE_TOKEN_TICKER}</div>
      <div><b>Wallet Balance:</b> {balance ? formatUnits(balance, QUOTE_TOKEN_DECIMALS) : 0} {QUOTE_TOKEN_TICKER}</div>
      <div><b>Min/Max Quote Size:</b> {minQuoteSize ? formatUnits(minQuoteSize, QUOTE_TOKEN_DECIMALS) : 0}/{latestSwap ? formatUnits(latestSwap[3], QUOTE_TOKEN_DECIMALS) : 0} {QUOTE_TOKEN_TICKER}</div>
      <div><b>Settlement Period:</b> {settlementPeriod ? Number(settlementPeriod) / 60 : ''} mins</div>
      <div><b>Collateral</b> {collateralRate && debouncedQuoteAmount && !exceedsMaxQuote && !lowerThanMinQuote ? (Number(collateralRate) / 10000 * Number(expectedBaseAmount) * Number(quoteAmount)).toFixed(2) : 0} {BASE_TOKEN_TICKER} ({ collateralRate ? Number(collateralRate) / 100 : 0 }%)</div>
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

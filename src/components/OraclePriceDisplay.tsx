import { useEffect, useState } from 'react';
import { useContractRead } from 'wagmi';
import { formatUnits } from 'viem';
import { publicClient } from '../lib/viem';
import { poolAbi } from '../config/abi';

const OraclePriceDisplay = ({ 
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
}: { 
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
}) => {
  const [oraclePrice, setOraclePrice] = useState('');

  const { data: rawOraclePrice, refetch } = useContractRead({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'getOraclePrice',
    // watch: false,
  });

  useEffect(() => {
    if (rawOraclePrice) {
      console.log(`Oracle price raw: ${rawOraclePrice}`);
      setOraclePrice(formatUnits(BigInt(rawOraclePrice as string || 0), quoteTokenMeta.decimals));
    }
  }, [rawOraclePrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="oracle-container">
      <h2 className="oracle-title">Oracle Price</h2>
      <div>{oraclePrice ? `${oraclePrice} ${baseTokenMeta.decimals} per ${quoteTokenMeta.symbol}` : 'Loading...'}</div>
    </div>
  );
};

export default OraclePriceDisplay;

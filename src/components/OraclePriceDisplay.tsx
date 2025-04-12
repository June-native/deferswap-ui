import { useEffect, useState } from 'react';
import { useContractRead } from 'wagmi';
import { formatUnits } from 'viem';
import { publicClient } from '../lib/viem';
import { poolAbi } from '../config/abi';
import { POOL_ADDRESS, BASE_TOKEN_DECIMALS, QUOTE_TOKEN_DECIMALS, BASE_TOKEN_TICKER, QUOTE_TOKEN_TICKER } from '../config/constants';
import './OraclePriceDisplay.css';

const OraclePriceDisplay = () => {
  const [oraclePrice, setOraclePrice] = useState('');

  const { data: rawOraclePrice, refetch } = useContractRead({
    address: POOL_ADDRESS,
    abi: poolAbi,
    functionName: 'getOraclePrice',
    watch: false,
  });

  useEffect(() => {
    if (rawOraclePrice) {
      console.log(`Oracle price raw: ${rawOraclePrice}`);
      setOraclePrice(formatUnits(rawOraclePrice, QUOTE_TOKEN_DECIMALS));
    }
  }, [rawOraclePrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="oracle-container">
      <h2 className="oracle-title">Oracle Price</h2>
      <div>{oraclePrice ? `${oraclePrice} ${BASE_TOKEN_TICKER} per ${QUOTE_TOKEN_TICKER}` : 'Loading...'}</div>
    </div>
  );
};

export default OraclePriceDisplay;

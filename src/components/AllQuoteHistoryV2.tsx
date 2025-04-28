import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { poolAbiLimit as poolAbi } from '../config/abi';
import { publicClient } from '../lib/viem';

interface AllQuoteHistoryV2Props {
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
}

interface Swap {
  id: number;
  swapper: string;
  quoteAmount: bigint;
  baseAmount: bigint;
  minQuoteAmount: bigint;
  collateral: bigint;
  orderExpiry: bigint;
  settleExpiry: bigint;
  collateralRate: bigint;
  taken: boolean;
  settled: boolean;
  claimed: boolean;
  cancelled: boolean;
}

const AllQuoteHistoryV2 = ({
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
}: AllQuoteHistoryV2Props) => {
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Get swap counter
  const { data: swapCounter } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: 'swapCounter',
  });

  // Fetch all swaps
  const fetchSwaps = async () => {
    if (!swapCounter) return;
    setRefreshing(true);

    try {
      const swapCount = Number(swapCounter);
      const newSwaps: Swap[] = [];

      for (let i = 0; i < swapCount; i++) {
        const swapData = await publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: poolAbi,
          functionName: 'swaps',
          args: [BigInt(i)],
        });

        if (swapData) {
          newSwaps.push({
            id: i,
            swapper: swapData[0],
            quoteAmount: swapData[1],
            baseAmount: swapData[2],
            minQuoteAmount: swapData[3],
            collateral: swapData[4],
            orderExpiry: swapData[5],
            settleExpiry: swapData[6],
            collateralRate: swapData[7],
            taken: swapData[8],
            settled: swapData[9],
            claimed: swapData[10],
            cancelled: swapData[11],
          });
        }
      }

      console.log(`Fetched: `, newSwaps);
      setSwaps(newSwaps.reverse()); // Show newest first
    } catch (err) {
      console.error('Error fetching swaps:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pagination state
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(swaps.length / itemsPerPage);
  const displayedSwaps = swaps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Auto-refresh timers
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSwaps();
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [swapCounter]);

  useEffect(() => {
    fetchSwaps();
  }, [swapCounter]);

  const getStatus = (swap: Swap) => {
    if (swap.cancelled) return 'Cancelled';
    if (swap.claimed) return 'Claimed';
    if (swap.settled) return 'Settled';
    if (swap.taken) return 'Taken';
    return 'Open';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'text-green-500';
      case 'Taken':
        return 'text-blue-500';
      case 'Settled':
        return 'text-purple-500';
      case 'Claimed':
        return 'text-yellow-500';
      case 'Cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: bigint, isSettlement: boolean = false, isTaken: boolean = false) => {
    if (isSettlement && !isTaken) {
      // For untaken swaps, show settlement period in hours
      const hours = Number(timestamp) / 3600;
      return `${hours.toFixed(1)} hours`;
    }
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="p-4">Loading quotes...</div>;
  }

  return (
    <div className="main-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h2 className="main-title">All Orders</h2>
      {swaps.length === 0 ? (
        <p>No quotes found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="history-table" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                <th style={{ width: '20px' }}>ID</th>
                <th style={{ width: '80px' }}>Status</th>
                <th style={{ width: '40px' }}>Buying<br />(quote)</th>
                <th style={{ width: '40px' }}>Selling<br />(base)</th>
                <th style={{ width: '40px' }}>Min Buying<br />(quote)</th>
                <th style={{ width: '80px' }}>Collateral<br />Rate</th>
                <th style={{ width: '40px' }}>Order<br />Expiry</th>
                <th style={{ width: '40px' }}>Settle<br />Expiry</th>
                <th style={{ width: '100px' }}>Taker</th>
              </tr>
            </thead>
            <tbody>
              {displayedSwaps.map((swap, index) => {
                const status = getStatus(swap);
                return (
                  <tr key={swap.id} className="history-row">
                    <td style={{ textAlign: 'center' }}>{swap.id}</td>
                    <td>
                      <span className={`px-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="text-sm">
                      {formatUnits(swap.quoteAmount, quoteTokenMeta.decimals)} {quoteTokenMeta.symbol}
                    </td>
                    <td className="text-sm">
                      {formatUnits(swap.baseAmount, baseTokenMeta.decimals)} {baseTokenMeta.symbol}
                    </td>
                    <td className="text-sm">
                      {formatUnits(swap.minQuoteAmount, quoteTokenMeta.decimals)} {quoteTokenMeta.symbol}
                    </td>
                    <td className="text-sm">
                      {(Number(swap.collateralRate) / 100).toFixed(2)}%
                    </td>
                    <td className="text-sm">
                      {formatTimestamp(swap.orderExpiry)}
                    </td>
                    <td className="text-sm">
                      {formatTimestamp(swap.settleExpiry, true, swap.taken)}
                    </td>
                    <td className="text-xs">
                      {swap.taken ? `${swap.swapper.slice(0, 6)}...${swap.swapper.slice(-4)}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="pagination">
            <button
              className="swap-button page-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Prev
            </button>
            <span className="page-indicator">Page {currentPage} of {totalPages}</span>
            <button
              className="swap-button page-button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
            <button
              onClick={fetchSwaps}
              disabled={refreshing}
              className="swap-button page-button"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllQuoteHistoryV2;
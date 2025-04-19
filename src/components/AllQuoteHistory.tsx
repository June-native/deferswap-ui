import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { poolAbi } from '../config/abi';
import { publicClient } from '../lib/viem';
// import { bsc as chain } from 'viem/chains';
import { parseUnits, formatUnits } from 'viem';
import { NETWORK } from '../config/constants';

const AllQuoteHistory = forwardRef(({
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
}: {
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
}, ref) => {
  const [userSwaps, setUserSwaps] = useState([]);
  const [swapCount, setSwapCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSwapCountAndSwaps = async () => {
    try {
      setRefreshing(true);
      console.log(`Fetching...`);
      const count = await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'swapCounter',
      });
      const countNum = Number(count);
      console.log(`Fetched ${countNum} quotes.`)
      setSwapCount(countNum);

      if (countNum === 0) {
        setRefreshing(false);
        return;
      }

      const swaps = await Promise.all(
        Array.from({ length: countNum }, async (_, i) => {
          try {
            const swap = await publicClient.readContract({
              address: poolAddress as `0x${string}`,
              abi: poolAbi,
              functionName: 'swaps',
              args: [BigInt(i)],
            });
            if (typeof swap === 'object' && swap !== null) {
              return { id: i, ...swap };
            } else {
              return { id: i }; // fallback or error case
            }
          } catch (e) {
            console.error(`Error reading swap ${i}`, e);
            return null;
          }
        })
      );

      const userSwaps = swaps;
      setUserSwaps(userSwaps.reverse());
      console.log(`Fetched: `, userSwaps);
    } catch (err) {
      console.warn('Error fetching swapCounter or swaps', err);
      setSwapCount(0);
    } finally {
      setRefreshing(false);
    }
  };


  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(userSwaps.length / itemsPerPage);
  const displayedSwaps = userSwaps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSwapCountAndSwaps();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSwapCountAndSwaps();
  }, []);

  const formatCountdown = (expiryMs: number) => {
    const remaining = Math.max(0, Math.floor((expiryMs - now) / 1000));

    const hrs = Math.floor(remaining / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const explorerLink = `${NETWORK.explorerUrl}/address/${poolAddress}`;

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchSwapCountAndSwaps();
    }
  }));

  return (
    <div className="main-container">
      <h2 className="main-title">All Quote History</h2>
      {swapCount === null ? (
        <p>Loading quotes...</p>
      ) : userSwaps.length === 0 ? (
        <p>No quotes found.</p>
      ) : (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{quoteTokenMeta.symbol}</th>
                <th>{baseTokenMeta.symbol}</th>
                <th>Collateral</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Claimed?</th>
              </tr>
            </thead>
            <tbody>
              {displayedSwaps.map(s => {
                const now = Date.now();
                const expiryMs = Number(s[5]) * 1000;
                const isExpired = now > expiryMs;
                const isTaken = s[6];
                const isSettle = s[7];
                const isClaimed = s[8];
                const isCancelled = s[9];


                const status =
                  (isExpired && expiryMs > 0) && !isTaken && !isCancelled ? 'Defaulted' :
                  !isSettle && !isCancelled && !isTaken && !isClaimed ? 'Open' :
                  !isSettle && !isCancelled && isTaken && !isClaimed ? 'To Fill' :
                  isSettle && !isCancelled && isTaken && !isClaimed ? 'Filled' :
                  isClaimed ? 'Claimed' :
                  isCancelled ? 'Cancelled' :
                  'unknown';

                return (
                  <tr key={s.id} className="history-row">
                    <td>{s.id}</td>
                    <td>{
                      isTaken 
                        ? Number(formatUnits(s[1], quoteTokenMeta.decimals)).toFixed(3)
                        : <><span>{Number(formatUnits(s[3], quoteTokenMeta.decimals)).toFixed(3)}</span><br/><span style={{ fontSize: '0.85em', color: '#888' }}>MAX</span></>
                    }</td>
                    <td>{Number(formatUnits(s[2], baseTokenMeta.decimals)).toFixed(3)}</td>
                    <td>{
                      isTaken
                        ? Number(formatUnits(s[4], baseTokenMeta.decimals)).toFixed(3)
                        : <><span>{Number(formatUnits(s[4], baseTokenMeta.decimals)).toFixed(3)}</span><br/><span style={{ fontSize: '0.85em', color: '#888' }}>MAX</span></>
                    }</td>
                    <td>
                      {expiryMs > 0 ? new Date(expiryMs).toLocaleString() : '-'}
                      <br />
                      <span style={{ fontSize: '0.85em', color: '#888' }}>
                        in {!isClaimed && !isCancelled ? formatCountdown(expiryMs) : '00:00:00'}
                      </span>
                    </td>
                    <td>{status}</td>
                    <td>{isClaimed ? 'Yes' : 'No'}</td>
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
                onClick={fetchSwapCountAndSwaps}
                disabled={refreshing}
                className="swap-button page-button"
              >
              {refreshing ? 'Pending...' : 'Refresh'}
            </button>
          </div>
        </>
      )}
      <p><b>Explorer:</b> <a href={explorerLink} target="_blank">{explorerLink}</a></p>
    </div>
  );
});

export default AllQuoteHistory;

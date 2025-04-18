import { useEffect, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { poolAbi } from '../config/abi';
import { publicClient } from '../lib/viem';
import { bsc as chain } from 'viem/chains';
import { parseUnits, formatUnits } from 'viem';

const UserSwapHistory = ({
  poolAddress,
  baseTokenMeta,
  quoteTokenMeta,
  refreshKey, 
}: {
  poolAddress: string;
  baseTokenMeta: { symbol: string; decimals: number };
  quoteTokenMeta: { symbol: string; decimals: number };
  refreshKey: number;
}) => {
  const { address } = useAccount();
  const { address: account } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [userSwaps, setUserSwaps] = useState([]);
  const [swapCount, setSwapCount] = useState<number | null>(null);
  const [claimingSwapId, setClaimingSwapId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSwapCountAndSwaps();
  }, [address, refreshKey]);

  const fetchSwapCountAndSwaps = async () => {
    try {
      setRefreshing(true);
      const count = await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        functionName: 'swapCounter',
      });
      const countNum = Number(count);
      setSwapCount(countNum);

      if (!address || countNum === 0) {
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

      const userSwaps = swaps.filter(s => s && s[0]?.toLowerCase() === address.toLowerCase());
      setUserSwaps(userSwaps.reverse());
      console.log(userSwaps);
    } catch (err) {
      console.warn('Error fetching swapCounter or swaps', err);
      setSwapCount(0);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClaim = async (swapId: number) => {
    try {
      setClaimingSwapId(swapId);
      const hash = await writeContractAsync({
        address: poolAddress as `0x${string}`,
        abi: poolAbi,
        chain: chain,
        account,
        functionName: 'claimSwap',
        args: [BigInt(swapId)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      fetchSwapCountAndSwaps();
    } catch (err) {
      console.error('Claim transaction failed:', err);
    } finally {
      setClaimingSwapId(null);
    }
  };

  useEffect(() => {
    fetchSwapCountAndSwaps();
  }, [address]);

  const itemsPerPage = 5;
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

  const formatCountdown = (expiryMs: number) => {
    const remaining = Math.max(0, Math.floor((expiryMs - now) / 1000));

    const hrs = Math.floor(remaining / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="main-container">
      <h2 className="main-title">Your Swap History</h2>
      {swapCount === null ? (
        <p>Loading swap history...</p>
      ) : userSwaps.length === 0 ? (
        <p>No swaps found.</p>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedSwaps.map(s => {
                const now = Date.now();
                const expiryMs = Number(s[5]) * 1000;
                const isExpired = now > expiryMs;
                const isClaimed = s[8];
                const isCancelled = s[9];

                const status =
                  isExpired && !s[7] ? 'Defaulted' :
                  !s[7] ? 'Pending' :
                  s[7] && !s[8] ? 'Settled' :
                  isClaimed ? 'Claimed' :
                  isCancelled ? 'Cancelled' :
                  'unknown';

                return (
                  <tr key={s.id} className="history-row">
                    <td>{s.id}</td>
                    <td>{Number(formatUnits(s[1], quoteTokenMeta.decimals)).toFixed(2)}</td>
                    <td>{Number(formatUnits(s[2], baseTokenMeta.decimals)).toFixed(2)}</td>
                    <td>{Number(formatUnits(s[4], baseTokenMeta.decimals)).toFixed(2)}</td>
                    <td>
                      {new Date(expiryMs).toLocaleString()}
                      <br />
                      <span style={{ fontSize: '0.85em', color: '#888' }}>
                          in {!isClaimed && !isCancelled ? formatCountdown(expiryMs) : '00:00:00'}
                      </span>
                    </td>
                    <td>{status}</td>
                    <td>
                      <button
                        onClick={() => handleClaim(s.id)}
                        disabled={isClaimed || isCancelled || claimingSwapId === s.id || (!s[7] && !isExpired)}
                        className="swap-button"
                      >
                        {
                          claimingSwapId === s.id ? 'Pending...' : 
                          isClaimed ? 'Claimed' : 
                          'Claim'
                        }
                      </button>
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
                onClick={fetchSwapCountAndSwaps}
                disabled={refreshing}
                className="swap-button page-button"
              >
              {refreshing ? 'Pending...' : 'Refresh'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserSwapHistory;

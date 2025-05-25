import { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/WalletContext";
import { useTheme } from "../AdminDashboardLayout";
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  SearchIcon,
  ChevronDownIcon,
  XIcon,
  CheckCircleIcon,
  BanIcon,
  ClockIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import PresaleABI from "../abi/presaleABI";
import { toast } from "react-hot-toast";

// Environment Variables
const PRESALE_ADDRESS =
  import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS ||
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const TOKEN_NAME = import.meta.env.VITE_TOKEN_NAME || "HPT";
const USDT_ADDRESS =
  import.meta.env.VITE_USDT_ADDRESS ||
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const HPT_DECIMALS = Number(import.meta.env.VITE_HPT_DECIMALS) || 18;
const USDT_DECIMALS = Number(import.meta.env.VITE_USDT_DECIMALS) || 6;
const STAKING_OPTIONS = JSON.parse(
  import.meta.env.VITE_STAKING_OPTIONS ||
    '[{"name":"6 Months","lockupSeconds":15552000,"apr":10},{"name":"12 Months","lockupSeconds":31104000,"apr":15}]'
);
const RPC_PROVIDER_URL =
  import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

const COLORS = {
  primary: "var(--color-accent-blue, #3b82f6)",
  secondary: "var(--color-accent-purple, #9333ea)",
  success: "var(--color-accent-green, #22c55e)",
  danger: "var(--color-accent-red, #ef4444)",
  warning: "var(--color-accent-yellow, #eab308)",
};
const STATE_MAP = ["NotStarted", "Active", "Ended", "ClaimOpen"];
const STATE_COLORS = {
  Active: COLORS.success,
  NotStarted: "var(--color-accent-purple, #8b5cf6)",
  Ended: COLORS.danger,
  ClaimOpen: COLORS.primary,
  Unknown: "var(--color-text-sub, #6b7280)",
};

// Helper to serialize BigInt
const serializeBigInt = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

// Helper to format BigInt
const formatBigInt = (value, decimals, fieldName) => {
  console.log(`formatBigInt input for ${fieldName}:`, {
    value,
    type: typeof value,
    decimals,
  });
  if (value === undefined || value === null) {
    console.warn(`formatBigInt: ${fieldName} is ${value}, returning 0`);
    return 0;
  }
  if (typeof value !== "bigint") {
    console.warn(
      `formatBigInt: ${fieldName} is not a BigInt, got ${typeof value}, returning 0`
    );
    return 0;
  }
  const decimalsNum = Number(decimals);
  if (isNaN(decimalsNum) || decimalsNum < 0) {
    console.warn(
      `formatBigInt: Invalid decimals for ${fieldName}, got ${decimals}, returning 0`
    );
    return 0;
  }
  try {
    const formatted = ethers.formatUnits(value, decimalsNum);
    const number = Number(formatted);
    if (isNaN(number)) {
      throw new Error(
        `Invalid number conversion for ${fieldName}: ${formatted}`
      );
    }
    return number;
  } catch (err) {
    console.error(`formatBigInt error for ${fieldName}:`, err.message);
    return 0;
  }
};

// Empty state components
const EmptyTableMessage = ({ message }) => (
  <motion.div
    className="flex items-center justify-center h-48 bg-[var(--color-bg-start)]/50 rounded-lg"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="p-4 text-center">
      <UserGroupIcon
        className="w-6 h-6 mx-auto mb-2"
        style={{ color: "var(--color-text-sub)" }}
      />
      <p
        style={{ color: "var(--color-text-body)" }}
        className="text-sm xs:text-xs"
      >
        {message}
      </p>
    </div>
  </motion.div>
);

const EmptyChartMessage = ({ message }) => (
  <motion.div
    className="flex items-center justify-center h-40 bg-[var(--color-bg-start)]/50 rounded-lg"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="p-4 text-center">
      <ClockIcon
        className="w-6 h-6 mx-auto mb-2"
        style={{ color: "var(--color-text-sub)" }}
      />
      <p
        style={{ color: "var(--color-text-body)" }}
        className="text-sm xs:text-xs"
      >
        {message}
      </p>
    </div>
  </motion.div>
);

// Stats Grid Component
const StatsGrid = ({ stats }) => {
  const statItems = [
    {
      title: "Total Participants",
      value: stats.participantCount.toLocaleString(),
      icon: UserGroupIcon,
      color: COLORS.primary,
      tooltip: "Number of unique buyers",
      isHighlighted: true,
    },
    {
      title: "Total Sold",
      value: `${stats.totalSold.toLocaleString()} ${TOKEN_NAME}`,
      icon: CurrencyDollarIcon,
      color: COLORS.secondary,
      tooltip: `Total ${TOKEN_NAME} tokens sold`,
      isHighlighted: true,
    },
    {
      title: "Total Raised",
      value: `${stats.totalRaised.toLocaleString()} USDT`,
      icon: CurrencyDollarIcon,
      color: COLORS.primary,
      tooltip: "Total USDT raised",
      isHighlighted: true,
    },
    {
      title: "Presale State",
      value: stats.presaleState,
      icon: ClockIcon,
      color: STATE_COLORS[stats.presaleState] || STATE_COLORS.Unknown,
      tooltip: "Current presale status",
      isHighlighted: true,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] max-[380px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 sm:gap-3 xs:gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {statItems.map((stat, index) => (
        <motion.div
          key={index}
          className={`relative flex items-center p-3 sm:p-2 xs:p-1.5 rounded-xl ${
            stat.isHighlighted
              ? "bg-gradient-to-r from-[var(--color-bg-start)]/90 to-[var(--color-accent-blue)]/10 border-[var(--color-border)]"
              : "bg-[var(--color-card-bg)]/80 border-[var(--color-border)]"
          } backdrop-blur-lg hover:shadow-lg transition-shadow group min-w-0`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.02 }}
        >
          <stat.icon
            className="flex-shrink-0 w-5 h-5 sm:w-4 sm:h-4 xs:w-3.5 xs:h-3.5 mr-2 sm:mr-1.5 xs:mr-1"
            style={{ color: stat.color }}
          />
          <div className="min-w-0 flex-1">
            <p
              style={{ color: "var(--color-text-body)" }}
              className="text-xs sm:text-[14px] xs:text-[13px] font-medium truncate"
            >
              {stat.title}
            </p>
            <p
              style={{ color: stat.color }}
              className="text-base sm:text-[17px] xs:text-[15px] font-semibold truncate"
            >
              {stat.value}
            </p>
          </div>
          <div
            className="absolute z-10 invisible p-1.5 sm:p-1 xs:p-0.5 text-xs sm:text-[10px] xs:text-[9px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 bottom-full left-1/2 transform -translate-x-1/2 mb-2 group-hover:visible group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--color-text-header)" }}
          >
            {stat.tooltip}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Participant Details Component
const ParticipantDetails = ({
  address,
  contract,
  hptDecimals = HPT_DECIMALS,
  usdtDecimals = USDT_DECIMALS,
  onClose,
}) => {
  const [details, setDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!contract || !ethers.isAddress(address)) {
      setError("Invalid contract or address");
      setIsLoading(false);
      return false;
    }

    try {
      const provider = new ethers.JsonRpcProvider(RPC_PROVIDER_URL);
      const presaleContract = new ethers.Contract(
        contract.target,
        contract.interface,
        provider
      );

      const countRaw = await presaleContract.getParticipationCount(address);
      const count = Number(countRaw);
      console.log(`Participation count for ${address}:`, count);

      if (count === 0) {
        setDetails([]);
        setIsLoading(false);
        return true;
      }

      // Fetch RewardsClaimed events with limited block range
      const latestBlock = await provider.getBlockNumber();
      const startBlock = Number(import.meta.env.VITE_START_BLOCK) || 8403060;
      console.log("Start block from env:", startBlock);
      if (isNaN(startBlock) || startBlock < 0) {
        console.warn("Invalid start block, using 8403060");
        startBlock = 8403060;
      }
      const blockRange = 500; // Complies with RPC limit
      const claimFilter = presaleContract.filters.RewardsClaimed(address);
      let claimEvents = [];

      console.log(
        `Querying RewardsClaimed events from block ${startBlock} to ${latestBlock}`
      );
      for (
        let fromBlock = startBlock;
        fromBlock <= latestBlock;
        fromBlock += blockRange
      ) {
        const toBlock = Math.min(fromBlock + blockRange - 1, latestBlock);
        console.log(
          `Fetching RewardsClaimed events from ${fromBlock} to ${toBlock}`
        );
        const events = await presaleContract
          .queryFilter(claimFilter, fromBlock, toBlock)
          .catch((err) => {
            console.error(
              `Error querying RewardsClaimed from ${fromBlock} to ${toBlock}:`,
              err
            );
            return [];
          });
        claimEvents = claimEvents.concat(events);
      }

      const totalClaimedFromEvents = claimEvents.reduce(
        (sum, event) =>
          sum +
          formatBigInt(
            event.args.amount,
            hptDecimals,
            `claimedEvent_${address}_${event.transactionHash}`
          ),
        0
      );
      console.log(
        `Claim events for ${address}:`,
        claimEvents.map((e) => ({
          amount: formatBigInt(
            e.args.amount,
            hptDecimals,
            `event_${address}_${e.transactionHash}`
          ),
          block: e.blockNumber,
          txHash: e.transactionHash,
        }))
      );

      const detailPromises = Array.from({ length: count }, (_, i) =>
        presaleContract.getParticipationDetails(address, i)
      );
      const detailsRaw = await Promise.all(
        detailPromises.map(async (promise, i) => {
          try {
            const detail = await promise;
            console.log(`Raw detail ${i} for ${address}:`, {
              purchasedAmount: detail[0].toString(),
              paymentAmount: detail[1].toString(),
              claimedAmount: detail[2].toString(),
              stakingEndTime: detail[3].toString(),
              lockupPeriod: detail[4].toString(),
              stakingAPR: detail[5].toString(),
              timestamp: detail[6].toString(),
            });
            return detail;
          } catch (err) {
            console.error(`Detail ${i} failed:`, err);
            return null;
          }
        })
      );

      const newDetails = detailsRaw
        .filter((detail) => detail !== null)
        .map((detail, i) => {
          const purchasedAmount = formatBigInt(
            detail[0],
            hptDecimals,
            `purchasedAmount_${i}`
          );
          const paymentAmount = formatBigInt(
            detail[1],
            usdtDecimals,
            `paymentAmount_${i}`
          );
          // Use event-based claimedAmount, split evenly across entries
          const claimedAmount = count > 0 ? totalClaimedFromEvents / count : 0;
          const stakingEndTime = Number(detail[3] || 0);
          const lockupPeriod = Number(detail[4] || 0);
          const stakingAPR = Number(detail[5] || 0) / 100;
          const timestamp = Number(detail[6] || 0) * 1000;

          // Map lockupPeriod to staking option name
          const stakingOption =
            STAKING_OPTIONS.find((opt) => opt.lockupSeconds === lockupPeriod)
              ?.name || "None";

          const processedDetail = {
            purchasedAmount,
            paymentAmount,
            claimedAmount,
            stakingEndTime:
              stakingEndTime > 0
                ? new Date(stakingEndTime * 1000).toLocaleDateString()
                : "Not Staked",
            stakingOption,
            stakingAPR: isNaN(stakingAPR) ? 0 : stakingAPR,
            timestamp: timestamp > 0 ? timestamp : Date.now(),
          };

          console.log(`Processed detail ${i} for ${address}:`, processedDetail);

          if (purchasedAmount === 0 && paymentAmount === 0) {
            console.warn(
              `Detail ${i} has zero purchased and payment, skipping`
            );
            return null;
          }

          return processedDetail;
        })
        .filter((detail) => detail !== null);

      console.log(`Final details for ${address}:`, newDetails);

      if (newDetails.length === 0 && count > 0) {
        throw new Error("No valid participation data found");
      }

      setDetails(newDetails);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to load data: ${err.message}`);
      setIsLoading(false);
      toast.error("Failed to load participant details");
      return false;
    }
  }, [contract, address, hptDecimals, usdtDecimals]);

  useEffect(() => {
    let mounted = true;
    setDetails([]);
    setIsLoading(true);
    setError(null);

    const attemptFetch = async () => {
      if (mounted) {
        await fetchDetails();
      }
    };

    attemptFetch();

    return () => {
      mounted = false;
    };
  }, [fetchDetails]);

  const purchaseData = useMemo(() => {
    if (details.length === 0) return [];
    const data = details.map((d) => ({
      date: new Date(d.timestamp).toLocaleDateString(),
      amount: d.purchasedAmount,
    }));
    console.log(`Purchase data for chart (${address}):`, data);
    return data;
  }, [details, address]);

  const rewardData = useMemo(() => {
    if (details.length === 0) return [];
    const data = [];
    const now = Date.now();
    for (let month = 0; month <= 12; month++) {
      const time = now + month * 30 * 24 * 3600 * 1000;
      let totalRewards = 0;
      details.forEach((d) => {
        if (d.stakingOption === "None") return;
        const stakeStart = d.timestamp;
        const lockupSeconds =
          STAKING_OPTIONS.find((opt) => opt.name === d.stakingOption)
            ?.lockupSeconds || 0;
        const stakeEnd = stakeStart + lockupSeconds * 1000;
        if (time >= stakeStart && time <= stakeEnd) {
          const elapsedSeconds = (time - stakeStart) / 1000;
          const apr = d.stakingAPR / 100;
          const reward =
            (d.purchasedAmount * apr * elapsedSeconds) / (365 * 24 * 3600);
          totalRewards += reward;
        }
      });
      data.push({
        month: new Date(time).toLocaleString("default", { month: "short" }),
        rewards: totalRewards,
      });
    }
    console.log(`Reward data for chart (${address}):`, data);
    return data;
  }, [details, address]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-2 bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-5xl p-6 sm:p-4 xs:p-3 rounded-xl bg-[var(--color-card-bg)]/90 backdrop-blur-lg border border-[var(--color-border)] overflow-y-auto max-h-[90vh] min-h-[300px]"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-3 xs:mb-2">
          <h3
            style={{ color: "var(--color-text-header)" }}
            className="text-lg sm:text-base xs:text-sm font-semibold truncate"
          >
            Details: {address.slice(0, 6)}...{address.slice(-4)}
          </h3>
          <motion.button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--color-border)]/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Close"
          >
            <XIcon
              className="w-5 h-5 sm:w-4 sm:h-4 xs:w-3 xs:h-3"
              style={{ color: "var(--color-text-sub)" }}
            />
          </motion.button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6 sm:py-4 xs:py-3">
            <motion.div
              className="w-6 h-6 sm:w-5 sm:h-5 xs:w-4 xs:h-4 border-2 rounded-full border-t-transparent"
              style={{ borderColor: COLORS.primary }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : error ? (
          <div className="py-6 sm:py-4 xs:py-3 text-center">
            <p
              style={{ color: "var(--color-text-body)" }}
              className="mb-4 text-sm sm:text-xs xs:text-[10px]"
            >
              {error}
            </p>
            <motion.button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setDetails([]);
                fetchDetails();
              }}
              className="px-4 py-2 sm:px-3 sm:py-1.5 xs:px-2 xs:py-1 text-sm sm:text-xs xs:text-[10px] font-medium text-white rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Retry"
            >
              Retry
            </motion.button>
          </div>
        ) : details.length === 0 ? (
          <p
            style={{ color: "var(--color-text-body)" }}
            className="text-sm sm:text-xs xs:text-[10px] text-center"
          >
            No participation details available.
          </p>
        ) : (
          <div className="space-y-4 sm:space-y-3 xs:space-y-2">
            <div className="space-y-3 sm:space-y-2 xs:space-y-1.5">
              {details.map((detail, index) => (
                <motion.div
                  key={index}
                  className="p-4 sm:p-3 xs:p-2 rounded-lg bg-[var(--color-bg-start)]/50 border border-[var(--color-border)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p
                    style={{ color: "var(--color-text-sub)" }}
                    className="text-xs sm:text-[10px] xs:text-[9px] font-medium"
                  >
                    Purchase #{index + 1}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-1 xs:gap-0.5 mt-1">
                    <div className="flex items-center">
                      <span
                        style={{ color: "var(--color-text-sub)" }}
                        className="text-xs sm:text-[10px] xs:text-[9px] mr-1"
                      >
                        Purchased:
                      </span>
                      <span
                        style={{ color: "var(--color-text-header)" }}
                        className="text-sm sm:text-xs xs:text-[10px] font-semibold truncate"
                      >
                        {detail.purchasedAmount.toLocaleString()} {TOKEN_NAME}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        style={{ color: "var(--color-text-sub)" }}
                        className="text-xs sm:text-[10px] xs:text-[9px] mr-1"
                      >
                        Paid:
                      </span>
                      <span
                        style={{ color: "var(--color-text-header)" }}
                        className="text-sm sm:text-xs xs:text-[10px] font-semibold truncate"
                      >
                        {detail.paymentAmount.toLocaleString()} USDT
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        style={{ color: "var(--color-text-sub)" }}
                        className="text-xs sm:text-[10px] xs:text-[9px] mr-1"
                      >
                        Claimed:
                      </span>
                      <span
                        style={{ color: "var(--color-text-header)" }}
                        className="text-sm sm:text-xs xs:text-[10px] font-semibold truncate"
                      >
                        {detail.claimedAmount.toLocaleString()} {TOKEN_NAME}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        style={{ color: "var(--color-text-sub)" }}
                        className="text-xs sm:text-[10px] xs:text-[9px] mr-1"
                      >
                        Staking End:
                      </span>
                      <span
                        style={{ color: "var(--color-text-header)" }}
                        className="text-sm sm:text-xs xs:text-[10px] font-semibold truncate"
                      >
                        {detail.stakingEndTime}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        style={{ color: "var(--color-text-sub)" }}
                        className="text-xs sm:text-[10px] xs:text-[9px] mr-1"
                      >
                        Option:
                      </span>
                      <span
                        style={{ color: "var(--color-text-header)" }}
                        className="text-sm sm:text-xs xs:text-[10px] font-semibold truncate"
                      >
                        {detail.stakingOption}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        style={{ color: "var(--color-text-sub)" }}
                        className="text-xs sm:text-[10px] xs:text-[9px] mr-1"
                      >
                        APR:
                      </span>
                      <span
                        style={{ color: "var(--color-text-header)" }}
                        className="text-sm sm:text-xs xs:text-[10px] font-semibold truncate"
                      >
                        {detail.stakingAPR}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {purchaseData.length > 0 &&
            purchaseData.some((d) => d.amount > 0) ? (
              <div>
                <h4
                  style={{ color: "var(--color-text-header)" }}
                  className="mb-2 sm:mb-1.5 xs:mb-1 text-base sm:text-sm xs:text-xs font-semibold"
                >
                  Purchase History
                </h4>
                <div className="w-full rounded-lg overflow-hidden">
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={purchaseData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="var(--color-text-sub)"
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                      />
                      <YAxis
                        stroke="var(--color-text-sub)"
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card-bg)/90",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          color: "var(--color-text-header)",
                          fontSize: window.innerWidth < 640 ? "10px" : "12px",
                        }}
                        formatter={(value) =>
                          `${value.toLocaleString()} ${TOKEN_NAME}`
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={COLORS.primary}
                        fill={COLORS.primary}
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyChartMessage message="No purchase history available" />
            )}
            {rewardData.length > 0 && rewardData.some((d) => d.rewards > 0) ? (
              <div>
                <h4
                  style={{ color: "var(--color-text-header)" }}
                  className="mb-2 sm:mb-1.5 xs:mb-1 text-base sm:text-sm xs:text-xs font-semibold"
                >
                  Reward Projection
                </h4>
                <div className="w-full rounded-lg overflow-hidden">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart
                      data={rewardData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="var(--color-text-sub)"
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                      />
                      <YAxis
                        stroke="var(--color-text-sub)"
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card-bg)/90",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          color: "var(--color-text-header)",
                          fontSize: window.innerWidth < 640 ? "10px" : "12px",
                        }}
                        formatter={(value) =>
                          `${value.toLocaleString()} ${TOKEN_NAME}`
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="rewards"
                        stroke={COLORS.secondary}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyChartMessage message="No reward projection available" />
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default function ParticipantsPage() {
  const {
    signer,
    walletConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
  } = useWallet();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalSold: 0,
    totalRaised: 0,
    participantCount: 0,
    presaleState: "NotStarted",
  });
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [filterOption, setFilterOption] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(12);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [hptDecimals, setHptDecimals] = useState(HPT_DECIMALS);
  const [usdtDecimals, setUsdtDecimals] = useState(USDT_DECIMALS);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadTime, setLoadTime] = useState(null);
  const [contract, setContract] = useState(null);

  // Cache utility
  const getCachedData = (key) => {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  };
  const setCachedData = (key, data, ttl = 5 * 60 * 1000) => {
    const cache = { data: serializeBigInt(data), expiry: Date.now() + ttl };
    localStorage.setItem(key, JSON.stringify(cache));
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!walletConnected || !signer) {
      setIsLoading(false);
      return;
    }

    const fetchStartTime = performance.now();
    setIsLoading(true);
    setFetchError(null);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_PROVIDER_URL);
      const presaleContractRead = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        provider
      );
      const presaleContractWrite = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      setContract(presaleContractWrite);

      // Owner check
      const owner = await presaleContractWrite
        .owner()
        .catch(() => ethers.ZeroAddress);
      setIsOwner(owner.toLowerCase() === walletAddress.toLowerCase());

      // Fetch token decimals
      const [hptTokenAddr, usdtTokenAddr] = await Promise.all([
        presaleContractRead.hptToken().catch(() => ethers.ZeroAddress),
        presaleContractRead.usdtToken().catch(() => ethers.ZeroAddress),
      ]);
      if (
        hptTokenAddr === ethers.ZeroAddress ||
        usdtTokenAddr === ethers.ZeroAddress
      ) {
        throw new Error("Invalid token addresses");
      }

      const hptToken = new ethers.Contract(
        hptTokenAddr,
        ["function decimals() view returns (uint8)"],
        provider
      );
      const usdtToken = new ethers.Contract(
        usdtTokenAddr,
        ["function decimals() view returns (uint8)"],
        provider
      );
      const [hptDec, usdtDec] = await Promise.all([
        hptToken.decimals().catch(() => HPT_DECIMALS),
        usdtToken.decimals().catch(() => USDT_DECIMALS),
      ]);
      console.log("Fetched decimals:", { hptDec, usdtDec });
      setHptDecimals(hptDec);
      setUsdtDecimals(usdtDec);

      // Fetch stats
      const [
        totalSoldRaw,
        totalRaisedRaw,
        participantCountRaw,
        presaleStateRaw,
      ] = await Promise.all([
        presaleContractRead.totalSold().catch(() => 0n),
        presaleContractRead.totalRaised().catch(() => 0n),
        presaleContractRead
          .getPresaleStats()
          .then((stats) => stats._participantCount)
          .catch(() => 0n),
        presaleContractRead.getCurrentPresaleState().catch(() => 0n),
      ]);

      const newStats = {
        totalSold: formatBigInt(totalSoldRaw, hptDec, "totalSold"),
        totalRaised: formatBigInt(totalRaisedRaw, usdtDec, "totalRaised"),
        participantCount: Number(participantCountRaw),
        presaleState: STATE_MAP[Number(presaleStateRaw)] || "Unknown",
      };
      console.log("Presale stats:", newStats);
      setStats(newStats);

      // Fetch participants
      const latestBlock = await provider.getBlockNumber();
      const startBlock = Number(import.meta.env.VITE_START_BLOCK) || 8403060;
      console.log("Start block from env:", startBlock);
      if (isNaN(startBlock) || startBlock < 0) {
        console.warn("Invalid start block, using 8403060");
        startBlock = 8403060;
      }
      const blockRange = 500; // Complies with RPC limit
      const addressMap = new Map();

      console.log(`Querying events from block ${startBlock} to ${latestBlock}`);
      for (
        let fromBlock = startBlock;
        fromBlock <= latestBlock;
        fromBlock += blockRange
      ) {
        const toBlock = Math.min(fromBlock + blockRange - 1, latestBlock);
        console.log(`Fetching events from ${fromBlock} to ${toBlock}`);
        const events = await presaleContractRead
          .queryFilter("PresalePurchase", fromBlock, toBlock)
          .catch((err) => {
            console.error(
              `Error querying events from ${fromBlock} to ${toBlock}:`,
              err
            );
            return [];
          });
        console.log(`Found ${events.length} events in ${fromBlock}-${toBlock}`);
        events.forEach((event) => {
          const addr = event.args.buyer;
          if (!addressMap.has(addr)) addressMap.set(addr, []);
          addressMap.get(addr).push(event);
        });
      }
      console.log("Address map:", [...addressMap.entries()]);

      const newParticipants = [];
      const addresses = [...addressMap.keys()];
      const batchSize = 10;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchData = await Promise.all(
          batch.map(async (addr) => {
            try {
              const [data, rewards, whitelisted, count] = await Promise.all([
                presaleContractRead.getParticipantData(addr).catch(() => ({
                  totalPurchased: 0n,
                  totalPayment: 0n,
                  totalClaimed: 0n,
                  participationCount: 0n,
                })),
                presaleContractRead.getEstimatedRewards(addr).catch(() => 0n),
                presaleContractRead.whitelisted(addr).catch(() => false),
                presaleContractRead.getParticipationCount(addr).catch(() => 0n),
              ]);

              console.log(`Raw data for ${addr}:`, {
                totalPurchased: data.totalPurchased.toString(),
                totalPayment: data.totalPayment.toString(),
                totalClaimed: data.totalClaimed.toString(),
                estimatedRewards: rewards.toString(),
                participationCount: count.toString(),
              });

              const participationCount = Number(count);
              let stakingSummary = "None";
              let totalClaimedFromDetails = 0;
              if (participationCount > 0) {
                const options = new Set();
                const details = await Promise.all(
                  Array.from({ length: participationCount }, (_, j) =>
                    presaleContractRead
                      .getParticipationDetails(addr, j)
                      .catch(() => ({
                        purchasedAmount: 0n,
                        paymentAmount: 0n,
                        claimedAmount: 0n,
                        stakingOption: 0n,
                        stakingEndTime: 0n,
                        stakingAPR: 0n,
                        lastRewardCalculationTime: 0n,
                      }))
                  )
                );
                details.forEach((detail, j) => {
                  console.log(`Raw detail ${j} for ${addr}:`, {
                    purchasedAmount: detail.purchasedAmount.toString(),
                    paymentAmount: detail.paymentAmount.toString(),
                    claimedAmount: detail.claimedAmount.toString(),
                    stakingOption: detail.stakingOption.toString(),
                  });
                  const claimedAmount = formatBigInt(
                    detail.claimedAmount,
                    hptDec,
                    `claimedAmount_${addr}_${j}`
                  );
                  totalClaimedFromDetails += claimedAmount;
                  const optionObj = STAKING_OPTIONS.find(
                    (opt) => opt.lockupSeconds === Number(detail.stakingOption)
                  );
                  const option = optionObj ? optionObj.name : "None";
                  options.add(option);
                });
                stakingSummary =
                  options.size === 1
                    ? [...options][0]
                    : `Multiple (${participationCount})`;
              }

              // Query RewardsClaimed events with limited block range
              const claimFilter =
                presaleContractRead.filters.RewardsClaimed(addr);
              let claimEvents = [];
              for (
                let fromBlock = startBlock;
                fromBlock <= latestBlock;
                fromBlock += blockRange
              ) {
                const toBlock = Math.min(
                  fromBlock + blockRange - 1,
                  latestBlock
                );
                const events = await presaleContractRead
                  .queryFilter(claimFilter, fromBlock, toBlock)
                  .catch((err) => {
                    console.error(
                      `Error querying RewardsClaimed from ${fromBlock} to ${toBlock}:`,
                      err
                    );
                    return [];
                  });
                claimEvents = claimEvents.concat(events);
              }
              const totalClaimedFromEvents = claimEvents.reduce(
                (sum, event) =>
                  sum +
                  formatBigInt(
                    event.args.amount,
                    hptDec,
                    `claimedEvent_${addr}`
                  ),
                0
              );

              const totalClaimedFromData = formatBigInt(
                data.totalClaimed,
                hptDec,
                `totalClaimed_${addr}`
              );
              const totalClaimed = Math.max(
                totalClaimedFromData,
                totalClaimedFromDetails,
                totalClaimedFromEvents
              );

              console.log(`Total claimed for ${addr}:`, {
                fromParticipantData: totalClaimedFromData,
                fromParticipationDetails: totalClaimedFromDetails,
                fromEvents: totalClaimedFromEvents,
                final: totalClaimed,
              });

              const participant = {
                address: addr,
                totalPurchased: formatBigInt(
                  data.totalPurchased,
                  hptDec,
                  `totalPurchased_${addr}`
                ),
                totalPayment: formatBigInt(
                  data.totalPayment,
                  usdtDec,
                  `totalPayment_${addr}`
                ),
                totalClaimed,
                estimatedRewards: formatBigInt(
                  rewards,
                  hptDec,
                  `estimatedRewards_${addr}`
                ),
                stakingSummary,
                whitelisted,
                participationCount,
              };
              console.log(`Participant object for ${addr}:`, participant);
              return participant;
            } catch (err) {
              console.error(`Error processing ${addr}:`, err);
              return null;
            }
          })
        );
        newParticipants.push(...batchData.filter((d) => d));
      }
      console.log("All participants:", newParticipants);
      setParticipants(newParticipants);

      setLastUpdated(new Date());
      setLoadTime(performance.now() - fetchStartTime);
    } catch (err) {
      console.error("Error fetching data:", err);
      setFetchError(`Failed to load participants: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [signer, walletConnected, walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Owner actions
  const updateWhitelist = useCallback(
    async (addresses, status) => {
      if (!signer) {
        toast.error("No signer available");
        return;
      }
      try {
        const presaleContract = new ethers.Contract(
          PRESALE_ADDRESS,
          PresaleABI,
          signer
        );
        const tx = await presaleContract.updateWhitelist(addresses, status);
        await tx.wait();
        toast.success(`Address ${status ? "whitelisted" : "removed"}`);
        fetchData();
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    },
    [signer, fetchData]
  );

  // Filtered and paginated participants
  const filterOptions = useMemo(() => {
    const options = [
      "All",
      ...STAKING_OPTIONS.map((opt) => opt.name),
      "Multiple",
    ];
    return options;
  }, []);

  const filteredParticipants = useMemo(() => {
    return participants.filter(
      (p) =>
        (!searchQuery ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterOption === "All" ||
          p.stakingSummary === filterOption ||
          (filterOption === "Multiple" &&
            p.stakingSummary.startsWith("Multiple")))
    );
  }, [participants, searchQuery, filterOption]);

  const paginatedParticipants = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredParticipants.slice(start, start + rowsPerPage);
  }, [filteredParticipants, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredParticipants.length / rowsPerPage);

  // Pagination buttons
  const getPaginationButtons = () => {
    const maxButtons = 5;
    const buttons = [];
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    return buttons;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
        <motion.div
          className="w-16 h-16 sm:w-12 sm:h-12 xs:w-10 xs:h-10 border-4 border-t-transparent border-[var(--color-accent-purple)] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
        <motion.div
          className="w-full max-w-md p-6 sm:p-4 xs:p-3 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-text-header)" }}
            className="mb-4 text-2xl sm:text-xl xs:text-lg font-bold text-center"
          >
            Connect Wallet
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-sm sm:text-xs xs:text-[10px] text-center"
          >
            Access the participants dashboard by connecting your wallet.
          </p>
          <motion.button
            onClick={connectWallet}
            className="w-full px-4 py-2 sm:px-3 sm:py-1.5 xs:px-2 xs:py-1 font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Connect Wallet"
          >
            Connect Wallet
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
        <motion.div
          className="w-full max-w-md p-6 sm:p-4 xs:p-3 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-4 text-2xl sm:text-xl xs:text-lg font-bold text-center"
          >
            Access Denied
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-sm sm:text-xs xs:text-[10px] text-center"
          >
            Only the contract owner can access this dashboard.
          </p>
          <motion.button
            onClick={disconnectWallet}
            className="w-full px-4 py-2 sm:px-3 sm:py-1.5 xs:px-2 xs:py-1 font-medium text-white rounded-full bg-gradient-to-r from-[#ef4444] to-[#f87171]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Disconnect Wallet"
          >
            Disconnect
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
        <motion.div
          className="w-full max-w-md p-6 sm:p-4 xs:p-3 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-4 text-2xl sm:text-xl xs:text-lg font-bold text-center"
          >
            Error
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-sm sm:text-xs xs:text-[10px] text-center"
          >
            {fetchError}
          </p>
          <motion.button
            onClick={fetchData}
            className="w-full px-4 py-2 sm:px-3 sm:py-1.5 xs:px-2 xs:py-1 font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Retry"
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="mx-auto space-y-6 w-full max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-var(--sidebar-width)-3rem)] lg:max-w-[calc(100vw-var(--sidebar-width)-4rem)]">
        {/* Header */}
        <motion.div
          className="flex flex-col justify-between gap-4 sm:flex-row sm:gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: `var(--color-text-header)` }}
          >
            Participants
          </h2>
        </motion.div>

        {/* Last Updated and Refresh */}
        <motion.div
          className="flex  justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center space-x-4 sm:space-x-3 xs:space-x-2">
            <span
              style={{ color: "var(--color-text-header)" }}
              className="text-sm sm:text-xs xs:text-[10px] font-semibold"
            >
              {lastUpdated
                ? `Last Updated: ${lastUpdated.toLocaleTimeString()} ${
                    loadTime ? `(${loadTime.toFixed(2)}ms)` : ""
                  }`
                : "Fetching Data..."}
            </span>
            <motion.button
              onClick={fetchData}
              className="p-2 sm:p-1.5 xs:p-1 rounded-full bg-[var(--color-bg-start)] border border-[var(--color-border)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              aria-label="Refresh Data"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 sm:w-4 sm:h-4 xs:w-3 xs:h-3 border-2 rounded-full border-t-transparent"
                  style={{ borderColor: COLORS.primary }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <RefreshCw
                  className="w-5 h-5 sm:w-4 sm:h-4 xs:w-3 xs:h-3"
                  style={{ color: COLORS.primary }}
                />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <StatsGrid stats={stats} />

        {/* Controls Panel */}
        {isOwner && (
          <motion.div
            className="p-6 sm:p-4 xs:p-3 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2
              style={{ color: "var(--color-text-header)" }}
              className="mb-3 sm:mb-2 xs:mb-1.5 text-lg sm:text-base xs:text-sm font-semibold"
            >
              Admin Controls
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label
                  style={{ color: "var(--color-text-sub)" }}
                  className="block text-[12px] sm:text-[12px] xs:text-[11px]"
                >
                  Whitelist Address
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="0x..."
                    className="flex-1 p-2 sm:p-1.5 xs:p-1 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[12px] sm:text-[12px] xs:text-[11px]"
                    onChange={(e) => setWhitelistAddress(e.target.value)}
                    value={whitelistAddress}
                    style={{ color: "var(--color-text-body)" }}
                  />
                  <motion.button
                    onClick={() => {
                      if (ethers.isAddress(whitelistAddress)) {
                        updateWhitelist([whitelistAddress], true);
                        setWhitelistAddress("");
                      } else {
                        toast.error("Invalid address");
                      }
                    }}
                    className={`p-2 sm:p-1.5 xs:p-1 rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] ${
                      !ethers.isAddress(whitelistAddress)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    whileHover={{
                      scale: ethers.isAddress(whitelistAddress) ? 1.1 : 1,
                    }}
                    whileTap={{
                      scale: ethers.isAddress(whitelistAddress) ? 0.9 : 1,
                    }}
                    disabled={!ethers.isAddress(whitelistAddress)}
                    title="Add to Whitelist"
                    aria-label="Add to Whitelist"
                  >
                    <PlusCircleIcon
                      className="w-4 h-4 sm:w-3.5 sm:h-3.5 xs:w-3 xs:h-3"
                      style={{ color: "#ffffff" }}
                    />
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (ethers.isAddress(whitelistAddress)) {
                        updateWhitelist([whitelistAddress], false);
                        setWhitelistAddress("");
                      } else {
                        toast.error("Invalid address");
                      }
                    }}
                    className={`p-2 sm:p-1.5 xs:p-1 rounded-lg bg-gradient-to-r from-[#ef4444] to-[#f87171] ${
                      !ethers.isAddress(whitelistAddress)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    whileHover={{
                      scale: ethers.isAddress(whitelistAddress) ? 1.1 : 1,
                    }}
                    whileTap={{
                      scale: ethers.isAddress(whitelistAddress) ? 0.9 : 1,
                    }}
                    disabled={!ethers.isAddress(whitelistAddress)}
                    title="Remove from Whitelist"
                    aria-label="Remove from Whitelist"
                  >
                    <TrashIcon
                      className="w-4 h-4 sm:w-3.5 sm:h-3.5 xs:w-3 xs:h-3"
                      style={{ color: "#ffffff" }}
                    />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Participants Table */}
        <motion.div
          className="rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-3 sm:p-2 xs:p-1">
            <div className="flex flex-col justify-between gap-3 mb-3 sm:mb-2 xs:mb-1 sm:flex-row sm:items-center">
              <h2
                style={{ color: "var(--color-text-header)" }}
                className="text-lg sm:text-base xs:text-sm font-semibold"
              >
                Participants
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 xs:gap-1">
                <div className="relative">
                  <SearchIcon
                    className="absolute w-4 h-4 sm:w-3.5 sm:h-3.5 xs:w-3 xs:h-3 -translate-y-1/2 left-2 top-1/2"
                    style={{ color: "var(--color-text-sub)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search by address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 sm:pl-7 xs:pl-6 pr-2 py-1 sm:py-0.75 xs:py-0.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] w-full sm:w-44 xs:w-32 text-[12px] sm:text-[12px] xs:text-[11px]"
                    style={{ color: "var(--color-text-body)" }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value)}
                    className="pl-2 sm:pl-1.5 xs:pl-1 pr-7 sm:pr-6 xs:pr-5 py-1 sm:py-0.75 xs:py-0.5 text-[12px] sm:text-[12px] xs:text-[11px] rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] w-full sm:w-32 xs:w-28 appearance-none"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    {filterOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "All"
                          ? "All Staking Options"
                          : option === "Multiple"
                          ? "Multiple Stakes"
                          : option}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    className="absolute w-4 h-4 sm:w-3.5 sm:h-3.5 xs:w-3 xs:h-3 -translate-y-1/2 pointer-events-none right-2 top-1/2"
                    style={{ color: "var(--color-text-sub)" }}
                  />
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <motion.div
                  className="w-8 h-8 sm:w-6 sm:h-6 xs:w-5 xs:h-5 border-2 rounded-full border-t-transparent"
                  style={{ borderColor: COLORS.primary }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : paginatedParticipants.length === 0 ? (
              <EmptyTableMessage message="No participants found" />
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead className="bg-[var(--color-card-bg)] border-b border-[var(--color-border)] sticky top-0 z-10">
                      <tr
                        style={{ color: "var(--color-text-sub)" }}
                        className="text-[12px] sm:text-[12px] xs:text-[11px]"
                      >
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[30%] min-w-[65px]">
                          Address
                        </th>
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[20%] min-w-[45px]">
                          Purchased
                        </th>
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[20%] min-w-[45px]">
                          Paid
                        </th>
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[20%] min-w-[45px] hidden sm:table-cell">
                          Claimed
                        </th>
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[20%] min-w-[45px] hidden md:table-cell">
                          Rewards
                        </th>
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[20%] min-w-[45px]">
                          Staking
                        </th>
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[10%] min-w-[35px] hidden sm:table-cell">
                          WL
                        </th>
                        <th className="p-1.5 sm:p-1 xs:p-0.5 font-medium max-w-[10%] min-w-[45px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedParticipants.map((p, index) => (
                        <motion.tr
                          key={p.address}
                          className={`border-t border-[var(--color-border)] hover:bg-[var(--color-border)]/10 transition-colors ${
                            index % 2 === 0
                              ? "bg-[var(--color-bg-start)]/80"
                              : "bg-[var(--color-bg-end)]/80"
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td
                            className="p-1.5 sm:p-1 xs:p-0.5"
                            style={{
                              color: "var(--color-text-header)",
                              wordBreak: "break-all",
                            }}
                          >
                            <span className="block truncate text-[12px] sm:text-[12px] xs:text-[11px]">
                              {p.address.slice(0, 6)}...{p.address.slice(-4)}
                            </span>
                          </td>
                          <td
                            className="p-1.5 sm:p-1 xs:p-0.5 font-medium"
                            style={{ color: "var(--color-text-header)" }}
                          >
                            <span className="text-[12px] sm:text-[12px] xs:text-[11px]">
                              {p.totalPurchased.toLocaleString()}
                            </span>
                          </td>
                          <td
                            className="p-1.5 sm:p-1 xs:p-0.5 font-medium"
                            style={{ color: "var(--color-text-header)" }}
                          >
                            <span className="text-[12px] sm:text-[12px] xs:text-[11px]">
                              {p.totalPayment.toLocaleString()}
                            </span>
                          </td>
                          <td
                            className="p-1.5 sm:p-1 xs:p-0.5 font-medium hidden sm:table-cell"
                            style={{ color: "var(--color-text-header)" }}
                          >
                            <span className="text-[12px] sm:text-[12px] xs:text-[11px]">
                              {p.totalClaimed.toLocaleString()}
                            </span>
                          </td>
                          <td
                            className="p-1.5 sm:p-1 xs:p-0.5 font-medium hidden md:table-cell"
                            style={{ color: "var(--color-text-header)" }}
                          >
                            <span className="text-[12px] sm:text-[12px] xs:text-[11px]">
                              {p.estimatedRewards.toLocaleString()}
                            </span>
                          </td>
                          <td
                            className="relative p-1.5 sm:p-1 xs:p-0.5 group"
                            style={{ color: "var(--color-text-body)" }}
                          >
                            <span className="text-[12px] sm:text-[12px] xs:text-[11px]">
                              {p.stakingSummary}
                            </span>
                            {p.participationCount > 1 && (
                              <div
                                className="absolute z-10 invisible p-1 text-[10px] sm:text-[10px] xs:text-[9px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 top-full mt-1 group-hover:visible group-hover:opacity-100 transition-opacity"
                                style={{ color: "var(--color-text-header)" }}
                              >
                                {p.stakingSummary} stakes
                              </div>
                            )}
                          </td>
                          <td
                            className="p-1.5 sm:p-1 xs:p-0.5 hidden sm:table-cell"
                            style={{ color: "var(--color-text-header)" }}
                          >
                            {p.whitelisted ? (
                              <CheckCircleIcon
                                className="w-3.5 h-3.5 sm:w-3 sm:h-3 xs:w-2.5 xs:h-2.5"
                                style={{ color: COLORS.success }}
                              />
                            ) : (
                              <BanIcon
                                className="w-3.5 h-3.5 sm:w-3 sm:h-3 xs:w-2.5 xs:h-2.5"
                                style={{ color: COLORS.danger }}
                              />
                            )}
                          </td>
                          <td className="p-1.5 sm:p-1 xs:p-0.5">
                            <motion.button
                              onClick={() => setSelectedParticipant(p)}
                              className="px-1.5 sm:px-1 xs:px-0.75 py-0.5 sm:py-0.5 xs:py-0.25 text-[12px] sm:text-[12px] xs:text-[11px] font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              aria-label={`View details for ${p.address}`}
                            >
                              Details
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 px-3 mt-3 sm:mt-2 xs:mt-1">
                    <motion.button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-1.5 sm:px-1 xs:px-0.75 py-0.5 sm:py-0.5 xs:py-0.25 text-[12px] sm:text-[12px] xs:text-[11px] font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Previous Page"
                    >
                      Previous
                    </motion.button>
                    {getPaginationButtons().map((p) => (
                      <motion.button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-6 h-6 sm:w-5.5 sm:h-5.5 xs:w-5 xs:h-5 flex items-center justify-center rounded-full text-[12px] sm:text-[12px] xs:text-[11px] ${
                          p === page
                            ? "bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] text-white"
                            : "bg-[var(--color-bg-start)] text-[var(--color-text-body)] hover:bg-[var(--color-border)]/20"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`Page ${p}`}
                      >
                        {p}
                      </motion.button>
                    ))}
                    <motion.button
                      onClick={() =>
                        setPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={page === totalPages}
                      className="px-1.5 sm:px-1 xs:px-0.75 py-0.5 sm:py-0.5 xs:py-0.25 text-[12px] sm:text-[12px] xs:text-[11px] font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Next Page"
                    >
                      Next
                    </motion.button>
                  </div>
                )}
                <div
                  className="mt-1 text-[12px] sm:text-[12px] xs:text-[11px] text-right px-3"
                  style={{ color: "var(--color-text-sub)" }}
                >
                  Showing {paginatedParticipants.length} of{" "}
                  {filteredParticipants.length} participants
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Participant Details Modal */}
        <AnimatePresence>
          {selectedParticipant && (
            <ParticipantDetails
              address={selectedParticipant.address}
              contract={contract}
              hptDecimals={hptDecimals}
              usdtDecimals={usdtDecimals}
              onClose={() => setSelectedParticipant(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

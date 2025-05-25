import { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/WalletContext";
import { useTheme } from "../AdminDashboardLayout";
import { NavLink } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  CashIcon,
  UserGroupIcon,
  ChartPieIcon,
  ClockIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  UsersIcon,
  BellIcon,
  CalendarIcon,
  ClockIcon as ClockIconOutline,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";
import { RefreshCw } from "lucide-react";
import PresaleABI from "../abi/presaleABI";

// Constants
const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#ef4444", "#f59e0b"];
const CHART_COLORS = {
  primary: "var(--color-accent-green)",
  secondary: "var(--color-accent-blue)",
  accent: "var(--color-accent-purple)",
  warning: "var(--color-accent-red)",
};
const STATE_MAP = ["NotStarted", "Active", "Ended", "ClaimOpen"];
const STATE_COLORS = {
  Active: "var(--color-accent-green, #22c55e)",
  NotStarted: "var(--color-accent-purple, #8b5cf6)",
  Ended: "var(--color-accent-red, #ef4444)",
  ClaimOpen: "var(--color-accent-blue, #3b82f6)",
  Unknown: "var(--color-text-sub, #6b7280)",
};

// Parse staking options
const STAKING_OPTIONS = JSON.parse(import.meta.env.VITE_STAKING_OPTIONS || '[]');
const STAKING_6_MONTH_SECONDS = STAKING_OPTIONS.find(opt => opt.name === "6-Month")?.lockupSeconds || 15552000;
const STAKING_12_MONTH_SECONDS = STAKING_OPTIONS.find(opt => opt.name === "12-Month")?.lockupSeconds || 31104000;

// Token names
const TOKEN_NAME = import.meta.env.VITE_TOKEN_NAME || "HPT";
const PAYMENT_TOKEN_NAME = import.meta.env.VITE_PAYMENT_TOKEN_NAME || "USDT";

// Helper to format dates
const formatDate = (timestamp) => {
  if (!timestamp || timestamp <= 0) return "Not Set";
  return new Date(timestamp * 1000).toLocaleDateString();
};

// Helper to serialize BigInt for JSON
const serializeBigInt = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

// Helper for empty chart message
const EmptyChartMessage = ({ message }) => (
  <div className="flex items-center justify-center h-full bg-[var(--color-bg-start)]/50 rounded-lg">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 text-center"
    >
      <ClockIconOutline
        className="w-8 h-8 mx-auto mb-2"
        style={{ color: "var(--color-text-sub)" }}
      />
      <p style={{ color: "var(--color-text-body)" }}>{message}</p>
    </motion.div>
  </div>
);

// Stats Grid Component
const StatsGrid = ({ stats }) => {
  const statItems = [
    {
      title: "Total Sold",
      value: `${stats.totalSold.toLocaleString()} ${TOKEN_NAME}`,
      icon: ChartPieIcon,
      color: CHART_COLORS.primary,
      textColor: "var(--color-text-header)",
      tooltip: `Total ${TOKEN_NAME} tokens sold`,
      isHighlighted: true,
    },
    {
      title: "Total Raised",
      value: `${stats.totalRaised.toLocaleString()} ${PAYMENT_TOKEN_NAME}`,
      icon: CashIcon,
      color: CHART_COLORS.secondary,
      textColor: "var(--color-accent-blue)",
      tooltip: `Total ${PAYMENT_TOKEN_NAME} raised`,
      isHighlighted: true,
    },
    {
      title: "Hard Cap",
      value: `${stats.hardCap.toLocaleString()} ${TOKEN_NAME}`,
      icon: ShieldCheckIcon,
      color: CHART_COLORS.accent,
      textColor: "var(--color-text-header)",
      tooltip: `Maximum ${TOKEN_NAME} tokens for sale`,
      isHighlighted: false,
    },
    {
      title: `${PAYMENT_TOKEN_NAME} Price`,
      value: `${stats.usdtPrice} ${PAYMENT_TOKEN_NAME}/${TOKEN_NAME}`,
      icon: CurrencyDollarIcon,
      color: CHART_COLORS.primary,
      textColor: "var(--color-text-header)",
      tooltip: `Price per ${TOKEN_NAME} in ${PAYMENT_TOKEN_NAME}`,
      isHighlighted: false,
    },
    {
      title: "Participants",
      value: stats.participantCount,
      icon: UsersIcon,
      color: CHART_COLORS.secondary,
      textColor: "var(--color-text-header)",
      tooltip: "Number of unique buyers",
      isHighlighted: false,
    },
    {
      title: "Presale State",
      value: stats.presaleState,
      icon: ClockIcon,
      color: STATE_COLORS[stats.presaleState] || STATE_COLORS.Unknown,
      textColor: STATE_COLORS[stats.presaleState] || STATE_COLORS.Unknown,
      tooltip: "Current presale status",
      isHighlighted: true,
    },
    {
      title: `${TOKEN_NAME} Balance`,
      value: `${stats.tokenBalance.toLocaleString()} ${TOKEN_NAME}`,
      icon: ShieldCheckIcon,
      color: CHART_COLORS.primary,
      textColor: "var(--color-text-header)",
      tooltip: `${TOKEN_NAME} in contract`,
      isHighlighted: false,
    },
    {
      title: `${PAYMENT_TOKEN_NAME} Balance`,
      value: `${stats.usdtBalance.toLocaleString()} ${PAYMENT_TOKEN_NAME}`,
      icon: CashIcon,
      color: CHART_COLORS.secondary,
      textColor: "var(--color-text-header)",
      tooltip: `${PAYMENT_TOKEN_NAME} in contract`,
      isHighlighted: true,
    },
    {
      title: "6-Month Staking",
      value: `${stats.staking6Months.toLocaleString()} ${TOKEN_NAME}`,
      icon: TrendingUpIcon,
      color: CHART_COLORS.accent,
      textColor: "var(--color-text-header)",
      tooltip: `${TOKEN_NAME} staked for 6 months`,
      isHighlighted: false,
    },
    {
      title: "12-Month Staking",
      value: `${stats.staking12Months.toLocaleString()} ${TOKEN_NAME}`,
      icon: TrendingUpIcon,
      color: CHART_COLORS.primary,
      textColor: "var(--color-text-header)",
      tooltip: `${TOKEN_NAME} staked for 12 months`,
      isHighlighted: false,
    },
    {
      title: "Avg. Purchase",
      value: `${stats.avgPurchase.toLocaleString()} ${PAYMENT_TOKEN_NAME}`,
      icon: CurrencyDollarIcon,
      color: CHART_COLORS.secondary,
      textColor: "var(--color-text-header)",
      tooltip: `Average ${PAYMENT_TOKEN_NAME} per buyer`,
      isHighlighted: false,
    },
    {
      title: "Unclaimed Rewards",
      value: `${stats.totalUnclaimedRewards.toLocaleString()} ${TOKEN_NAME}`,
      icon: TrendingUpIcon,
      color: CHART_COLORS.warning,
      textColor: "var(--color-text-header)",
      tooltip: "Pending staking rewards",
      isHighlighted: false,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {statItems.map((stat, index) => (
        <motion.div
          key={index}
          className={`relative flex items-center p-3 sm:p-4 rounded-xl ${
            stat.isHighlighted
              ? "bg-gradient-to-r from-[var(--color-bg-start)]/90 to-[var(--color-accent-blue)]/10 border-[var(--color-accent-blue)]"
              : "bg-[var(--color-card-bg)]/80 border-[var(--color-border)]"
          } backdrop-blur-lg hover:shadow-lg transition-shadow group`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.02 }}
        >
          <stat.icon
            className="flex-shrink-0 w-6 h-6 mr-3 sm:w-7 sm:h-7"
            style={{ color: stat.color }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2
              style={{ color: "var(--color-text-body)" }}
              className="text-sm font-medium truncate"
            >
              {stat.title}
            </h2>
            <p
              style={{ color: stat.textColor }}
              className={`font-semibold truncate ${
                stat.isHighlighted
                  ? "text-lg sm:text-xl"
                  : "text-base sm:text-lg"
              }`}
            >
              {stat.value}
            </p>
          </div>
          <div className="absolute z-10 invisible p-2 text-sm text-[var(--color-text-body)] bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg shadow-lg opacity-0 bottom-full left-1/2 transform -translate-x-1/2 mb-2 group-hover:visible group-hover:opacity-100 transition-opacity">
            {stat.tooltip}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Timeline Component
const Timeline = ({ stats }) => {
  const timelineItems = [
    {
      label: "Start Date",
      value: formatDate(stats.startTime),
      icon: CalendarIcon,
      isHighlighted: false,
      tooltip: "When the presale began",
    },
    {
      label: "End Date",
      value: formatDate(stats.endTime),
      icon: CalendarIcon,
      isHighlighted: true,
      tooltip: "When the presale ends",
    },
    {
      label: "Claim Starts",
      value: formatDate(
        stats.endTime && stats.claimPeriod > 0
          ? stats.endTime + stats.claimPeriod * 24 * 60 * 60
          : 0
      ),
      icon: ClockIcon,
      isHighlighted: true,
      tooltip: "When token claims begin",
    },
  ];

  const currentStage =
    stats.presaleState === "Active"
      ? "Start Date"
      : stats.presaleState === "Ended" || stats.presaleState === "ClaimOpen"
      ? "Claim Starts"
      : null;

  return (
    <motion.div
      className="p-4 sm:p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2
        style={{ color: "var(--color-text-header)" }}
        className="mb-4 text-xl font-semibold"
      >
        Presale Timeline
      </h2>
      {stats.startTime === 0 && stats.endTime === 0 ? (
        <p
          style={{ color: "var(--color-text-body)" }}
          className="text-base text-center"
        >
          Timeline data not available
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
          {timelineItems.map((item, index) => (
            <motion.div
              key={index}
              className={`relative p-3 md:p-4 min-h-[4rem] rounded-xl group ${
                item.isHighlighted
                  ? "bg-gradient-to-br from-[var(--color-bg-start)]/90 to-[var(--color-accent-blue)]/10 border-[var(--color-accent-blue)]"
                  : "bg-gradient-to-br from-[var(--color-bg-start)]/50 to-[var(--color-bg-end)]/50 border-[var(--color-border)]"
              } hover:shadow-md transition-shadow`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              aria-label={`${item.label}: ${item.value}`}
            >
              <div className="flex items-center">
                <item.icon
                  className="flex-shrink-0 w-6 h-6 mr-2 md:w-7 md:h-7"
                  style={{ color: CHART_COLORS.secondary }}
                  aria-hidden="true"
                />
                <p
                  style={{ color: "var(--color-text-sub)" }}
                  className="text-sm truncate"
                >
                  {item.label}
                </p>
                {item.label === currentStage && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium text-[var(--color-accent-green)] bg-[var(--color-accent-green)]/10 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1">
                {item.value === "Not Set" && (
                  <ExclamationCircleIcon
                    className="flex-shrink-0 w-5 h-5 mr-1"
                    style={{ color: "var(--color-accent-red)" }}
                    aria-hidden="true"
                  />
                )}
                <p
                  style={{
                    color:
                      item.value === "Not Set"
                        ? "var(--color-accent-red)"
                        : item.isHighlighted
                        ? "var(--color-accent-blue)"
                        : "var(--color-text-header)",
                  }}
                  className={`font-medium truncate ${
                    item.isHighlighted ? "text-base md:text-lg" : "text-base"
                  }`}
                >
                  {item.value}
                </p>
              </div>
              <div className="absolute z-20 invisible p-2 text-sm text-[var(--color-text-body)] bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg shadow-lg opacity-0 md:bottom-full md:left-1/2 md:transform md:-translate-x-1/2 md:mb-2 group-hover:visible group-hover:opacity-100 transition-opacity sm:group-hover:fixed sm:group-hover:bottom-auto sm:group-hover:top-1/2 sm:group-hover:left-1/2 sm:group-hover:-translate-y-1/2 sm:group-hover:-translate-x-1/2 sm:group-hover:backdrop-blur-sm">
                {item.tooltip}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Settings Card Component
const SettingsCard = ({ stats }) => (
  <motion.div
    className="p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
  >
    <h2
      style={{ color: "var(--color-text-header)" }}
      className="mb-4 text-xl font-semibold"
    >
      Contract Settings
    </h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        { label: "Min Purchase", value: `${stats.minPurchase} ${PAYMENT_TOKEN_NAME}` },
        { label: "Max Purchase", value: `${stats.maxPurchase} ${PAYMENT_TOKEN_NAME}` },
        { label: "User Hard Cap", value: `${stats.userHardCap} ${PAYMENT_TOKEN_NAME}` },
        { label: "Initial Unlock", value: `${stats.initialUnlockPercentage}%` },
        { label: "Claim Period", value: `${stats.claimPeriod} days` },
        {
          label: "Unlock per Period",
          value: `${stats.claimUnlockPercentage}%`,
        },
        {
          label: "Whitelist",
          value: stats.whitelistEnabled
            ? `${stats.whitelistedCount} users`
            : "Disabled",
        },
      ].map((item, index) => (
        <div
          key={index}
          className="p-4 rounded-lg bg-gradient-to-br from-[var(--color-bg-start)]/50 to-[var(--color-bg-end)]/50"
        >
          <p style={{ color: "var(--color-text-sub)" }} className="text-sm">
            {item.label}
          </p>
          <p
            style={{ color: "var(--color-text-header)" }}
            className="text-lg font-medium"
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  </motion.div>
);

// Activity Feed Component
const ActivityFeed = ({ activities }) => {
  console.log("All activities received:", activities);

  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const filteredActivities = useMemo(() => {
    if (filter === "All") return activities;
    return activities.filter((activity) => activity.type === filter);
  }, [activities, filter]);

  const paginatedActivities = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredActivities.slice(start, end);
  }, [filteredActivities, page]);

  const typeColors = {
    Purchase: "#10b981",
    "Reward Claim": "#34d399",
    "Token Claim": "#059669",
    default: "#10b981",
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMin = Math.floor(diffInMs / 60000);
    const diffInHrs = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMin < 60) {
      return `${diffInMin} min ago`;
    } else if (diffInHrs < 24) {
      return `${diffInHrs} hr ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  return (
    <motion.div
      className="p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex flex-col justify-between gap-3 mb-6 sm:flex-row sm:items-center">
        <h2
          style={{ color: "var(--color-text-header)" }}
          className="text-xl font-semibold"
        >
          Recent Activity
        </h2>
        <div className="relative inline-block">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="pl-4 pr-10 py-2 text-sm rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-emerald-500 appearance-none w-full sm:w-auto"
            style={{ color: "var(--color-text-body)" }}
          >
            <option value="All">All Activities</option>
            <option value="Purchase">Purchases</option>
            <option value="Reward Claim">Reward Claims</option>
            <option value="Token Claim">Token Claims</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 pointer-events-none">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <EmptyChartMessage message="No activity matches the selected filter" />
      ) : (
        <>
          <div className="overflow-y-auto max-h-[400px] pr-2 -mr-2">
            <ul className="space-y-3">
              {paginatedActivities.map((activity, index) => (
                <motion.li
                  key={`activity-${activity.timestamp}-${activity.details}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  className="flex items-start p-3 rounded-lg hover:bg-[var(--color-border)]/10 transition-colors duration-150"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 mr-3 flex-shrink-0"
                    style={{
                      backgroundColor:
                        typeColors[activity.type] || typeColors.default,
                    }}
                  ></div>
                  <div className="flex-grow">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-header)" }}
                      >
                        {activity.type}
                      </span>
                      <span
                        className="text-xs opacity-70"
                        style={{ color: "var(--color-text-body)" }}
                      >
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      {activity.details}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between mt-4">
              <motion.button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Previous
              </motion.button>
              <span style={{ color: "var(--color-text-body)" }}>
                Page {page} of {totalPages}
              </span>
              <motion.button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Next
              </motion.button>
            </div>
          )}
        </>
      )}

      <div
        className="mt-4 text-xs text-right"
        style={{ color: "var(--color-text-sub)" }}
      >
        Showing {paginatedActivities.length} of{" "}
        {filter === "All"
          ? activities.length
          : activities.filter((a) => a.type === filter).length}{" "}
        activities
      </div>
    </motion.div>
  );
};

// Main Component
export default function AdminOverview() {
  const {
    signer,
    walletConnected,
    connectWallet,
    disconnectWallet,
    walletAddress,
  } = useWallet();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalSold: 0,
    totalRaised: 0,
    hardCap: 0,
    usdtPrice: 0,
    participantCount: 0,
    presaleState: "NotStarted",
    tokenBalance: 0,
    usdtBalance: 0,
    staking6Months: 0,
    staking12Months: 0,
    startTime: 0,
    endTime: 0,
    claimPeriod: 0,
    initialUnlockPercentage: 0,
    claimUnlockPercentage: 0,
    paused: false,
    whitelistEnabled: false,
    whitelistedCount: 0,
    totalUnclaimedRewards: 0,
    totalClaimedRewards: 0,
    hptToken: "",
    usdtToken: "",
    minPurchase: 0,
    maxPurchase: 0,
    userHardCap: 0,
    avgPurchase: 0,
    alerts: [],
  });
  const [chartData, setChartData] = useState([]);
  const [tokenDistribution, setTokenDistribution] = useState([]);
  const [rewardClaims, setRewardClaims] = useState([]);
  const [vestingSchedule, setVestingSchedule] = useState([]);
  const [activities, setActivities] = useState([]);
  const [hptDecimals, setHptDecimals] = useState(Number(import.meta.env.VITE_HPT_DECIMALS) || 18);
  const [usdtDecimals, setUsdtDecimals] = useState(Number(import.meta.env.VITE_USDT_DECIMALS) || 6);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadTime, setLoadTime] = useState(null);

  const getCachedData = (key) => {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  };
  const setCachedData = (key, data, ttl = 5 * 60 * 1000) => {
    const cache = { data: serializeBigInt(data), expiry: Date.now() + ttl };
    localStorage.setItem(key, JSON.stringify(cache));
  };

  const fetchData = useCallback(async () => {
    if (!walletConnected || !signer) {
      setIsLoading(false);
      return;
    }

    // Validate environment variables
    const requiredEnvVars = [
      "VITE_PRESALE_CONTRACT_ADDRESS",
      "VITE_HPT_DECIMALS",
      "VITE_USDT_DECIMALS",
      "VITE_TOKEN_NAME",
      "VITE_PAYMENT_TOKEN_NAME",
      "VITE_STAKING_OPTIONS",
      "VITE_SECONDS_PER_MONTH"
    ];
    const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName]);
    if (missingVars.length > 0) {
      setFetchError(`Missing environment variables: ${missingVars.join(", ")}`);
      setIsLoading(false);
      return;
    }

    const fetchStartTime = performance.now();
    setIsLoading(true);
    setFetchError(null);

    try {
      const contract = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, signer);

      const owner = await contract.owner().catch(() => ethers.ZeroAddress);
      setIsOwner(owner.toLowerCase() === walletAddress.toLowerCase());

      const cacheKey = `presale_data_${walletAddress}`;
      const cached = getCachedData(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        console.log("Using cached data");
        setStats(cached.data.stats);
        setChartData(cached.data.chartData);
        setTokenDistribution(cached.data.tokenDistribution);
        setRewardClaims(cached.data.rewardClaims);
        setVestingSchedule(cached.data.vestingSchedule);
        setActivities(cached.data.activities);
        setHptDecimals(cached.data.hptDecimals);
        setUsdtDecimals(cached.data.usdtDecimals);
        setLastUpdated(new Date());
        setIsLoading(false);
        setLoadTime(performance.now() - fetchStartTime);
        return;
      }

      const [hptTokenAddr, usdtTokenAddr] = await Promise.all([
        contract.hptToken().catch(() => ethers.ZeroAddress),
        contract.usdtToken().catch(() => ethers.ZeroAddress),
      ]);

      const hptToken = new ethers.Contract(
        hptTokenAddr,
        [
          "function decimals() view returns (uint8)",
          "function balanceOf(address) view returns (uint256)",
        ],
        signer
      );
      const usdtToken = new ethers.Contract(
        usdtTokenAddr,
        [
          "function decimals() view returns (uint8)",
          "function balanceOf(address) view returns (uint256)",
        ],
        signer
      );

      const [hptDec, usdtDec] = await Promise.all([
        hptToken.decimals().catch(() => Number(import.meta.env.VITE_HPT_DECIMALS)),
        usdtToken.decimals().catch(() => Number(import.meta.env.VITE_USDT_DECIMALS)),
      ]);
      setHptDecimals(hptDec);
      setUsdtDecimals(usdtDec);

      const [
        totalSoldRaw,
        totalRaisedRaw,
        hardCapRaw,
        startTimeRaw,
        endTimeRaw,
        participantCountRaw,
        presaleStateRaw,
        usdtPriceRaw,
        minPurchaseRaw,
        maxPurchaseRaw,
        userHardCapRaw,
        initialUnlockPercentageRaw,
        claimPeriodRaw,
        claimUnlockPercentageRaw,
        pausedRaw,
        whitelistEnabledRaw,
        tokenBalanceRaw,
        usdtBalanceRaw,
      ] = await Promise.all([
        contract.totalSold().catch(() => 0n),
        contract.totalRaised().catch(() => 0n),
        contract.hardCap().catch(() => 0n),
        contract.startTime().catch(() => 0n),
        contract.endTime().catch(() => 0n),
        contract
          .getPresaleStats()
          .then((stats) => stats._participantCount)
          .catch(() => 0n),
        contract.getCurrentPresaleState().catch(() => 0n),
        contract.usdtPrice().catch(() => 0n),
        contract.minPurchase().catch(() => 0n),
        contract.maxPurchase().catch(() => 0n),
        contract.userHardCap().catch(() => 0n),
        contract.initialUnlockPercentage().catch(() => 20n),
        contract.claimPeriod().catch(() => 2 * Number(import.meta.env.VITE_SECONDS_PER_MONTH)),
        contract.claimUnlockPercentage().catch(() => 20n),
        contract.paused().catch(() => false),
        contract.whitelistEnabled().catch(() => false),
        hptToken.balanceOf(PRESALE_ADDRESS).catch(() => 0n),
        usdtToken.balanceOf(PRESALE_ADDRESS).catch(() => 0n),
      ]);

      const totalSold = Number(ethers.formatUnits(totalSoldRaw, hptDec));
      const totalRaised = Number(ethers.formatUnits(totalRaisedRaw, usdtDec));
      const hardCap = Number(ethers.formatUnits(hardCapRaw, hptDec));
      const startTime = Number(startTimeRaw);
      const endTime = Number(endTimeRaw);
      const participantCount = Number(participantCountRaw);
      const presaleState = STATE_MAP[Number(presaleStateRaw)] || "Unknown";
      const usdtPrice = Number(ethers.formatUnits(usdtPriceRaw, usdtDec));
      const minPurchase = Number(ethers.formatUnits(minPurchaseRaw, usdtDec));
      const maxPurchase = Number(ethers.formatUnits(maxPurchaseRaw, usdtDec));
      const userHardCap = Number(ethers.formatUnits(userHardCapRaw, usdtDec));
      const initialUnlockPercentage = Number(initialUnlockPercentageRaw);
      const claimPeriod = Number(claimPeriodRaw) / (24 * 60 * 60);
      const claimUnlockPercentage = Number(claimUnlockPercentageRaw);
      const paused = Boolean(pausedRaw);
      const whitelistEnabled = Boolean(whitelistEnabledRaw);
      const tokenBalance = Number(ethers.formatUnits(tokenBalanceRaw, hptDec));
      const usdtBalance = Number(ethers.formatUnits(usdtBalanceRaw, usdtDec));
      const avgPurchase =
        participantCount > 0 ? totalRaised / participantCount : 0;

      const alerts = [];
      if (tokenBalance < totalSold * 0.1)
        alerts.push(`Low ${TOKEN_NAME} balance: Claims or rewards may fail.`);
      if (hardCap && totalSold / hardCap > 0.9)
        alerts.push("Approaching hard cap: Prepare for presale end.");
      if (paused) alerts.push("Contract is paused.");
      if (startTime === 0 || endTime === 0)
        alerts.push("Invalid timeline: Check contract initialization.");
      if (presaleState === "Unknown")
        alerts.push("Unknown presale state: Verify contract logic.");

      console.log("Fetching events...");
      const latestBlock = await signer.provider.getBlockNumber();
      const startBlock = 8403060;
      const blockRange = 5000;
      const allPurchaseEvents = [];
      const allRewardEvents = [];
      const allClaimEvents = [];
      const allWhitelistEvents = [];

      for (
        let fromBlock = startBlock;
        fromBlock <= latestBlock;
        fromBlock += blockRange
      ) {
        const toBlock = Math.min(fromBlock + blockRange - 1, latestBlock);
        const [purchaseEvents, rewardEvents, claimEvents, whitelistEvents] =
          await Promise.all([
            contract
              .queryFilter("PresalePurchase", fromBlock, toBlock)
              .catch((err) => {
                console.error(
                  `Error fetching PresalePurchase from ${fromBlock} to ${toBlock}:`,
                  err
                );
                return [];
              }),
            contract
              .queryFilter("RewardsClaimed", fromBlock, toBlock)
              .catch((err) => {
                console.error(
                  `Error fetching RewardsClaimed from ${fromBlock} to ${toBlock}:`,
                  err
                );
                return [];
              }),
            contract
              .queryFilter("TokensClaimed", fromBlock, toBlock)
              .catch((err) => {
                console.error(
                  `Error fetching TokensClaimed from ${fromBlock} to ${toBlock}:`,
                  err
                );
                return [];
              }),
            contract
              .queryFilter("WhitelistUpdated", fromBlock, toBlock)
              .catch((err) => {
                console.error(
                  `Error fetching WhitelistUpdated from ${fromBlock} to ${toBlock}:`,
                  err
                );
                return [];
              }),
          ]);

        allPurchaseEvents.push(...purchaseEvents);
        allRewardEvents.push(...rewardEvents);
        allClaimEvents.push(...claimEvents);
        allWhitelistEvents.push(...whitelistEvents);
      }

      const uniqueEvents = (events) => {
        const seen = new Set();
        return events.filter((event) => {
          const key = `${event.transactionHash}-${event.logIndex}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      const uniquePurchaseEvents = uniqueEvents(allPurchaseEvents);
      const uniqueRewardEvents = uniqueEvents(allRewardEvents);
      const uniqueClaimEvents = uniqueEvents(allClaimEvents);
      const uniqueWhitelistEvents = uniqueEvents(allWhitelistEvents);

      let staking6Months = 0;
      let staking12Months = 0;
      for (const event of uniquePurchaseEvents) {
        const stakingOption = Number(event.args?.stakingOption || 0);
        const tokenAmount = Number(
          ethers.formatUnits(event.args?.tokenAmount || 0, hptDec)
        );
        if (stakingOption === STAKING_6_MONTH_SECONDS)
          staking6Months += tokenAmount;
        if (stakingOption === STAKING_12_MONTH_SECONDS)
          staking12Months += tokenAmount;
      }

      const whitelistedAddresses = new Set(
        uniqueWhitelistEvents
          .filter((e) => e.args?.status)
          .map((e) => e.args?.user)
      );
      const whitelistedCount = whitelistedAddresses.size;

      const totalClaimedRewards = uniqueRewardEvents.reduce(
        (sum, e) =>
          sum + Number(ethers.formatUnits(e.args?.amount || 0, hptDec)),
        0
      );
      let totalUnclaimedRewards = 0;
      const participants = [
        ...new Set(uniquePurchaseEvents.map((e) => e.args?.buyer)),
      ].slice(0, 5);
      for (const participant of participants) {
        totalUnclaimedRewards += Number(
          ethers.formatUnits(
            await contract.getEstimatedRewards(participant).catch(() => 0n),
            hptDec
          )
        );
      }

      const monthlyData = {};
      for (const event of uniquePurchaseEvents) {
        const block = await signer.provider
          .getBlock(event.blockNumber)
          .catch(() => ({ timestamp: Date.now() / 1000 }));
        const date = new Date(block.timestamp * 1000);
        const month = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        if (!monthlyData[month])
          monthlyData[month] = {
            purchases: 0,
            usdt: 0,
            participants: new Set(),
          };
        monthlyData[month].purchases += Number(
          ethers.formatUnits(event.args?.tokenAmount || 0, hptDec)
        );
        monthlyData[month].usdt += Number(
          ethers.formatUnits(event.args?.paymentAmount || 0, usdtDec)
        );
        monthlyData[month].participants.add(event.args?.buyer);
      }
      const chartData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        purchases: data.purchases,
        usdt: data.usdt,
        participants: data.participants.size,
      }));

      const tokenDistribution = [
        { name: "Sold (6-month)", value: staking6Months },
        { name: "Sold (12-month)", value: staking12Months },
        { name: "Unsold", value: Math.max(hardCap - totalSold, 0) },
        { name: "Rewards Reserve", value: totalUnclaimedRewards },
      ].filter((d) => d.value > 0);

      const rewardClaimsData = {};
      for (const event of uniqueRewardEvents) {
        const block = await signer.provider
          .getBlock(event.blockNumber)
          .catch(() => ({ timestamp: Date.now() / 1000 }));
        const date = new Date(block.timestamp * 1000);
        const month = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        if (!rewardClaimsData[month]) rewardClaimsData[month] = 0;
        rewardClaimsData[month] += Number(
          ethers.formatUnits(event.args?.amount || 0, hptDec)
        );
      }
      const rewardClaims = Object.entries(rewardClaimsData).map(
        ([month, amount]) => ({ month, amount })
      );

      const vestingData = [];
      if (endTime > 0) {
        const claimStart = endTime + claimPeriod * 24 * 60 * 60;
        let totalUnlocked = Number(initialUnlockPercentage);
        vestingData.push({
          time: formatDate(endTime),
          unlocked: totalUnlocked,
        });
        for (let i = 1; i <= 4; i++) {
          totalUnlocked += Number(claimUnlockPercentage);
          vestingData.push({
            time: formatDate(claimStart + i * claimPeriod * 24 * 60 * 60),
            unlocked: Math.min(totalUnlocked, 100),
          });
        }
      }

      const blockNumbers = [
        ...new Set([
          ...uniquePurchaseEvents.map((e) => e.blockNumber),
          ...uniqueRewardEvents.map((e) => e.blockNumber),
          ...uniqueClaimEvents.map((e) => e.blockNumber),
        ]),
      ];
      const blockTimestamps = {};
      await Promise.all(
        blockNumbers.map(async (blockNumber) => {
          const block = await signer.provider
            .getBlock(blockNumber)
            .catch(() => ({ timestamp: Date.now() / 1000 }));
          blockTimestamps[blockNumber] = block.timestamp;
        })
      );

      const activities = [
        ...uniquePurchaseEvents.map((e) => ({
          type: "Purchase",
          details: `${Number(
            ethers.formatUnits(e.args?.tokenAmount || 0, hptDec)
          ).toLocaleString()} ${TOKEN_NAME} by ${e.args?.buyer.slice(0, 6)}...`,
          timestamp: blockTimestamps[e.blockNumber] || Date.now() / 1000,
        })),
        ...uniqueRewardEvents.map((e) => ({
          type: "Reward Claim",
          details: `${Number(
            ethers.formatUnits(e.args?.amount || 0, hptDec)
          ).toLocaleString()} ${TOKEN_NAME} by ${e.args?.staker.slice(0, 6)}...`,
          timestamp: blockTimestamps[e.blockNumber] || Date.now() / 1000,
        })),
        ...uniqueClaimEvents.map((e) => ({
          type: "Token Claim",
          details: `${Number(
            ethers.formatUnits(e.args?.amount || 0, hptDec)
          ).toLocaleString()} ${TOKEN_NAME} by ${e.args?.buyer.slice(0, 6)}...`,
          timestamp: blockTimestamps[e.blockNumber] || Date.now() / 1000,
        })),
      ].sort((a, b) => b.timestamp - a.timestamp);

      const newStats = {
        totalSold,
        totalRaised,
        hardCap,
        usdtPrice,
        participantCount,
        presaleState,
        tokenBalance,
        usdtBalance,
        staking6Months,
        staking12Months,
        startTime,
        endTime,
        claimPeriod,
        initialUnlockPercentage,
        claimUnlockPercentage,
        paused,
        whitelistEnabled,
        whitelistedCount,
        totalUnclaimedRewards,
        totalClaimedRewards,
        hptToken: hptTokenAddr,
        usdtToken: usdtTokenAddr,
        minPurchase,
        maxPurchase,
        userHardCap,
        avgPurchase,
        alerts,
      };
      setStats(newStats);
      setChartData(chartData);
      setTokenDistribution(tokenDistribution);
      setRewardClaims(rewardClaims);
      setVestingSchedule(vestingData);
      setActivities(activities);
      setLastUpdated(new Date());

      setCachedData(cacheKey, {
        stats: newStats,
        chartData,
        tokenDistribution,
        rewardClaims,
        vestingSchedule,
        activities,
        hptDecimals: hptDec,
        usdtDecimals: usdtDec,
      });

      const fetchEndTime = performance.now();
      setLoadTime(fetchEndTime - fetchStartTime);
      console.log(`Data fetch completed in ${fetchEndTime - fetchStartTime}ms`);
    } catch (err) {
      console.error("Error fetching data:", err);
      setFetchError(
        `Failed to load presale data: ${err.message}. Please check your network or contract deployment.`
      );
    } finally {
      setIsLoading(false);
    }
  }, [signer, walletConnected, walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const purchaseTrendsData = useMemo(() => chartData, [chartData]);
  const stakingBreakdownData = useMemo(
    () => [
      {
        name: "6 Months (70% APR)",
        staked: stats.staking6Months,
        rewards: (stats.staking6Months * 0.7) / 2,
      },
      {
        name: "12 Months (150% APR)",
        staked: stats.staking12Months,
        rewards: stats.staking12Months * 1.5,
      },
    ],
    [stats.staking6Months, stats.staking12Months]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
        <motion.div
          className="w-16 h-16 border-4 border-t-transparent border-[var(--color-accent-purple)] rounded-full"
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
          className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-text-header)" }}
            className="mb-4 text-3xl font-bold text-center"
          >
            Connect Wallet
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-lg text-center"
          >
            Access the admin dashboard by connecting your wallet.
          </p>
          <motion.button
            onClick={connectWallet}
            className="w-full px-6 py-3 font-semibold text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-4 text-3xl font-bold text-center"
          >
            Access Denied
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-lg text-center"
          >
            Only the contract owner can access this dashboard.
          </p>
          <motion.button
            onClick={disconnectWallet}
            className="w-full px-6 py-3 font-semibold text-white rounded-full bg-gradient-to-r from-[#ef4444] to-[#f87171] hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-4 text-3xl font-bold text-center"
          >
            Error
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-lg text-center"
          >
            {fetchError}
          </p>
          <motion.button
            onClick={fetchData}
            className="w-full px-6 py-3 font-semibold text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto space-y-8 max-w-7xl">
        <motion.div
          className="flex flex-col items-center justify-between sm:flex-row"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: `var(--color-text-header)` }}
          >
            Dashboard
          </h2>
        </motion.div>
        <AnimatePresence>
          {stats.alerts.length > 0 && (
            <motion.div
              className="p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-accent-red)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center">
                <BellIcon
                  className="w-6 h-6 mr-3"
                  style={{ color: "var(--color-accent-red)" }}
                />
                <h2
                  style={{ color: "var(--color-text-header)" }}
                  className="text-xl font-semibold"
                >
                  Critical Alerts
                </h2>
              </div>
              <ul className="mt-4 space-y-2">
                {stats.alerts.map((alert, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center"
                  >
                    <span className="w-2 h-2 bg-[var(--color-accent-red)] rounded-full mr-2"></span>
                    <p style={{ color: "var(--color-text-body)" }}>{alert}</p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          className="p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2
            style={{ color: "var(--color-text-header)" }}
            className="mb-4 text-xl font-semibold"
          >
            Presale Progress
          </h2>
          <div className="relative w-full h-6 overflow-hidden rounded-full bg-gray-200/30">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--color-accent-green)] to-[var(--color-accent-blue)]"
              initial={{ width: 0 }}
              animate={{
                width: `${(stats.totalSold / (stats.hardCap || 1)) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mt-2 text-sm"
          >
            {((stats.totalSold / (stats.hardCap || 1)) * 100).toFixed(2)}% of
            Hard Cap ({stats.totalSold.toLocaleString()} /{" "}
            {(stats.hardCap || 0).toLocaleString()} {TOKEN_NAME})
          </p>
        </motion.div>
        <motion.div
          className="flex items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center space-x-4">
            <span
              style={{ color: "var(--color-text-header)" }}
              className="text-sm xs:text-xs font-semibold"
            >
              {lastUpdated
                ? `Last Updated: ${lastUpdated.toLocaleTimeString()} ${
                    loadTime ? `(${loadTime.toFixed(2)}ms)` : ""
                  }`
                : "Fetching Data..."}
            </span>
            <motion.button
              onClick={fetchData}
              className="p-2 xs:p-1.5 rounded-full bg-[var(--color-bg-start)] border border-[var(--color-border)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              aria-label="Refresh Data"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 rounded-full xs:w-4 xs:h-4 border-t-transparent"
                  style={{ borderColor: "var(--color-accent-blue)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <RefreshCw
                  className="w-5 h-5 xs:w-4 xs:h-4"
                  style={{ color: "var(--color-accent-blue)" }}
                />
              )}
            </motion.button>
          </div>
        </motion.div>
        <StatsGrid stats={stats} />
        <Timeline stats={stats} />
        <SettingsCard stats={stats} />
        <ActivityFeed activities={activities} />
        <div className="space-y-8">
          <motion.div
            className="p-4 rounded-lg bg-[var(--color-card-bg)]/60 border border-[var(--color-border)] transition-shadow hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2
              style={{ color: "var(--color-text-header)" }}
              className="mb-4 text-xl font-semibold"
            >
              Purchase Trends
            </h2>
            {purchaseTrendsData.length === 0 ? (
              <EmptyChartMessage message="No purchase data available yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart
                  data={purchaseTrendsData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="tokensGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="usdtGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="participantsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#888" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#888" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="month"
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickLine={false}
                    axisLine={{ stroke: "#888" }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card-bg)",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      color: "var(--color-text-body)",
                      backdropFilter: "blur(4px)",
                    }}
                    formatter={(value, name) => {
                      const formattedValue = Number(value).toLocaleString();
                      if (name === "Tokens Purchased")
                        return [
                          `${formattedValue} ${TOKEN_NAME}`,
                          `${TOKEN_NAME} Bought`,
                        ];
                      if (name === "USDT Raised")
                        return [
                          `${formattedValue} ${PAYMENT_TOKEN_NAME}`,
                          `${PAYMENT_TOKEN_NAME} Spent`,
                        ];
                      return [`${formattedValue}`, "Participants"];
                    }}
                    itemStyle={{ fontWeight: 500 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "var(--color-text-body)",
                      fontSize: 12,
                      paddingTop: 10,
                    }}
                  />
                  {stats.endTime && (
                    <ReferenceLine
                      yAxisId="left"
                      x={new Date(stats.endTime * 1000).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                      stroke="#eab308"
                      strokeDasharray="3 3"
                      label={{
                        value: "Presale End",
                        position: "top",
                        fill: "#eab308",
                        fontSize: 12,
                      }}
                    />
                  )}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="purchases"
                    stroke="#3b82f6"
                    fill="url(#tokensGradient)"
                    strokeWidth={2}
                    name="Tokens Purchased"
                    activeDot={{
                      r: 8,
                      fill: "#3b82f6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    animationDuration={1000}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="usdt"
                    stroke="#9333ea"
                    fill="url(#usdtGradient)"
                    strokeWidth={2}
                    name={`${PAYMENT_TOKEN_NAME} Raised`}
                    activeDot={{
                      r: 8,
                      fill: "#9333ea",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    animationDuration={1000}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="participants"
                    stroke="#888"
                    fill="url(#participantsGradient)"
                    strokeWidth={2}
                    name="Participants"
                    activeDot={{
                      r: 8,
                      fill: "#888",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>
          <motion.div
            className="p-4 rounded-lg bg-[var(--color-card-bg)]/50 border border-[var(--color-border)] transition-shadow hover:shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2
              style={{ color: "var(--color-text-header)" }}
              className="mb-4 text-xl font-semibold"
            >
              Token Distribution
            </h2>
            {tokenDistribution.length === 0 ? (
              <EmptyChartMessage message="No tokens distributed yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <PieChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                  <Pie
                    data={tokenDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={
                      typeof window !== "undefined" && window.innerWidth < 640
                        ? 80
                        : 100
                    }
                    innerRadius={
                      typeof window !== "undefined" && window.innerWidth < 640
                        ? 50
                        : 60
                    }
                    paddingAngle={3}
                    cornerRadius={6}
                    label={false}
                    labelLine={false}
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {tokenDistribution.map((entry, index) => {
                      const colors = [
                        "#3b82f6",
                        "#9333ea",
                        "#888",
                        "#eab308",
                        "#10b981",
                      ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                          stroke="#fff"
                          strokeWidth={1.5}
                          style={{
                            transition: "transform 0.2s ease",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.transform = "scale(1.02)")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.transform = "scale(1)")
                          }
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card-bg)",
                      opacity: 0.9,
                      border: "1px solid #444",
                      borderRadius: "10px",
                      backdropFilter: "blur(6px)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                      padding: "10px 14px",
                    }}
                    formatter={(value, name) => {
                      const total = tokenDistribution.reduce(
                        (acc, item) => acc + item.value,
                        0
                      );
                      const percent = ((value / total) * 100).toFixed(1);
                      return [
                        `${Number(
                          value
                        ).toLocaleString()} ${TOKEN_NAME} (${percent}%)`,
                        name,
                      ];
                    }}
                    itemStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 600,
                    }}
                    labelStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 700,
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "var(--color-text-body)",
                      fontSize: 12,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
          <motion.div
            className="p-4 rounded-lg bg-[var(--color-card-bg)]/40 border border-[var(--color-border)] transition-shadow hover:shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h2
              style={{ color: "var(--color-text-header)" }}
              className="mb-4 text-xl font-semibold"
            >
              Staking Breakdown
            </h2>
            {stakingBreakdownData.every(
              (d) => d.staked === 0 && d.rewards === 0
            ) ? (
              <EmptyChartMessage message="No staking activity yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart
                  data={stakingBreakdownData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                  layout="vertical"
                  barCategoryGap={stakingBreakdownData.length > 2 ? 8 : 12}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#444"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    type="number"
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: `${TOKEN_NAME} Amount`,
                      position: "insideBottom",
                      offset: -10,
                      style: {
                        fill: "var(--color-text-body)",
                        fontSize: 12,
                        fontWeight: 500,
                      },
                    }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                    width={
                      typeof window !== "undefined" && window.innerWidth < 640
                        ? 80
                        : 100
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card-bg)",
                      opacity: 0.95,
                      border: "1px solid #444",
                      borderRadius: "12px",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                      padding: "12px 16px",
                      borderImage: "linear-gradient(to right, #444, #666) 1",
                    }}
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} ${TOKEN_NAME}`,
                      name === "Principal" ? "Principal" : "Projected Rewards",
                    ]}
                    itemStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 700,
                    }}
                    labelStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 800,
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.1)" }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "var(--color-text-body)",
                      fontSize: 12,
                      fontWeight: 500,
                      paddingTop: 10,
                      paddingBottom: 10,
                      lineHeight: "1.5",
                    }}
                    iconType="square"
                    iconSize={8}
                    formatter={(value) => (
                      <span
                        style={{
                          color: "var(--color-text-body)",
                          transition: "opacity 0.2s",
                        }}
                      >
                        {value === "Principal"
                          ? "Principal"
                          : "Projected Rewards"}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="staked"
                    stackId="a"
                    fill="#3b82f6"
                    name="Principal"
                    radius={4}
                    stroke="#fff"
                    strokeWidth={0.5}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    style={{ transition: "transform 0.3s ease" }}
                    onMouseEnter={(e) =>
                      e.target && (e.target.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      e.target && (e.target.style.transform = "scale(1)")
                    }
                  >
                    <defs>
                      <linearGradient
                        id="stakedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <Bar fill="url(#stakedGradient)" />
                  </Bar>
                  <Bar
                    dataKey="rewards"
                    stackId="a"
                    fill="#9333ea"
                    name="Projected Rewards"
                    radius={4}
                    stroke="#fff"
                    strokeWidth={0.5}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    style={{ transition: "transform 0.3s ease" }}
                    onMouseEnter={(e) =>
                      e.target && (e.target.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      e.target && (e.target.style.transform = "scale(1)")
                    }
                  >
                    <defs>
                      <linearGradient
                        id="rewardsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#9333ea"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#9333ea"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <Bar fill="url(#rewardsGradient)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
          <motion.div
            className="p-4 rounded-lg bg-[var(--color-card-bg)]/30 border border-[var(--color-border)] transition-shadow hover:shadow-lg"
            style={{ borderImage: "linear-gradient(to right, #444, #666) 1" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <h2
              style={{ color: "var(--color-text-header)" }}
              className="mb-4 text-xl font-semibold"
            >
              Reward Claims Over Time
            </h2>
            {rewardClaims.length === 0 ? (
              <EmptyChartMessage message="No rewards claimed yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <LineChart
                  data={rewardClaims}
                  margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                >
                  <defs>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
                    </linearGradient>
                    <filter id="lineGlow">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0.23  0 0 0 0 0.51  0 0 0 0 0.96  0 0 0 0.3 0"
                      />
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#444"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickLine={false}
                    axisLine={{ stroke: "#888" }}
                    label={{
                      value: "Month",
                      position: "insideBottom",
                      offset: -10,
                      style: {
                        fill: "var(--color-text-body)",
                        fontSize: 12,
                        fontWeight: 500,
                      },
                    }}
                  />
                  <YAxis
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: `${TOKEN_NAME} Claimed`,
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: {
                        fill: "var(--color-text-body)",
                        fontSize: 12,
                        fontWeight: 500,
                      },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card-bg)",
                      opacity: 0.95,
                      border: "1px solid #444",
                      borderRadius: "12px",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                      padding: "12px 16px",
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} ${TOKEN_NAME}`,
                      "Claimed Rewards",
                    ]}
                    itemStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 700,
                    }}
                    labelStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 800,
                    }}
                    cursor={{ stroke: "#444", strokeWidth: 1 }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "var(--color-text-body)",
                      fontSize: 12,
                      fontWeight: 500,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                    iconType="circle"
                    iconSize={8}
                    formatter={() => (
                      <span style={{ color: "var(--color-text-body)" }}>
                        Claimed Rewards
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#3b82f6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    filter="url(#lineGlow)"
                    animationDuration={1200}
                    animationEasing="ease-out"
                    name="Claimed Rewards"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
          {/* <motion.div
            className="p-4 rounded-lg bg-[var(--color-card-bg)]/20 border border-[var(--color-border)] transition-shadow hover:shadow-lg"
            style={{ borderImage: "linear-gradient(to right, #444, #666) 1" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <h2
              style={{ color: "var(--color-text-header)" }}
              className="mb-4 text-xl font-semibold"
            >
              Vesting Schedule
            </h2>
            {vestingSchedule.length === 0 ? (
              <EmptyChartMessage message="No vesting schedule available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <LineChart
                  data={vestingSchedule}
                  margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                >
                  <defs>
                    <linearGradient
                      id="vestingGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#eab308" stopOpacity={1} />
                      <stop offset="100%" stopColor="#facc15" stopOpacity={1} />
                    </linearGradient>
                    <filter id="vestingGlow">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0.92  0 0 0 0 0.69  0 0 0 0 0.08  0 0 0 0.3 0"
                      />
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#444"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    tickLine={false}
                    axisLine={{ stroke: "#888" }}
                    label={{
                      value: "Date",
                      position: "insideBottom",
                      offset: -10,
                      style: {
                        fill: "var(--color-text-body)",
                        fontSize: 12,
                        fontWeight: 500,
                      },
                    }}
                  />
                  <YAxis
                    stroke="#888"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "% Unlocked",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: {
                        fill: "var(--color-text-body)",
                        fontSize: 12,
                        fontWeight: 500,
                      },
                    }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card-bg)",
                      opacity: 0.95,
                      border: "1px solid #444",
                      borderRadius: "12px",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                      padding: "12px 16px",
                    }}
                    formatter={(value) => [`${value}%`, "Unlocked"]}
                    itemStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 700,
                    }}
                    labelStyle={{
                      color: "var(--color-text-header, #d1d5db)",
                      fontWeight: 800,
                    }}
                    cursor={{ stroke: "#444", strokeWidth: 1 }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "var(--color-text-body)",
                      fontSize: 12,
                      fontWeight: 500,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                    iconType="circle"
                    iconSize={8}
                    formatter={() => (
                      <span style={{ color: "var(--color-text-body)" }}>
                        Unlocked Percentage
                      </span>
                    )}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="unlocked"
                    stroke="url(#vestingGradient)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#eab308",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    filter="url(#vestingGlow)"
                    animationDuration={1200}
                    animationEasing="ease-out"
                    name="Unlocked Percentage"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div> */}
        </div>
      </div>
    </div>
  );
    }
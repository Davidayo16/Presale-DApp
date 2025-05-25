import { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/WalletContext";
import { useTheme } from "../AdminDashboardLayout";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import PresaleABI from "../abi/presaleABI";
import { toast } from "react-hot-toast";
import {
  CashIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  UsersIcon,
} from "@heroicons/react/outline";
import { RefreshCw } from "lucide-react";

const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const CHART_COLORS = {
  primary: "var(--color-accent-green)",
  secondary: "var(--color-accent-blue)",
  warning: "var(--color-accent-red)",
};

const serializeBigInt = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

const formatDate = (timestamp) => {
  if (!timestamp || timestamp <= 0) return "Not Set";
  return new Date(timestamp * 1000).toLocaleDateString();
};

const EmptyChartMessage = ({ message }) => (
  <div className="flex items-center justify-center h-full bg-[var(--color-card-bg)]/50 rounded-lg">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 text-center"
    >
      <ExclamationCircleIcon
        className="w-8 h-8 mx-auto mb-2"
        style={{ color: "var(--color-text-sub)" }}
      />
      <p style={{ color: "var(--color-text-body)" }}>{message}</p>
    </motion.div>
  </div>
);

const StatsGrid = ({ balances, totalRaised, totalSold, participantCount }) => {
  const statItems = [
    {
      title: `${import.meta.env.VITE_TOKEN_NAME} Balance`,
      value: `${balances.hpt.toLocaleString()} ${
        import.meta.env.VITE_TOKEN_NAME
      }`,
      icon: ShieldCheckIcon,
      color: CHART_COLORS.primary,
      tooltip: `${import.meta.env.VITE_TOKEN_NAME} tokens in contract`,
    },
    {
      title: `${import.meta.env.VITE_PAYMENT_TOKEN_NAME} Balance`,
      value: `${balances.usdt.toLocaleString()} ${
        import.meta.env.VITE_PAYMENT_TOKEN_NAME
      }`,
      icon: CashIcon,
      color: CHART_COLORS.secondary,
      tooltip: `${import.meta.env.VITE_PAYMENT_TOKEN_NAME} in contract`,
    },
    {
      title: "Total Raised",
      value: `${totalRaised.toLocaleString()} ${
        import.meta.env.VITE_PAYMENT_TOKEN_NAME
      }`,
      icon: ArrowUpIcon,
      color: CHART_COLORS.secondary,
      tooltip: `Total ${import.meta.env.VITE_PAYMENT_TOKEN_NAME} raised`,
    },
    {
      title: "Participants",
      value: `${Number(participantCount) || 0} Users`,
      icon: UsersIcon,
      color: CHART_COLORS.primary,
      tooltip: "Number of unique participants",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat, index) => (
        <motion.div
          key={index}
          className="relative p-4 rounded-xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)] hover:shadow-lg transition-shadow group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.02 }}
        >
          <stat.icon
            className="w-6 h-6 mr-3"
            style={{ color: stat.color }}
            aria-hidden="true"
          />
          <div>
            <h2
              style={{ color: "var(--color-text-sub)" }}
              className="text-sm font-medium"
            >
              {stat.title}
            </h2>
            <p
              style={{ color: "var(--color-text-header)" }}
              className="text-lg font-semibold"
            >
              {stat.value}
            </p>
          </div>
          <div
            style={{
              color: "var(--color-text-body)",
              backgroundColor: "var(--color-card-bg)",
              borderColor: "var(--color-border)",
            }}
            className="absolute z-10 invisible p-2 text-sm bg-[var(--color-card-bg)]/90 border rounded-lg shadow-lg opacity-0 bottom-full left-1/2 transform -translate-x-1/2 mb-2 group-hover:visible group-hover:opacity-100 transition-opacity"
          >
            {stat.tooltip}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const WithdrawalForm = ({
  balances,
  presaleState,
  endTime,
  handleWithdraw,
  isSubmitting,
}) => {
  const [showConfirm, setShowConfirm] = useState(null);
  const [addresses, setAddresses] = useState({
    withdrawRaisedFunds: "",
    emergencyWithdrawTokens: "",
    emergencyWithdrawPaymentTokens: "",
  });

  const canWithdrawRaisedFunds = presaleState === 2 || presaleState === 3;
  const canEmergencyWithdrawTokens =
    presaleState === 2 ||
    Date.now() / 1000 >
      endTime + 30 * Number(import.meta.env.VITE_SECONDS_PER_DAY);

  const withdrawalOptions = [
    {
      type: "withdrawRaisedFunds",
      label: `Withdraw Raised ${import.meta.env.VITE_PAYMENT_TOKEN_NAME}`,
      available: balances.usdt,
      unit: import.meta.env.VITE_PAYMENT_TOKEN_NAME,
      disabled: !canWithdrawRaisedFunds || balances.usdt === 0,
      description: `Withdraw all ${
        import.meta.env.VITE_PAYMENT_TOKEN_NAME
      } when presale is Ended or ClaimOpen`,
    },
    {
      type: "emergencyWithdrawTokens",
      label: `Emergency Withdraw ${import.meta.env.VITE_TOKEN_NAME}`,
      available: balances.hpt,
      unit: import.meta.env.VITE_TOKEN_NAME,
      disabled: !canEmergencyWithdrawTokens || balances.hpt === 0,
      description: `Withdraw all ${
        import.meta.env.VITE_TOKEN_NAME
      } when presale is Ended or 30 days after end`,
    },
    {
      type: "emergencyWithdrawPaymentTokens",
      label: `Emergency Withdraw ${import.meta.env.VITE_PAYMENT_TOKEN_NAME}`,
      available: balances.usdt,
      unit: import.meta.env.VITE_PAYMENT_TOKEN_NAME,
      disabled: balances.usdt === 0,
      description: `Withdraw all ${
        import.meta.env.VITE_PAYMENT_TOKEN_NAME
      } at any time (emergency)`,
    },
  ];

  const isValidAddress = (address) => {
    return ethers.isAddress(address);
  };

  const handleAddressChange = (type, value) => {
    setAddresses((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  return (
    <motion.div
      className="p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2
        style={{ color: "var(--color-text-header)" }}
        className="mb-4 text-xl font-semibold"
      >
        Fund Withdrawals
      </h2>
      <div className="space-y-6">
        {withdrawalOptions.map((option) => (
          <div
            key={option.type}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[var(--color-bg-start)]/50 rounded-lg"
          >
            <div className="flex-1">
              <label
                style={{ color: "var(--color-text-sub)" }}
                className="block text-sm font-medium"
              >
                {option.label} ({option.available.toLocaleString()}{" "}
                {option.unit})
              </label>
              <p
                style={{ color: "var(--color-text-sub)" }}
                className="mt-1 text-xs"
              >
                {option.description}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Recipient Address (0x...)"
                value={addresses[option.type]}
                onChange={(e) =>
                  handleAddressChange(option.type, e.target.value)
                }
                className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
                style={{ color: "var(--color-text-body)" }}
              />
              <motion.button
                onClick={() => {
                  if (!isValidAddress(addresses[option.type])) {
                    toast.error("Invalid recipient address");
                    return;
                  }
                  setShowConfirm({
                    type: option.type,
                    to: addresses[option.type],
                  });
                }}
                className="w-full sm:w-auto px-4 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSubmitting || option.disabled}
              >
                Withdraw
              </motion.button>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="p-6 rounded-2xl bg-[var(--color-card-bg)]/90 backdrop-blur-lg border border-[var(--color-border)] max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3
                style={{ color: "var(--color-text-header)" }}
                className="text-lg font-semibold"
              >
                Confirm Withdrawal
              </h3>
              <p style={{ color: "var(--color-text-body)" }} className="mt-2">
                {
                  withdrawalOptions.find((opt) => opt.type === showConfirm.type)
                    ?.label
                }
                :{" "}
                {withdrawalOptions
                  .find((opt) => opt.type === showConfirm.type)
                  ?.available.toLocaleString()}{" "}
                {
                  withdrawalOptions.find((opt) => opt.type === showConfirm.type)
                    ?.unit
                }{" "}
                to {showConfirm.to}?
              </p>
              <div className="flex justify-end mt-4 space-x-2">
                <motion.button
                  onClick={() => setShowConfirm(null)}
                  className="px-4 py-2 font-medium rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)]"
                  style={{ color: "var(--color-text-body)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    handleWithdraw(showConfirm.type, showConfirm.to);
                    setShowConfirm(null);
                    setAddresses((prev) => ({
                      ...prev,
                      [showConfirm.type]: "",
                    }));
                  }}
                  className="px-4 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Confirm"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TransactionsTable = ({ transactions, title, isLoading }) => {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = useMemo(() => {
    if (filter === "All") return transactions;
    return transactions.filter((tx) => tx.type === filter);
  }, [transactions, filter]);

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, page]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <motion.div
      className="p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
        <h2
          style={{ color: "var(--color-text-header)" }}
          className="text-lg sm:text-base xs:text-sm font-semibold"
        >
          {title}
        </h2>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="mt-2 sm:mt-0 px-4 py-2 text-sm rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
          style={{ color: "var(--color-text-body)" }}
        >
          <option value="All">All Transactions</option>
          <option value="PresalePurchase">Purchases</option>
          <option value="EmergencyWithdrawPayment">
            Emergency {import.meta.env.VITE_PAYMENT_TOKEN_NAME} Withdrawals
          </option>
          <option value="TokensClaimed">Tokens Claimed</option>
          <option value="RewardsClaimed">Rewards Claimed</option>
        </select>
      </div>
      <p style={{ color: "var(--color-text-sub)" }} className="mb-4 text-sm">
        Showing all recorded contract events (purchases, withdrawals, claims).
      </p>
      {isLoading ? (
        <div
          style={{ color: "var(--color-text-body)" }}
          className="text-center"
        >
          Loading...
        </div>
      ) : paginatedTransactions.length === 0 ? (
        <EmptyChartMessage message="No transactions available" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  style={{ color: "var(--color-text-sub)" }}
                  className="border-b border-[var(--color-border)]"
                >
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-start)]/50"
                  >
                    <td
                      style={{ color: "var(--color-text-body)" }}
                      className="p-3"
                    >
                      {tx.type?.replace(/([A-Z])/g, " $1").trim() || "Unknown"}
                    </td>
                    <td
                      style={{ color: "var(--color-text-body)" }}
                      className="p-3"
                    >
                      {tx.amount?.toLocaleString() || "N/A"} {tx.unit}
                    </td>
                    <td
                      style={{ color: "var(--color-text-body)" }}
                      className="p-3"
                    >
                      {tx.address
                        ? `${tx.address.slice(0, 6)}...${tx.address.slice(-4)}`
                        : "N/A"}
                    </td>
                    <td
                      style={{ color: "var(--color-text-body)" }}
                      className="p-3"
                    >
                      {tx.timestamp ? formatDate(tx.timestamp / 1000) : "N/A"}
                    </td>
                    <td className="p-3">
                      {tx.txHash ? (
                        <a
                          href={`${import.meta.env.VITE_EXPLORER_URL}${
                            tx.txHash
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: "var(--color-accent-blue)" }}
                        >
                          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <motion.button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] disabled:opacity-50"
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
                className="px-4 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Next
              </motion.button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const FundManagementPage = () => {
  const {
    signer,
    walletConnected,
    walletAddress,
    disconnectWallet,
    connectWallet,
  } = useWallet();
  const { theme } = useTheme();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balances, setBalances] = useState({ hpt: 0, usdt: 0 });
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [presaleState, setPresaleState] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [inflows, setInflows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [hptDecimals, setHptDecimals] = useState(
    Number(import.meta.env.VITE_HPT_DECIMALS)
  );
  const [usdtDecimals, setUsdtDecimals] = useState(
    Number(import.meta.env.VITE_USDT_DECIMALS)
  );
  const [participantCount, setParticipantCount] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getCachedData = (key) => {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  };

  const setCachedData = (key, data, ttl = 5 * 60 * 1000) => {
    const cache = { data: serializeBigInt(data), expiry: Date.now() + ttl };
    localStorage.setItem(key, JSON.stringify(cache));
  };

  const fetchFundData = useCallback(async () => {
    console.log("fetchFundData: Starting execution");
    if (!signer || !walletConnected) {
      console.warn("fetchFundData: Signer or wallet not connected");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);

    try {
      console.log("fetchFundData: Initializing contract");
      const contract = new ethers.Contract(PRESALE_ADDRESS, PresaleABI, signer);
      console.log("Contract initialized at:", PRESALE_ADDRESS);

      console.log("fetchFundData: Fetching owner");
      const owner = await contract.owner();
      console.log("Contract owner:", owner);
      setIsOwner(walletAddress.toLowerCase() === owner.toLowerCase());

      const cacheKey = `fund_data_${walletAddress}`;
      console.log("fetchFundData: Checking cache");
      const cached = getCachedData(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        console.log("Using cached data:", cached.data);
        setBalances(cached.data.balances);
        setTotalRaised(cached.data.totalRaised);
        setTotalSold(cached.data.totalSold);
        setPresaleState(cached.data.presaleState);
        setEndTime(cached.data.endTime);
        setInflows(cached.data.inflows);
        setTransactions(cached.data.transactions);
        setHptDecimals(Number(cached.data.hptDecimals));
        setUsdtDecimals(Number(cached.data.usdtDecimals));
        setParticipantCount(Number(cached.data.participantCount) || 0);
        setLastUpdated(new Date());
        setIsLoading(false);
        return;
      }

      console.log("fetchFundData: Fetching token addresses");
      const [hptTokenAddr, usdtTokenAddr] = await Promise.all([
        contract.hptToken(),
        contract.usdtToken(),
      ]);
      console.log(
        "HPT Token Address:",
        hptTokenAddr,
        "USDT Token Address:",
        usdtTokenAddr
      );

      console.log("fetchFundData: Initializing token contracts");
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

      console.log("fetchFundData: Fetching contract data");
      const [
        hptDec,
        usdtDec,
        hptBal,
        usdtBal,
        totalRaisedRaw,
        totalSoldRaw,
        state,
        end,
      ] = await Promise.all([
        hptToken
          .decimals()
          .catch(() => Number(import.meta.env.VITE_HPT_DECIMALS)),
        usdtToken
          .decimals()
          .catch(() => Number(import.meta.env.VITE_USDT_DECIMALS)),
        hptToken.balanceOf(PRESALE_ADDRESS),
        usdtToken.balanceOf(PRESALE_ADDRESS),
        contract.totalRaised(),
        contract.totalSold(),
        contract.getCurrentPresaleState().catch(() => 0),
        contract.endTime().catch(() => 0),
      ]);

      console.log("fetchFundData: Raw fetched values:", {
        hptDec,
        usdtDec,
        hptBal: hptBal.toString(),
        usdtBal: usdtBal.toString(),
        totalRaisedRaw: totalRaisedRaw.toString(),
        totalSoldRaw: totalSoldRaw.toString(),
        state,
        end,
      });

      setHptDecimals(Number(hptDec));
      setUsdtDecimals(Number(usdtDec));
      const formattedBalances = {
        hpt: Number(ethers.formatUnits(hptBal, hptDec)),
        usdt: Number(ethers.formatUnits(usdtBal, usdtDec)),
      };
      const formattedTotalRaised = Number(
        ethers.formatUnits(totalRaisedRaw, usdtDec)
      );
      const formattedTotalSold = Number(
        ethers.formatUnits(totalSoldRaw, hptDec)
      );
      console.log("fetchFundData: Formatted values:", {
        balances: formattedBalances,
        totalRaised: formattedTotalRaised,
        totalSold: formattedTotalSold,
      });

      setBalances(formattedBalances);
      setTotalRaised(formattedTotalRaised);
      setTotalSold(formattedTotalSold);
      setPresaleState(Number(state));
      setEndTime(Number(end));

      console.log("fetchFundData: Fetching events");
      let inflowData = [];
      let transactionData = [];
      let participants = 0;
      try {
        const presaleFilter = contract.filters.PresalePurchase(null);
        const withdrawFilter = contract.filters.EmergencyWithdrawPayment(null);
        const tokenClaimFilter = contract.filters.TokensClaimed(null);
        const rewardFilter = contract.filters.RewardsClaimed(null);

        const START_BLOCK = 0;
        const latestBlock = await signer.provider.getBlockNumber();
        const [presaleEvents, withdrawEvents, tokenClaimEvents, rewardEvents] =
          await Promise.all([
            contract.queryFilter(presaleFilter, START_BLOCK, latestBlock),
            contract.queryFilter(withdrawFilter, START_BLOCK, latestBlock),
            contract.queryFilter(tokenClaimFilter, START_BLOCK, latestBlock),
            contract.queryFilter(rewardFilter, START_BLOCK, latestBlock),
          ]);

        console.log("Fetched events:", {
          presaleEvents: presaleEvents.length,
          withdrawEvents: withdrawEvents.length,
          tokenClaimEvents: tokenClaimEvents.length,
          rewardEvents: rewardEvents.length,
        });

        console.log("fetchFundData: Processing participant count from events");
        const uniqueBuyers = [
          ...new Set(
            presaleEvents.map((event) => {
              console.log("PresalePurchase event:", {
                buyer: event.args.buyer,
                txHash: event.transactionHash,
              });
              return event.args.buyer;
            })
          ),
        ];
        participants = uniqueBuyers.length;
        console.log(
          "ParticipantCount from events:",
          participants,
          "Unique buyers:",
          uniqueBuyers
        );

        try {
          console.log("fetchFundData: Fetching presale stats");
          const stats = await contract.getPresaleStats();
          console.log("Presale stats:", stats);
          const statsParticipants = stats.participantCount
            ? Number(stats.participantCount) || 0
            : 0;
          console.log(
            "ParticipantCount from getPresaleStats:",
            statsParticipants
          );
          if (statsParticipants > participants) {
            participants = statsParticipants;
            console.log(
              "Using getPresaleStats participantCount as it’s higher:",
              participants
            );
          } else if (statsParticipants < participants) {
            console.warn(
              "getPresaleStats returned lower participantCount than events:",
              statsParticipants
            );
          }
        } catch (err) {
          console.error("fetchFundData: Error fetching presale stats:", err);
          console.log(
            "fetchFundData: Relying on event-based participant count"
          );
        }
        setParticipantCount(participants);

        const allEvents = [
          ...presaleEvents,
          ...withdrawEvents,
          ...tokenClaimEvents,
          ...rewardEvents,
        ];
        const blockNumbers = [
          ...new Set(allEvents.map((event) => event.blockNumber)),
        ];

        const blockTimestamps = {};
        await Promise.all(
          blockNumbers.map(async (blockNumber) => {
            const cachedTimestamp = localStorage.getItem(
              `block_timestamp_${blockNumber}`
            );
            if (cachedTimestamp) {
              blockTimestamps[blockNumber] = Number(cachedTimestamp);
            } else {
              const block = await signer.provider.getBlock(blockNumber);
              blockTimestamps[blockNumber] = block.timestamp;
              localStorage.setItem(
                `block_timestamp_${blockNumber}`,
                block.timestamp
              );
            }
          })
        );

        const processEvents = (
          events,
          type,
          amountField,
          decimals,
          unit,
          addressField
        ) => {
          return events
            .map((event) => {
              try {
                console.log(`Processing ${type}:`, {
                  transactionHash: event.transactionHash,
                  args: event.args,
                });
                return {
                  type,
                  amount: Number(
                    ethers.formatUnits(event.args[amountField], decimals)
                  ),
                  unit,
                  address: event.args[addressField],
                  timestamp: blockTimestamps[event.blockNumber] * 1000,
                  txHash: event.transactionHash,
                };
              } catch (err) {
                console.error(`Error processing ${type}:`, err);
                return null;
              }
            })
            .filter((tx) => tx !== null);
        };

        const presaleTransactions = processEvents(
          presaleEvents,
          "PresalePurchase",
          "paymentAmount",
          usdtDec,
          import.meta.env.VITE_PAYMENT_TOKEN_NAME,
          "buyer"
        );
        const withdrawTransactions = processEvents(
          withdrawEvents,
          "EmergencyWithdrawPayment",
          "amount",
          usdtDec,
          import.meta.env.VITE_PAYMENT_TOKEN_NAME,
          "to"
        );
        const tokenClaimTransactions = processEvents(
          tokenClaimEvents,
          "TokensClaimed",
          "amount",
          hptDec,
          import.meta.env.VITE_TOKEN_NAME,
          "buyer"
        );
        const rewardTransactions = processEvents(
          rewardEvents,
          "RewardsClaimed",
          "amount",
          hptDec,
          import.meta.env.VITE_TOKEN_NAME,
          "staker"
        );

        transactionData = [
          ...presaleTransactions,
          ...withdrawTransactions,
          ...tokenClaimTransactions,
          ...rewardTransactions,
        ].sort((a, b) => b.timestamp - a.timestamp);

        inflowData = presaleTransactions.map(({ timestamp, amount }) => ({
          timestamp,
          usdt: amount,
        }));

        console.log("Inflow data:", inflowData);
        console.log("Transaction data:", transactionData);
      } catch (err) {
        console.error("fetchFundData: Error fetching events:", err);
      }

      setInflows(inflowData);
      setTransactions(transactionData);

      console.log("fetchFundData: Caching data");
      setCachedData(cacheKey, {
        balances: formattedBalances,
        totalRaised: formattedTotalRaised,
        totalSold: formattedTotalSold,
        presaleState: Number(state),
        endTime: Number(end),
        inflows: inflowData,
        transactions: transactionData,
        hptDecimals: Number(hptDec),
        usdtDecimals: Number(usdtDec),
        participantCount: participants,
      });
      setLastUpdated(new Date());
      console.log("fetchFundData: Completed successfully");
    } catch (err) {
      console.error("fetchFundData: Global error:", err);
      setFetchError(`Failed to load fund data: ${err.message}`);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
      console.log("fetchFundData: Finished execution");
    }
  }, [signer, walletConnected, walletAddress]);

  const handleWithdraw = useCallback(
    async (action, toAddress) => {
      if (!signer || !isOwner) return;
      setIsSubmitting(true);
      try {
        const contract = new ethers.Contract(
          PRESALE_ADDRESS,
          PresaleABI,
          signer
        );
        let tx;
        if (action === "withdrawRaisedFunds") {
          tx = await contract.withdrawRaisedFunds(toAddress, {
            gasLimit: 100000,
          });
        } else if (action === "emergencyWithdrawTokens") {
          tx = await contract.emergencyWithdrawTokens(toAddress, {
            gasLimit: 100000,
          });
        } else if (action === "emergencyWithdrawPaymentTokens") {
          tx = await contract.emergencyWithdrawPaymentTokens(toAddress, {
            gasLimit: 100000,
          });
        }
        await tx.wait();
        toast.success(
          `Withdrawal successful to ${toAddress.slice(
            0,
            6
          )}...${toAddress.slice(-4)}`
        );
        await fetchFundData();
      } catch (err) {
        toast.error(`Withdrawal failed: ${err.reason || err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [signer, isOwner, fetchFundData]
  );

  useEffect(() => {
    fetchFundData();
  }, [fetchFundData]);

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)] p-4">
        <motion.div
          className="w-full max-w-md p-8 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)] shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-text-header)" }}
            className="mb-4 text-2xl font-bold text-center"
          >
            Connect Wallet
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-center"
          >
            Connect your wallet to access the admin dashboard.
          </p>
          <motion.button
            onClick={connectWallet}
            className="w-full px-6 py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] hover:shadow-lg"
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)] p-4">
        <motion.div
          className="w-full max-w-md p-8 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)] shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-4 text-2xl font-bold text-center"
          >
            Access Denied
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-center"
          >
            Only the contract owner can access this dashboard.
          </p>
          <motion.button
            onClick={disconnectWallet}
            className="w-full px-6 py-3 font-semibold text-white rounded-lg bg-[var(--color-accent-red)] hover:shadow-lg"
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)] p-4">
        <motion.div
          className="w-full max-w-md p-8 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)] shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-4 text-2xl font-bold text-center"
          >
            Error
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-6 text-center"
          >
            {fetchError}
          </p>
          <motion.button
            onClick={fetchFundData}
            className="w-full px-6 py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] hover:shadow-lg"
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
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          className="flex flex-col sm:flex-row justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            style={{ color: "var(--color-text-header)" }}
            className="text-2xl sm:text-3xl font-bold"
          >
            Fund Management
          </h1>
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
              className="text-sm font-semibold"
            >
              {lastUpdated
                ? `Last Updated: ${lastUpdated.toLocaleString()}`
                : "Fetching Data..."}
            </span>
            <motion.button
              onClick={fetchFundData}
              className="p-2 xs:p-1.5 rounded-full bg-[var(--color-bg-start)] border border-[var(--color-border)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              aria-label="Refresh Data"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 rounded-full xs:w-4 xs:h-4 border-t-transparent"
                  style={{ borderColor: CHART_COLORS.secondary }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <RefreshCw
                  className="w-5 h-5 xs:w-4 xs:h-4"
                  style={{ color: CHART_COLORS.secondary }}
                />
              )}
            </motion.button>
          </div>
        </motion.div>

        <StatsGrid
          balances={balances}
          totalRaised={totalRaised}
          totalSold={totalSold}
          participantCount={participantCount}
        />

        <motion.div
          className="p-6 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2
            style={{ color: "var(--color-text-header)" }}
            className="mb-4 text-xl font-semibold"
          >
            {import.meta.env.VITE_PAYMENT_TOKEN_NAME} Inflows Over Time
          </h2>
          {inflows.length === 0 ? (
            <EmptyChartMessage message="No inflows recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={inflows}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                  stroke="var(--color-text-sub)"
                  tick={{ fontSize: 12, fill: "var(--color-text-sub)" }}
                />
                <YAxis
                  stroke="var(--color-text-sub)"
                  tick={{ fontSize: 12, fill: "var(--color-text-sub)" }}
                  label={{
                    value: import.meta.env.VITE_PAYMENT_TOKEN_NAME,
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "var(--color-text-sub)" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-text-body)",
                  }}
                  formatter={(value) => [
                    value.toLocaleString(),
                    import.meta.env.VITE_PAYMENT_TOKEN_NAME,
                  ]}
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="usdt"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <WithdrawalForm
          balances={balances}
          presaleState={presaleState}
          endTime={endTime}
          handleWithdraw={handleWithdraw}
          isSubmitting={isSubmitting}
        />

        <TransactionsTable
          transactions={transactions}
          title="Transaction History"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default FundManagementPage;

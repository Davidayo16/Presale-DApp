"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";
import { useTheme } from "../DashboardLayout";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  CreditCard,
  Clock,
  TrendingUp,
  Copy,
  Info,
  X,
} from "lucide-react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import PresaleABI from "../abi/presaleABI";

// Environment Variables
const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const TOKEN_NAME = import.meta.env.VITE_TOKEN_NAME;
const PLATFORM_NAME = import.meta.env.VITE_PLATFORM_NAME;
const DEBOUNCE_DELAY = parseInt(import.meta.env.VITE_DEBOUNCE_DELAY);

// Animation Variants
const tableVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Transaction Row Component
function TransactionRow({ tx, renderTransactionIcon, isMobile }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tx.transactionHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return isMobile ? (
    <motion.div
      variants={rowVariants}
      className="p-3 rounded-lg shadow-sm backdrop-blur-md bg-[var(--color-card-bg)] border border-[var(--color-border)]"
    >
      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <span className="text-[var(--color-text-sub)]">Date:</span>
        <span className="text-[var(--color-text-body)] text-right">
          {tx.date.toLocaleDateString()}
        </span>
        <span className="text-[var(--color-text-sub)]">Type:</span>
        <div className="flex items-center justify-end">
          {renderTransactionIcon(tx.type)}
          <span className="ml-2 capitalize text-[var(--color-text-body)]">
            {tx.type === "token-claim"
              ? "Token Claim"
              : tx.type === "reward-claim"
              ? "Reward Claim"
              : tx.type}
          </span>
        </div>
        <span className="text-[var(--color-text-sub)]">Amount:</span>
        <span className="text-[#22c55e] text-right">
          {tx.amount.toLocaleString()} {TOKEN_NAME}
        </span>
        <span className="text-[var(--color-text-sub)]">Platform:</span>
        <span className="text-[var(--color-text-body)] text-right">
          {tx.platform}
        </span>
        <span className="text-[var(--color-text-sub)]">Hash:</span>
        <div className="flex items-center justify-end">
          <span className="mr-2 truncate max-w-[50%] sm:max-w-[60%] text-[#3b82f6]">
            {tx.transactionHash}
          </span>
          <button
            onClick={handleCopy}
            className="text-[var(--color-text-sub)] hover:text-[var(--color-text-body)]"
          >
            {copied ? "Copied!" : <Copy size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  ) : (
    <motion.tr
      variants={rowVariants}
      className="transition-all hover:bg-[var(--color-tx-row-bg)] bg-[var(--color-tx-row-bg)]"
    >
      <td className="px-2 py-2 rounded-l-lg whitespace-nowrap text-[var(--color-text-body)] text-xs lg:text-sm">
        {tx.date.toLocaleDateString()}
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center">
          {renderTransactionIcon(tx.type)}
          <span className="ml-2 capitalize text-[var(--color-text-body)] text-xs lg:text-sm">
            {tx.type === "token-claim"
              ? "Token Claim"
              : tx.type === "reward-claim"
              ? "Reward Claim"
              : tx.type}
          </span>
        </div>
      </td>
      <td className="px-2 py-2 whitespace-nowrap text-[#22c55e] text-xs lg:text-sm">
        {tx.amount.toLocaleString()} {TOKEN_NAME}
      </td>
      <td className="px-2 py-2 truncate max-w-[150px] lg:max-w-[200px] text-[var(--color-text-body)] text-xs lg:text-sm">
        {tx.platform}
      </td>
      <td className="flex items-center px-2 py-2 rounded-r-lg">
        <span className="truncate max-w-[120px] lg:max-w-[150px] text-[#3b82f6] text-xs lg:text-sm">
          {tx.transactionHash}
        </span>
        <button
          onClick={handleCopy}
          className="ml-2 text-[var(--color-text-sub)] hover:text-[var(--color-text-body)]"
        >
          {copied ? "Copied!" : <Copy size={14} />}
        </button>
      </td>
    </motion.tr>
  );
}

export default function Transactions() {
  const { theme } = useTheme();
  const { walletConnected, signer, walletAddress, connectWallet } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [debouncedSearchTerm] = useDebounce(searchTerm, DEBOUNCE_DELAY);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(
    Number(import.meta.env.VITE_HPT_DECIMALS)
  );
  const [isMobile, setIsMobile] = useState(false);

  // Responsive Check with Resize Listener
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch Transactions from Contract
  const loadTransactions = async () => {
    if (!walletConnected || !signer || !walletAddress) return;
    try {
      setIsLoading(true);
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );

      const tokenAddress = await presaleContract.hptToken();
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function decimals() view returns (uint8)"],
        signer
      );
      const decimals = Number(await tokenContract.decimals());
      setTokenDecimals(decimals);

      const stakingFilter =
        presaleContract.filters.PresalePurchase(walletAddress);
      const stakingEvents = await presaleContract.queryFilter(
        stakingFilter,
        8403060,
        "latest"
      );

      const tokenClaimFilter =
        presaleContract.filters.TokensClaimed(walletAddress);
      const tokenClaimEvents = await presaleContract.queryFilter(
        tokenClaimFilter,
        0,
        "latest"
      );

      const rewardFilter =
        presaleContract.filters.RewardsClaimed(walletAddress);
      const rewardEvents = await presaleContract.queryFilter(
        rewardFilter,
        0,
        "latest"
      );

      const stakingTransactions = await Promise.all(
        stakingEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            id: `${event.transactionHash}-stake`,
            date: new Date(block.timestamp * 1000),
            type: "staking",
            amount: Number(
              ethers.formatUnits(event.args.tokenAmount, decimals)
            ),
            status: "completed",
            platform: `${PLATFORM_NAME} Staking Platform`,
            transactionHash: event.transactionHash,
          };
        })
      );

      const tokenClaimTransactions = await Promise.all(
        tokenClaimEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            id: `${event.transactionHash}-token-claim`,
            date: new Date(block.timestamp * 1000),
            type: "token-claim",
            amount: Number(ethers.formatUnits(event.args.amount, decimals)),
            status: "completed",
            platform: `${PLATFORM_NAME} Token Claim`,
            transactionHash: event.transactionHash,
          };
        })
      );

      const rewardTransactions = await Promise.all(
        rewardEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            id: `${event.transactionHash}-reward-claim`,
            date: new Date(block.timestamp * 1000),
            type: "reward-claim",
            amount: Number(ethers.formatUnits(event.args.amount, decimals)),
            status: "completed",
            platform: `${PLATFORM_NAME} Rewards`,
            transactionHash: event.transactionHash,
          };
        })
      );

      const allTransactions = [
        ...stakingTransactions,
        ...tokenClaimTransactions,
        ...rewardTransactions,
      ];
      setTransactions(allTransactions);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading transactions:", err);
      setError("Failed to load transaction history. Please try again.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (walletConnected && signer && walletAddress) {
      loadTransactions();
    }
  }, [walletConnected, signer, walletAddress]);

  // Filtering and Sorting Logic
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    if (debouncedSearchTerm) {
      result = result.filter(
        (tx) =>
          tx.platform
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          tx.transactionHash
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      result = result.filter((tx) => tx.type === filterType);
    }

    if (dateRange.start && dateRange.end) {
      result = result.filter(
        (tx) =>
          tx.date >= new Date(dateRange.start) &&
          tx.date <= new Date(dateRange.end)
      );
    }

    result.sort((a, b) => {
      if (sortConfig.key === "date") {
        return sortConfig.direction === "asc"
          ? a.date.getTime() - b.date.getTime()
          : b.date.getTime() - a.date.getTime();
      }
      if (sortConfig.key === "amount") {
        return sortConfig.direction === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      return 0;
    });

    return result;
  }, [debouncedSearchTerm, filterType, dateRange, sortConfig, transactions]);

  // Sort Handler
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const csv = [
      ["Date", "Type", "Amount", "Platform", "Transaction Hash"],
      ...filteredAndSortedTransactions.map((tx) => [
        tx.date.toLocaleDateString(),
        tx.type === "token-claim"
          ? "Token Claim"
          : tx.type === "reward-claim"
          ? "Reward Claim"
          : tx.type,
        tx.amount,
        tx.platform,
        tx.transactionHash,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${new Date().toISOString()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Transaction Icon Renderer
  const renderTransactionIcon = (type) => {
    switch (type) {
      case "staking":
        return <TrendingUp size={18} className="text-[#22c55e]" />;
      case "token-claim":
        return <CreditCard size={18} className="text-[#3b82f6]" />;
      case "reward-claim":
        return <CreditCard size={18} className="text-[#9333ea]" />;
      default:
        return <Clock size={18} className="text-[var(--color-text-sub)]" />;
    }
  };

  if (!walletConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.button
          onClick={connectWallet}
          className="px-6 py-3 font-medium rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-[var(--color-text-on-color)] w-full sm:w-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Connect Wallet
        </motion.button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-12 h-12 border-t-4 border-b-4 rounded-full border-[var(--color-accent-blue)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
      <motion.h1
        className="mb-4 text-lg sm:text-xl lg:text-2xl font-semibold text-[var(--color-text-header)]"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Transaction History
      </motion.h1>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-3 mb-4 rounded-lg backdrop-blur-md bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.3)]"
          >
            <div className="flex items-center">
              <Info size={18} className="mr-2 text-[var(--color-accent-red)]" />
              <span className="text-[var(--color-text-body)] text-xs sm:text-sm">
                {error}
              </span>
            </div>
            <button onClick={() => setError(null)}>
              <X size={18} className="text-[var(--color-accent-red)]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <div className="relative w-full sm:w-56">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-[var(--color-bg-start)] border border-[var(--color-border)] text-[var(--color-text-body)] text-xs sm:text-sm"
          />
          <Search
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--color-text-sub)]"
            size={18}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "staking", "token-claim", "reward-claim"].map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 text-xs sm:text-sm capitalize rounded-lg ${
                filterType === type
                  ? "bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-[var(--color-text-on-color)]"
                  : "bg-[var(--color-switch-off)] text-[var(--color-text-body)]"
              }`}
            >
              {type === "token-claim"
                ? "Token Claim"
                : type === "reward-claim"
                ? "Reward Claim"
                : type}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="px-2 py-1 rounded-lg focus:ring-2 focus:ring-blue-500 bg-[var(--color-bg-start)] border border-[var(--color-border)] text-[var(--color-text-body)] text-xs"
            style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
          />
          <input
            type="date"
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="px-2 py-1 rounded-lg focus:ring-2 focus:ring-blue-500 bg-[var(--color-bg-start)] border border-[var(--color-border)] text-[var(--color-text-body)] text-xs"
            style={{ colorScheme: theme === "dark" ? "dark" : "light" }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportCSV}
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#22c55e] to-[#3b82f6] text-[var(--color-text-on-color)] flex items-center justify-center"
        >
          <Download size={18} />
        </motion.button>
      </motion.div>

      {/* Transaction Display */}
      {isMobile ? (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredAndSortedTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                renderTransactionIcon={renderTransactionIcon}
                isMobile={isMobile}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <motion.table
            variants={tableVariants}
            initial="hidden"
            animate="visible"
            className="w-full border-separate border-spacing-y-1 table-auto min-w-[100%] max-w-[100%]"
          >
            <thead>
              <tr>
                {[
                  { key: "date", label: "Date" },
                  { key: "type", label: "Type" },
                  { key: "amount", label: "Amount" },
                  { key: "platform", label: "Platform" },
                  { key: "transactionHash", label: "Transaction Hash" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-2 py-2 text-left cursor-pointer hover:text-white whitespace-nowrap text-[var(--color-text-sub)] text-xs lg:text-sm"
                  >
                    <div className="flex items-center">
                      {label}
                      {sortConfig.key === key &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp size={14} className="ml-1" />
                        ) : (
                          <ChevronDown size={14} className="ml-1" />
                        ))}
                      {sortConfig.key !== key && (
                        <ArrowUpDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAndSortedTransactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    renderTransactionIcon={renderTransactionIcon}
                    isMobile={isMobile}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>
      )}

      {/* No Transactions State */}
      {filteredAndSortedTransactions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-6 text-center text-[var(--color-text-sub)]"
        >
          <p className="mb-4 text-base sm:text-lg">
            {transactions.length === 0
              ? "No transactions recorded yet."
              : "No transactions match your filters."}
          </p>
          {transactions.length === 0 && (
            <motion.button
              className="px-6 py-3 font-medium rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-[var(--color-text-on-color)] w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (window.location.href = "/dashboard/new")}
            >
              Start Staking Now
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTheme } from "../DashboardLayout";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  AlertCircle,
  Info,
  CheckCircle,
  DollarSign,
  Coins,
  Clock,
  Calendar,
  TrendingUp,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { ethers } from "ethers";
import PresaleABI from "../abi/presaleABI";
import ERC20ABI from "../abi/usdtABI";

const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS;
const BLOCK_EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL;
const TOKEN_NAME = import.meta.env.VITE_TOKEN_NAME || "HPT";
const PLATFORM_NAME = import.meta.env.VITE_PLATFORM_NAME || "Hiprofeet";
const USDT_DECIMALS = Number(import.meta.env.VITE_USDT_DECIMALS) || 6;
const SECONDS_PER_DAY = Number(import.meta.env.VITE_SECONDS_PER_DAY) || 86400;
const DEBOUNCE_DELAY = Number(import.meta.env.VITE_DEBOUNCE_DELAY) || 500;
const STAKING_OPTIONS = JSON.parse(
  import.meta.env.VITE_STAKING_OPTIONS ||
    '[{"name":"6-Month","apr":70,"lockupSeconds":15552000},{"name":"12-Month","apr":150,"lockupSeconds":31104000}]'
);

const STAKING_MAP = STAKING_OPTIONS.reduce((acc, option) => {
  acc[option.name.replace(/\s/g, "").toLowerCase()] = option.lockupSeconds;
  return acc;
}, {});

export default function PurchasePage({ isCollapsed }) {
  const { theme } = useTheme();
  const { walletConnected, signer, connectWallet, walletAddress } = useWallet();
  const [usdtAmount, setUsdtAmount] = useState("");
  const [hptAmount, setHptAmount] = useState("0");
  const [stakingOption, setStakingOption] = useState(
    STAKING_OPTIONS[0].name.replace(/\s/g, "").toLowerCase()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [approved, setApproved] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [showDetails, setShowDetails] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [presaleParams, setPresaleParams] = useState({
    usdtPrice: "0",
    minPurchase: "0",
    maxPurchase: "0",
    userHardCap: "0",
    totalUserPayment: "0",
    initialUnlock: 0,
    claimUnlock: 0,
    claimPeriod: 0,
    whitelistEnabled: false,
    isWhitelisted: false,
    paused: false,
    usdtDecimals: USDT_DECIMALS,
    presaleState: "NotStarted",
    startTime: 0,
    endTime: 0,
  });
  const [copied, setCopied] = useState(false);

  // Validate environment variables
  useEffect(() => {
    if (!PRESALE_ADDRESS || !ethers.isAddress(PRESALE_ADDRESS)) {
      console.error("Invalid or missing VITE_PRESALE_CONTRACT_ADDRESS");
      setError("Invalid presale contract address configuration");
      setIsLoading(false);
      return;
    }
    if (!USDT_ADDRESS || !ethers.isAddress(USDT_ADDRESS)) {
      console.error("Invalid or missing VITE_USDT_ADDRESS");
      setError("Invalid USDT contract address configuration");
      setIsLoading(false);
      return;
    }
    if (!BLOCK_EXPLORER_URL || !BLOCK_EXPLORER_URL.startsWith("http")) {
      console.error("Invalid or missing VITE_EXPLORER_URL");
      setError("Invalid block explorer URL configuration");
      setIsLoading(false);
      return;
    }
    if (
      !STAKING_OPTIONS ||
      !Array.isArray(STAKING_OPTIONS) ||
      STAKING_OPTIONS.length === 0
    ) {
      console.error("Invalid or missing VITE_STAKING_OPTIONS");
      setError("Invalid staking options configuration");
      setIsLoading(false);
      return;
    }
    console.log("Environment variables loaded:", {
      PRESALE_ADDRESS,
      USDT_ADDRESS,
      BLOCK_EXPLORER_URL,
      TOKEN_NAME,
      PLATFORM_NAME,
      USDT_DECIMALS,
      SECONDS_PER_DAY,
      DEBOUNCE_DELAY,
      STAKING_OPTIONS,
    });
  }, []);

  const loadPresaleData = async () => {
    if (!walletConnected || !signer) return;
    try {
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20ABI, signer);

      const [
        usdtDecimals,
        usdtPrice,
        minPurchase,
        maxPurchase,
        userHardCap,
        totalUserPayment,
        whitelistEnabled,
        initialUnlock,
        claimUnlock,
        claimPeriod,
        state,
        startTime,
        endTime,
        paused,
        balance,
        allowance,
      ] = await Promise.all([
        usdtContract.decimals(),
        presaleContract.usdtPrice(),
        presaleContract.minPurchase(),
        presaleContract.maxPurchase(),
        presaleContract.userHardCap(),
        presaleContract.totalUserPayment(walletAddress),
        presaleContract.whitelistEnabled(),
        presaleContract.initialUnlockPercentage(),
        presaleContract.claimUnlockPercentage(),
        presaleContract.claimPeriod(),
        presaleContract.getCurrentPresaleState(),
        presaleContract.startTime(),
        presaleContract.endTime(),
        presaleContract.paused(),
        usdtContract.balanceOf(walletAddress),
        usdtContract.allowance(walletAddress, PRESALE_ADDRESS),
      ]);

      const isWhitelisted = whitelistEnabled
        ? await presaleContract.whitelisted(walletAddress)
        : true;

      setPresaleParams({
        usdtPrice: ethers.formatUnits(usdtPrice, usdtDecimals),
        minPurchase: ethers.formatUnits(minPurchase, usdtDecimals),
        maxPurchase: ethers.formatUnits(maxPurchase, usdtDecimals),
        userHardCap: ethers.formatUnits(userHardCap, usdtDecimals),
        totalUserPayment: ethers.formatUnits(totalUserPayment, usdtDecimals),
        initialUnlock: Number(initialUnlock),
        claimUnlock: Number(claimUnlock),
        claimPeriod: Number(claimPeriod) / SECONDS_PER_DAY,
        whitelistEnabled,
        isWhitelisted,
        paused,
        presaleState: ["NotStarted", "Active", "Ended", "ClaimOpen"][
          Number(state)
        ],
        usdtDecimals,
        startTime: Number(startTime) * 1000,
        endTime: Number(endTime) * 1000,
      });
      setUsdtBalance(ethers.formatUnits(balance, usdtDecimals));
      setAllowance(ethers.formatUnits(allowance, usdtDecimals));
    } catch (err) {
      console.error("Failed to load presale data:", err);
      setError("Failed to load presale data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timeout;
    const debouncedLoad = () => {
      clearTimeout(timeout);
      setIsLoading(true);
      timeout = setTimeout(() => loadPresaleData(), DEBOUNCE_DELAY);
    };

    debouncedLoad();
    return () => clearTimeout(timeout);
  }, [walletConnected, signer, walletAddress]);

  useEffect(() => {
    if (usdtAmount && !isNaN(parseFloat(usdtAmount))) {
      const tokenAmount =
        parseFloat(usdtAmount) / parseFloat(presaleParams.usdtPrice);
      setHptAmount(
        tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })
      );
    } else {
      setHptAmount("0");
    }
  }, [usdtAmount, presaleParams.usdtPrice]);

  const handleAmountChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setUsdtAmount("");
      setError("");
      return;
    }

    const numValue = parseFloat(value);
    const min = parseFloat(presaleParams.minPurchase);
    const max = parseFloat(presaleParams.maxPurchase);
    const remainingCap =
      parseFloat(presaleParams.userHardCap) -
      parseFloat(presaleParams.totalUserPayment);
    const balance = parseFloat(usdtBalance);

    if (isNaN(numValue)) {
      setUsdtAmount(value);
      setError("Please enter a valid number");
      return;
    }

    const effectiveMax = Math.min(max, remainingCap, balance);

    if (numValue < min) {
      setUsdtAmount(value);
      setError(`Amount must be at least ${min} USDT`);
    } else if (numValue > effectiveMax) {
      setUsdtAmount(effectiveMax.toString());
      setError(`Amount cannot exceed ${effectiveMax} USDT (balance or cap)`);
    } else {
      setUsdtAmount(value);
      setError("");
    }
  };

  const handleApprove = async () => {
    if (!signer || !usdtAmount || error) return;

    setLoadingAction(true);
    setError("");

    try {
      const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20ABI, signer);
      const amount = ethers.parseUnits(usdtAmount, presaleParams.usdtDecimals);
      const tx = await usdtContract.approve(PRESALE_ADDRESS, amount);
      await tx.wait();
      setApproved(true);
      setAllowance(
        ethers.formatUnits(
          await usdtContract.allowance(walletAddress, PRESALE_ADDRESS),
          presaleParams.usdtDecimals
        )
      );
    } catch (err) {
      console.error("Approval failed:", err);
      setError(
        "Approval failed: " + (err.reason || err.message || "Unknown error")
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePurchase = async () => {
    if (!signer || !usdtAmount || error) return;

    setLoadingAction(true);
    setError("");

    try {
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      const amount = ethers.parseUnits(usdtAmount, presaleParams.usdtDecimals);
      const tx = await presaleContract.participate(
        amount,
        STAKING_MAP[stakingOption]
      );
      const receipt = await tx.wait();

      setTxHash(tx.hash);
      setShowSuccess(true);
      await loadPresaleData();
    } catch (err) {
      console.error("Purchase failed:", err);
      setError(
        err.reason || err.message || "Purchase failed. Please try again."
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const validateInput = () => {
    if (
      !walletConnected ||
      presaleParams.presaleState !== "Active" ||
      presaleParams.paused
    )
      return false;
    if (presaleParams.whitelistEnabled && !presaleParams.isWhitelisted)
      return false;

    const numValue = parseFloat(usdtAmount);
    const min = parseFloat(presaleParams.minPurchase);
    const max = parseFloat(presaleParams.maxPurchase);
    const remainingCap =
      parseFloat(presaleParams.userHardCap) -
      parseFloat(presaleParams.totalUserPayment);
    const balance = parseFloat(usdtBalance);
    const allowanceNum = parseFloat(allowance);

    return (
      !isNaN(numValue) &&
      numValue >= min &&
      numValue <= Math.min(max, remainingCap, balance) &&
      (!approved || allowanceNum >= numValue)
    );
  };

  const getStateColor = () => {
    switch (presaleParams.presaleState) {
      case "Active":
        return "var(--color-accent-green)";
      case "Ended":
        return "var(--color-accent-red)";
      default:
        return "var(--color-accent-yellow)";
    }
  };

  if (!walletConnected) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4"
        style={{
          background: `linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))`,
        }}
      >
        <motion.div
          className="w-full max-w-md p-6 shadow-lg rounded-xl"
          style={{
            background: `var(--color-card-bg)`,
            border: `1px solid var(--color-border)`,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2
              className="text-xl font-bold"
              style={{ color: `var(--color-text-header)` }}
            >
              Connect Your Wallet
            </h2>
            <p style={{ color: `var(--color-text-sub)` }}>
              Please connect your wallet to participate in the presale
            </p>
            <motion.button
              onClick={connectWallet}
              className="px-6 py-2 font-medium rounded-lg"
              style={{
                background: `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))`,
                color: `var(--color-text-on-color)`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Connect Wallet
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-12 h-12 border-t-4 border-b-4 rounded-full"
          style={{ borderColor: `var(--color-accent-blue)` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4"
        style={{
          background: `linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))`,
        }}
      >
        <motion.div
          className="w-full max-w-md p-6 shadow-lg rounded-xl"
          style={{
            background: `var(--color-card-bg)`,
            border: `1px solid rgba(34, 197, 94, 0.3)`,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="flex items-center justify-center w-12 h-12 mb-4 rounded-full"
              style={{ background: `rgba(34, 197, 94, 0.2)` }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <CheckCircle
                size={24}
                className="text-[var(--color-accent-green)]"
              />
            </motion.div>
            <h2
              className="mb-3 text-xl font-bold"
              style={{ color: `var(--color-text-header)` }}
            >
              Purchase Successful!
            </h2>
            <div
              className="w-full p-4 mb-4 rounded-lg"
              style={{ background: `var(--color-switch-off)` }}
            >
              <div className="flex justify-between mb-2 text-sm">
                <span style={{ color: `var(--color-text-sub)` }}>
                  Amount Purchased:
                </span>
                <span style={{ color: `var(--color-text-body)` }}>
                  {hptAmount} {TOKEN_NAME}
                </span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span style={{ color: `var(--color-text-sub)` }}>
                  USDT Spent:
                </span>
                <span style={{ color: `var(--color-text-body)` }}>
                  {usdtAmount} USDT
                </span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span style={{ color: `var(--color-text-sub)` }}>
                  Staking Period:
                </span>
                <span style={{ color: `var(--color-text-body)` }}>
                  {
                    STAKING_OPTIONS.find(
                      (opt) =>
                        opt.name.replace(/\s/g, "").toLowerCase() ===
                        stakingOption
                    ).name
                  }
                </span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span style={{ color: `var(--color-text-sub)` }}>
                  Transaction Hash:
                </span>
                <div className="flex items-center">
                  <span className="text-[var(--color-accent-blue)] mr-2">
                    {txHash.substring(0, 6)}...
                    {txHash.substring(txHash.length - 4)}
                  </span>
                  <motion.button
                    className="relative"
                    onClick={() => {
                      navigator.clipboard.writeText(txHash);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1000);
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CheckCircle
                            size={14}
                            className="text-[var(--color-accent-green)]"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Copy
                            size={14}
                            className="text-[var(--color-accent-blue)]"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: `var(--color-text-sub)` }}>
                  View on Explorer:
                </span>
                <a
                  href={`${BLOCK_EXPLORER_URL}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-[var(--color-accent-blue)]"
                >
                  <span className="mr-1">Details</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <div className="flex flex-col w-full space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <motion.button
                onClick={() => {
                  setUsdtAmount("");
                  setApproved(false);
                  setShowSuccess(false);
                  setTxHash("");
                }}
                className="flex-1 px-4 py-2 font-medium rounded-lg"
                style={{
                  background: `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))`,
                  color: `var(--color-text-on-color)`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                New Purchase
              </motion.button>
              <motion.button
                onClick={() => (window.location.href = "/dashboard")}
                className="flex-1 px-4 py-2 font-medium rounded-lg"
                style={{
                  background: `var(--color-switch-off)`,
                  color: `var(--color-text-body)`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Dashboard
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen p-4 sm:p-6"
      style={{
        background: `linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))`,
      }}
    >
      <div className="w-full">
        <motion.h1
          className="mb-2 text-lg sm:text-xl md:text-2xl font-bold"
          style={{ color: `var(--color-text-header)` }}
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Purchase {TOKEN_NAME} Tokens
        </motion.h1>
        <p
          style={{ color: `var(--color-text-sub)` }}
          className="mb-3 sm:mb-4 text-sm"
        >
          Participate in the {PLATFORM_NAME} presale and stake your tokens
        </p>

        {error && !usdtAmount && (
          <motion.div
            className="p-3 mb-4 rounded-lg w-full max-w-lg"
            style={{
              background: `rgba(239, 68, 68, 0.2)`,
              border: `1px solid rgba(239, 68, 68, 0.3)`,
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <AlertCircle
                size={16}
                className="text-[var(--color-accent-red)] mr-2"
              />
              <span style={{ color: `var(--color-text-body)` }}>{error}</span>
            </div>
          </motion.div>
        )}

        {presaleParams.whitelistEnabled && !presaleParams.isWhitelisted && (
          <motion.div
            className="p-3 mb-4 rounded-lg w-full max-w-lg"
            style={{
              background: `rgba(234, 179, 8, 0.2)`,
              border: `1px solid rgba(234, 179, 8, 0.3)`,
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <AlertCircle
                size={16}
                className="text-[var(--color-accent-yellow)] mr-2"
              />
              <span style={{ color: `var(--color-text-body)` }}>
                Your address is not whitelisted
              </span>
            </div>
          </motion.div>
        )}

        {presaleParams.paused && (
          <motion.div
            className="p-3 mb-4 rounded-lg w-full max-w-lg"
            style={{
              background: `rgba(234, 179, 8, 0.2)`,
              border: `1px solid rgba(234, 179, 8, 0.3)`,
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <AlertCircle
                size={16}
                className="text-[var(--color-accent-yellow)] mr-2"
              />
              <span style={{ color: `var(--color-text-body)` }}>
                Presale is paused
              </span>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <motion.div
            className="overflow-hidden shadow-lg rounded-lg w-full lg:w-2/3"
            style={{
              background: `var(--color-card-bg)`,
              border: `1px solid var(--color-border)`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-4 sm:p-6">
              <h2
                className="mb-3 text-lg font-semibold"
                style={{ color: `var(--color-text-header)` }}
              >
                Token Purchase
              </h2>

              <div className="mb-4">
                <label
                  className="block mb-1 text-sm font-medium"
                  style={{ color: `var(--color-text-body)` }}
                >
                  USDT Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={usdtAmount}
                    onChange={handleAmountChange}
                    className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
                    placeholder={`Min: ${presaleParams.minPurchase} USDT`}
                    style={{
                      background: `var(--color-card-bg)`,
                      color: `var(--color-text-body)`,
                      border: `1px solid var(--color-border)`,
                    }}
                    disabled={
                      !walletConnected ||
                      presaleParams.presaleState !== "Active" ||
                      presaleParams.paused ||
                      (presaleParams.whitelistEnabled &&
                        !presaleParams.isWhitelisted)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span style={{ color: `var(--color-text-sub)` }}>USDT</span>
                  </div>
                  {validateInput() && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 rounded-b-lg"
                      style={{
                        background: `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.7 }}
                    />
                  )}
                </div>
                <div
                  className="flex justify-between mt-1 text-sm"
                  style={{ color: `var(--color-text-sub)` }}
                >
                  <span>Min: {presaleParams.minPurchase}</span>
                  <span>Max: {presaleParams.maxPurchase}</span>
                </div>
                <div
                  className="mt-1 text-sm"
                  style={{ color: `var(--color-text-sub)` }}
                >
                  Cap: {presaleParams.totalUserPayment}/
                  {presaleParams.userHardCap} | Balance: {usdtBalance}
                </div>
                <AnimatePresence>
                  {error && usdtAmount && (
                    <motion.div
                      className="flex items-center gap-1 px-2 py-1 mt-1 rounded"
                      style={{
                        background: `rgba(239, 68, 68, 0.1)`,
                        border: `1px solid rgba(239, 68, 68, 0.3)`,
                        color: `var(--color-accent-red)`,
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <AlertCircle size={14} />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                className="p-3 mt-4 rounded-lg"
                style={{
                  background: `var(--color-switch-off)`,
                  border: `1px solid var(--color-border)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: `var(--color-text-body)` }}>
                    You get:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-medium text-base ${
                        hptAmount !== "0"
                          ? "text-[var(--color-accent-blue)]"
                          : "text-[var(--color-text-sub)]"
                      }`}
                    >
                      {hptAmount} {TOKEN_NAME}
                    </span>
                    {hptAmount !== "0" && (
                      <Coins
                        size={14}
                        className="text-[var(--color-accent-blue)] animate-pulse"
                      />
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center mt-1 text-sm"
                  style={{ color: `var(--color-text-sub)` }}
                >
                  <DollarSign size={12} className="mr-1" />
                  <span>
                    Rate: 1 {TOKEN_NAME} = {presaleParams.usdtPrice} USDT
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label
                  className="block mb-1 text-sm font-medium"
                  style={{ color: `var(--color-text-body)` }}
                >
                  Staking Option
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {STAKING_OPTIONS.map((option, index) => {
                    const key = option.name.replace(/\s/g, "").toLowerCase();
                    return (
                      <motion.div
                        key={key}
                        onClick={() => setStakingOption(key)}
                        className="relative p-3 rounded-lg cursor-pointer"
                        style={{
                          background:
                            stakingOption === key
                              ? `rgba(${
                                  index === 0 ? "59, 130, 246" : "147, 51, 234"
                                }, 0.2)`
                              : `var(--color-switch-off)`,
                          border:
                            stakingOption === key
                              ? `1px solid var(--color-accent-${
                                  index === 0 ? "blue" : "purple"
                                })`
                              : `1px solid var(--color-border)`,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mr-2 mt-0.5 ${
                              stakingOption === key
                                ? `border-[var(--color-accent-${
                                    index === 0 ? "blue" : "purple"
                                  })] bg-[var(--color-accent-${
                                    index === 0 ? "blue" : "purple"
                                  })]/30`
                                : "border-[var(--color-text-sub)]"
                            }`}
                          >
                            {stakingOption === key && (
                              <motion.div
                                className={`w-2 h-2 bg-[var(--color-accent-${
                                  index === 0 ? "blue" : "purple"
                                })] rounded-full m-auto`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div style={{ color: `var(--color-text-body)` }}>
                              {option.name}
                            </div>
                            <div className="flex items-center mt-1 text-sm">
                              <TrendingUp
                                size={14}
                                className="mr-1 text-[var(--color-accent-green)]"
                              />
                              <span
                                className={`font-medium ${
                                  stakingOption === key
                                    ? "text-[var(--color-accent-green)]"
                                    : "text-[var(--color-text-sub)]"
                                }`}
                              >
                                {option.apr}% APR
                              </span>
                            </div>
                            <div
                              className="flex items-center mt-1 text-sm"
                              style={{ color: `var(--color-text-sub)` }}
                            >
                              <Calendar size={12} className="mr-1" />
                              <span>
                                Until{" "}
                                {new Date(
                                  Date.now() + option.lockupSeconds * 1000
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                {!approved ? (
                  <motion.button
                    onClick={handleApprove}
                    disabled={!validateInput() || loadingAction}
                    className="w-full px-4 py-2 font-medium rounded-lg"
                    style={{
                      background:
                        validateInput() && !loadingAction
                          ? `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))`
                          : `var(--color-switch-off)`,
                      color:
                        validateInput() && !loadingAction
                          ? `var(--color-text-on-color)`
                          : `var(--color-text-body)`,
                      cursor:
                        validateInput() && !loadingAction
                          ? "pointer"
                          : "not-allowed",
                    }}
                    whileHover={
                      validateInput() && !loadingAction ? { scale: 1.05 } : {}
                    }
                    whileTap={
                      validateInput() && !loadingAction ? { scale: 0.95 } : {}
                    }
                  >
                    {loadingAction ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Approving...
                      </div>
                    ) : (
                      "Approve USDT"
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handlePurchase}
                    disabled={!validateInput() || loadingAction}
                    className="relative w-full px-4 py-2 font-medium rounded-lg"
                    style={{
                      background:
                        validateInput() && !loadingAction
                          ? `linear-gradient(to right, var(--color-accent-green), #14b8a6)`
                          : `var(--color-switch-off)`,
                      color:
                        validateInput() && !loadingAction
                          ? `var(--color-text-on-color)`
                          : `var(--color-text-body)`,
                      cursor:
                        validateInput() && !loadingAction
                          ? "pointer"
                          : "not-allowed",
                    }}
                    whileHover={
                      validateInput() && !loadingAction ? { scale: 1.05 } : {}
                    }
                    whileTap={
                      validateInput() && !loadingAction ? { scale: 0.95 } : {}
                    }
                  >
                    {loadingAction ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      "Purchase Tokens"
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4 w-full lg:w-1/3">
            <motion.div
              className="overflow-hidden shadow-lg rounded-lg"
              style={{
                background: `var(--color-card-bg)`,
                border: `1px solid var(--color-border)`,
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="flex items-center p-3 border-b"
                style={{
                  background: `var(--color-card-bg)`,
                  borderColor: `var(--color-border)`,
                }}
              >
                <Info
                  size={16}
                  className="mr-2 text-[var(--color-accent-blue)]"
                />
                <h3 style={{ color: `var(--color-text-body)` }}>
                  {TOKEN_NAME} Info
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: "Symbol", value: TOKEN_NAME },
                  {
                    label: "Price",
                    value: `${presaleParams.usdtPrice} USDT`,
                  },
                  {
                    label: "Min Buy",
                    value: `${presaleParams.minPurchase} USDT`,
                  },
                  {
                    label: "Max Buy",
                    value: `${presaleParams.maxPurchase} USDT`,
                  },
                  {
                    label: "Cap",
                    value: `${presaleParams.totalUserPayment}/${presaleParams.userHardCap}`,
                  },
                  {
                    label: "State",
                    value: (
                      <span style={{ color: getStateColor() }}>
                        {presaleParams.presaleState}
                      </span>
                    ),
                  },
                  {
                    label: "Paused",
                    value: presaleParams.paused ? "Yes" : "No",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between text-sm"
                  >
                    <span style={{ color: `var(--color-text-sub)` }}>
                      {item.label}
                    </span>
                    <span style={{ color: `var(--color-text-body)` }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="overflow-hidden shadow-lg rounded-lg"
              style={{
                background: `var(--color-card-bg)`,
                border: `1px solid var(--color-border)`,
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className="flex items-center justify-between p-3 border-b"
                style={{
                  background: `var(--color-card-bg)`,
                  borderColor: `var(--color-border)`,
                }}
              >
                <div className="flex items-center">
                  <Clock
                    size={16}
                    className="mr-2 text-[var(--color-accent-purple)]"
                  />
                  <h3 style={{ color: `var(--color-text-body)` }}>Vesting</h3>
                </div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center text-sm text-[var(--color-accent-blue)] hover:text-[var(--color-accent-purple)]"
                >
                  {showDetails ? "Hide" : "Show"}
                  <ArrowRight
                    size={12}
                    className={`ml-1 transition-transform ${
                      showDetails ? "rotate-90" : ""
                    }`}
                  />
                </button>
              </div>
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0 }}
                animate={{ height: showDetails ? "auto" : 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 space-y-3">
                  {[
                    {
                      title: "Initial Unlock",
                      desc: `${presaleParams.initialUnlock}% at TGE`,
                      color: "var(--color-accent-green)",
                    },
                    {
                      title: `Day ${presaleParams.claimPeriod}`,
                      desc: `${presaleParams.claimUnlock}% unlocked`,
                      color: "var(--color-accent-blue)",
                    },
                    {
                      title: `Day ${presaleParams.claimPeriod * 2}`,
                      desc: `${presaleParams.claimUnlock}% unlocked`,
                      color: "var(--color-accent-purple)",
                    },
                    {
                      title: `Day ${presaleParams.claimPeriod * 3}`,
                      desc: `${presaleParams.claimUnlock}% unlocked`,
                      color: "var(--color-accent-pink)",
                    },
                    {
                      title: `Day ${presaleParams.claimPeriod * 4}`,
                      desc: `${presaleParams.claimUnlock}% unlocked`,
                      color: "var(--color-accent-yellow)",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="relative pl-4 border-l-2"
                      style={{ borderColor: item.color }}
                    >
                      <div
                        className="absolute top-0 w-3 h-3 rounded-full -left-2"
                        style={{ background: item.color }}
                      />
                      <h4 style={{ color: `var(--color-text-body)` }}>
                        {item.title}
                      </h4>
                      <p style={{ color: `var(--color-text-sub)` }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
              <div className="flex items-center p-3 space-x-2">
                <div
                  className="w-full h-2 rounded-full"
                  style={{ background: `var(--color-switch-off)` }}
                >
                  <div
                    className="h-full"
                    style={{
                      background: `linear-gradient(to right, var(--color-accent-green), var(--color-accent-blue))`,
                      width: `${presaleParams.initialUnlock}%`,
                    }}
                  />
                </div>
                <span style={{ color: `var(--color-text-sub)` }}>
                  {presaleParams.initialUnlock}%
                </span>
              </div>
            </motion.div>

            <motion.div
              className="flex p-3 shadow-lg rounded-lg"
              style={{
                background: `rgba(234, 179, 8, 0.2)`,
                border: `1px solid rgba(234, 179, 8, 0.3)`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AlertCircle
                size={16}
                className="text-[var(--color-accent-yellow)] mr-2 mt-0.5"
              />
              <div>
                <h3 style={{ color: `var(--color-accent-yellow)` }}>Notice</h3>
                <p style={{ color: `var(--color-text-sub)` }}>
                  Staking period is fixed. Rewards start at purchase.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

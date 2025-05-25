import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCoins,
  FaUsers,
  FaDollarSign,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { ethers } from "ethers";

const presaleABI = [
  "function getPresaleStats() external view returns (uint256 _totalSold, uint256 _totalRaised, uint256 _hardCap, uint256 _startTime, uint256 _endTime, uint256 _participantCount, uint8 _state)",
  "function getCurrentPresaleState() external view returns (uint8)",
  "enum PresaleState { NotStarted, Active, Ended, ClaimOpen }",
  "event Purchase(address indexed buyer, uint256 amount)",
];

export default function PresaleMetrics() {
  const [presaleContract, setPresaleContract] = useState(null);
  const contractAddress = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
  const [tokensSold, setTokensSold] = useState(0);
  const [hardCap, setHardCap] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [fundsRaised, setFundsRaised] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [presaleState, setPresaleState] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [prevTokensSold, setPrevTokensSold] = useState(0);
  const [prevParticipants, setPrevParticipants] = useState(0);
  const [prevFundsRaised, setPrevFundsRaised] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [countdownLabel, setCountdownLabel] = useState("Next Phase Starts In:");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockchainTimeOffset, setBlockchainTimeOffset] = useState(0);
  const [provider, setProvider] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Cache management
  const CACHE_KEY = "presale_metrics_cache";
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const saveToCache = (data) => {
    const cacheData = { ...data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  };

  const loadFromCache = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const cacheData = JSON.parse(cached);
    if (Date.now() - cacheData.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cacheData;
  };

  useEffect(() => {
    const initializeProvider = async () => {
      try {
        const newProvider = new ethers.JsonRpcProvider(
          import.meta.env.VITE_RPC_URL
        );
        setProvider(newProvider);
        const contract = new ethers.Contract(
          contractAddress,
          presaleABI,
          newProvider
        );
        setPresaleContract(contract);
      } catch (err) {
        console.error("Failed to initialize provider:", err);
        setError("Failed to connect to blockchain");
        setIsLoading(false);
      }
    };

    // Load cached data initially
    const cachedData = loadFromCache();
    if (cachedData) {
      setTokensSold(cachedData.tokensSold || 0);
      setFundsRaised(cachedData.fundsRaised || 0);
      setHardCap(cachedData.hardCap || 0);
      setParticipants(cachedData.participants || 0);
      setPresaleState(cachedData.presaleState || 0);
      setStartTime(cachedData.startTime || 0);
      setEndTime(cachedData.endTime || 0);
      setIsVisible(true);
      setIsLoading(false);
    }

    initializeProvider();
  }, [contractAddress]);

  useEffect(() => {
    const syncBlockchainTime = async () => {
      if (!provider) return;
      try {
        const block = await provider.getBlock("latest");
        if (block && block.timestamp) {
          const clientTimeSeconds = Math.floor(Date.now() / 1000);
          const offset = Number(block.timestamp) - clientTimeSeconds;
          setBlockchainTimeOffset(offset);
          console.log(`Blockchain time offset: ${offset} seconds`);
        }
      } catch (err) {
        console.error("Error syncing blockchain time:", err);
      }
    };

    syncBlockchainTime();
    const interval = setInterval(syncBlockchainTime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [provider]);

  const getBlockchainTime = () => {
    return Math.floor(Date.now() / 1000) + blockchainTimeOffset;
  };

  useEffect(() => {
    const fetchPresaleData = async () => {
      if (!presaleContract) return;

      try {
        setIsLoading(true);
        const stats = await presaleContract.getPresaleStats();

        const newTokensSold = Number(ethers.formatEther(stats[0]));
        const newFundsRaised = Number(ethers.formatUnits(stats[1], 6));
        const newParticipants = Number(stats[5]);

        setPrevTokensSold(tokensSold || 0);
        setPrevParticipants(participants || 0);
        setPrevFundsRaised(fundsRaised || 0);

        setTokensSold(newTokensSold);
        setFundsRaised(newFundsRaised);
        setHardCap(Number(ethers.formatEther(stats[2])));
        setStartTime(Number(stats[3]));
        setEndTime(Number(stats[4]));
        setParticipants(newParticipants);
        setPresaleState(Number(stats[6]));

        // Save to cache
        saveToCache({
          tokensSold: newTokensSold,
          fundsRaised: newFundsRaised,
          hardCap: Number(ethers.formatEther(stats[2])),
          participants: newParticipants,
          presaleState: Number(stats[6]),
          startTime: Number(stats[3]),
          endTime: Number(stats[4]),
        });

        setError(null);
        setRetryCount(0);
        setIsVisible(true);
        setIsLoading(false);
        setLastUpdated(new Date().toLocaleString());
      } catch (err) {
        console.error("Error fetching presale data:", err);
        setError("Failed to fetch presale data");
        setIsLoading(false);
        // Load cached data on error
        const cachedData = loadFromCache();
        if (cachedData) {
          setTokensSold(cachedData.tokensSold || 0);
          setFundsRaised(cachedData.fundsRaised || 0);
          setHardCap(cachedData.hardCap || 0);
          setParticipants(cachedData.participants || 0);
          setPresaleState(cachedData.presaleState || 0);
          setStartTime(cachedData.startTime || 0);
          setEndTime(cachedData.endTime || 0);
          setIsVisible(true);
        }
      }
    };

    fetchPresaleData();
    const interval = setInterval(fetchPresaleData, 60000); // 60s interval
    return () => clearInterval(interval);
  }, [presaleContract, forceRefresh]);

  // Listen for Purchase events
  useEffect(() => {
    if (!presaleContract) return;

    const handlePurchase = async () => {
      try {
        const stats = await presaleContract.getPresaleStats();
        const newTokensSold = Number(ethers.formatEther(stats[0]));
        const newFundsRaised = Number(ethers.formatUnits(stats[1], 6));
        const newParticipants = Number(stats[5]);

        setPrevTokensSold(tokensSold || 0);
        setPrevParticipants(participants || 0);
        setPrevFundsRaised(fundsRaised || 0);

        setTokensSold(newTokensSold);
        setFundsRaised(newFundsRaised);
        setParticipants(newParticipants);

        // Update cache
        saveToCache({
          tokensSold: newTokensSold,
          fundsRaised: newFundsRaised,
          hardCap: hardCap,
          participants: newParticipants,
          presaleState: presaleState,
          startTime: startTime,
          endTime: endTime,
        });

        setLastUpdated(new Date().toLocaleString());
      } catch (err) {
        console.error("Error handling purchase event:", err);
      }
    };

    presaleContract.on("Purchase", handlePurchase);
    return () => presaleContract.off("Purchase", handlePurchase);
  }, [
    presaleContract,
    tokensSold,
    fundsRaised,
    participants,
    hardCap,
    presaleState,
    startTime,
    endTime,
  ]);

  // Auto-retry on error
  useEffect(() => {
    if (!error) return;
    const retryDelays = [10000, 20000, 40000]; // 10s, 20s, 40s
    const delay = retryDelays[Math.min(retryCount, retryDelays.length - 1)];
    const timer = setTimeout(() => {
      setForceRefresh((prev) => !prev);
      setRetryCount((prev) => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [error, retryCount]);

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change === 0
      ? null
      : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const tokensSoldChange = calculatePercentageChange(
    tokensSold,
    prevTokensSold
  );
  const participantsChange = calculatePercentageChange(
    participants,
    prevParticipants
  );
  const fundsRaisedChange = calculatePercentageChange(
    fundsRaised,
    prevFundsRaised
  );

  useEffect(() => {
    if (!startTime || !endTime) return;

    const updateCountdown = () => {
      const now = getBlockchainTime();
      if (presaleState === 0) {
        setCountdownLabel("Presale Starts In:");
        if (startTime - now <= 3 && startTime - now > 0) {
          const checkCurrentState = async () => {
            if (presaleContract) {
              try {
                const currentState =
                  await presaleContract.getCurrentPresaleState();
                if (Number(currentState) === 1) setPresaleState(1);
              } catch (err) {
                console.error("Error checking contract state:", err);
              }
            }
          };
          checkCurrentState();
        }
        setTimeLeft(Math.max(0, startTime - now));
        if (startTime <= now && startTime - now < -3) setPresaleState(1);
      } else if (presaleState === 1) {
        setCountdownLabel("Presale Ends In:");
        if (endTime - now <= 3 && endTime - now > 0) {
          const checkCurrentState = async () => {
            if (presaleContract) {
              try {
                const currentState =
                  await presaleContract.getCurrentPresaleState();
                if (Number(currentState) === 2) setPresaleState(2);
              } catch (err) {
                console.error("Error checking contract state:", err);
              }
            }
          };
          checkCurrentState();
        }
        setTimeLeft(Math.max(0, endTime - now));
        if (endTime <= now && endTime - now < -3) setPresaleState(2);
      } else if (presaleState === 2) {
        setCountdownLabel("Claim Phase Starts In:");
        const claimStart = endTime + 60 * 86400;
        setTimeLeft(Math.max(0, claimStart - now));
        if (claimStart <= now) setPresaleState(3);
      } else {
        setCountdownLabel("Next Claim Phase In:");
        setTimeLeft(0);
      }
    };

    updateCountdown();
    const countdown = setInterval(updateCountdown, 2000); // 2s interval
    return () => clearInterval(countdown);
  }, [startTime, endTime, presaleState, blockchainTimeOffset, presaleContract]);

  const formatTime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return [
      { value: d, label: "Days" },
      { value: h, label: "Hours" },
      { value: m, label: "Minutes" },
      { value: s, label: "Seconds" },
    ];
  };

  const progress = useMemo(() => {
    return hardCap > 0 ? (tokensSold / hardCap) * 100 : 0;
  }, [tokensSold, hardCap]);

  const getButtonConfig = () => {
    switch (presaleState) {
      case 0:
        return { text: "Presale Coming Soon", disabled: true };
      case 1:
        return { text: "Join Presale Now", disabled: false };
      case 2:
        return { text: "Presale Ended", disabled: true };
      case 3:
        return { text: "Claim Tokens", disabled: false };
      default:
        return { text: "Connect Wallet", disabled: false };
    }
  };

  const buttonConfig = getButtonConfig();

  const getStateLabel = () => {
    switch (presaleState) {
      case 0:
        return "Not Started";
      case 1:
        return "Active";
      case 2:
        return "Ended";
      case 3:
        return "Claim Open";
      default:
        return "Unknown";
    }
  };

  return (
    <section
      id="presale"
      className="relative flex flex-col items-center justify-center py-16 px-4 sm:px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
    >
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500/10"
            style={{
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * 50 - 25, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 w-full max-w-5xl overflow-hidden border shadow-2xl bg-white/10 backdrop-blur-xl rounded-2xl border-white/20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"></div>

        <div className="p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <h2
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                Presale Metrics
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  presaleState === 1
                    ? "bg-green-500/20 text-green-400"
                    : presaleState === 0
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                {getStateLabel()}
              </span>
            </div>
            <p
              className="max-w-2xl mx-auto mt-3 text-sm font-light text-gray-300 sm:text-base"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              Track the progress of our token presale in real-time. Join over{" "}
              {isLoading || error ? "..." : participants.toLocaleString()}{" "}
              participants in this exciting opportunity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-3 sm:gap-6 sm:mt-10">
            <MetricBox
              label="Tokens Sold"
              value={isLoading || error ? "N/A" : tokensSold.toLocaleString()}
              subValue={`of ${
                isLoading || error ? "..." : hardCap.toLocaleString()
              }`}
              icon={<FaCoins />}
              color="from-yellow-400 to-yellow-600"
              delay={0.3}
              changePercentage={isLoading || error ? null : tokensSoldChange}
              isLoading={isLoading}
              hasError={!!error}
            />
            <MetricBox
              label="Participants"
              value={isLoading || error ? "N/A" : participants.toLocaleString()}
              subValue="Active Contributors"
              icon={<FaUsers />}
              color="from-blue-400 to-blue-600"
              delay={0.4}
              changePercentage={isLoading || error ? null : participantsChange}
              isLoading={isLoading}
              hasError={!!error}
            />
            <MetricBox
              label="Funds Raised"
              value={
                isLoading || error ? "N/A" : `$${fundsRaised.toLocaleString()}`
              }
              subValue="USD Equivalent"
              icon={<FaDollarSign />}
              color="from-green-400 to-green-600"
              delay={0.5}
              changePercentage={isLoading || error ? null : fundsRaisedChange}
              isLoading={isLoading}
              hasError={!!error}
            />
          </div>

          <div className="mt-10 sm:mt-12">
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-sm font-medium text-gray-300"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                Presale Progress
              </p>
              <p
                className="text-sm font-medium text-gray-300"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                {isLoading || error
                  ? "..."
                  : `${progress.toFixed(1)}% Complete`}
              </p>
            </div>
            <div className="relative w-full h-4 overflow-hidden bg-gray-800 rounded-full shadow-inner">
              <motion.div
                key={progress}
                className="relative h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                initial={{ width: "0%" }}
                animate={{ width: isLoading || error ? "0%" : `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                {(isLoading || error) && (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-pulse"></div>
                )}
              </motion.div>
            </div>
            <div className="flex justify-between mt-1">
              <span
                className="text-xs text-gray-400"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                0
              </span>
              <span
                className="text-xs text-gray-400"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                {isLoading || error ? "..." : hardCap.toLocaleString()}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-10 sm:mt-12"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <FaClock className="text-cyan-400" />
                <p
                  className="text-lg font-medium text-gray-300"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  {countdownLabel}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {formatTime(isLoading || error ? 0 : timeLeft).map(
                  (timeUnit, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="relative flex items-center justify-center w-20 px-4 py-3 overflow-hidden bg-gray-800 rounded-lg">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                        {isLoading || error ? (
                          <div className="w-12 h-8 bg-gray-700/50 rounded animate-pulse"></div>
                        ) : (
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={timeUnit.value}
                              initial={{ y: -20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 20, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-2xl font-bold text-white sm:text-3xl"
                              style={{ fontFamily: "'Orbitron', sans-serif" }}
                            >
                              {String(timeUnit.value).padStart(2, "0")}
                            </motion.span>
                          </AnimatePresence>
                        )}
                      </div>
                      <span
                        className="mt-1 text-xs font-medium text-gray-400"
                        style={{ fontFamily: "'Exo 2', sans-serif" }}
                      >
                        {timeUnit.label}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex justify-center mt-10 sm:mt-12"
          >
            <button
              className={`px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 ${
                !buttonConfig.disabled && !(isLoading || error)
                  ? "hover:scale-105"
                  : "opacity-50 cursor-not-allowed"
              }`}
              disabled={buttonConfig.disabled || isLoading || error}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {isLoading || error ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 animate-spin text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                buttonConfig.text
              )}
            </button>
          </motion.div>
        </div>
      </motion.div>

      <div
        className="mt-6 text-xs text-center text-gray-400"
        style={{ fontFamily: "'Exo 2', sans-serif" }}
      >
        <p>Last updated: {lastUpdated || "Awaiting data"}</p>
        <p>Time synchronized with blockchain</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed top-4 right-4 px-4 py-2 text-xs sm:text-sm text-red-400 border rounded-lg bg-red-600/20 border-red-500/50 shadow-lg z-30"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          <div className="flex items-center justify-between">
            <span>
              {error}. Retrying in {Math.min(10 * Math.pow(2, retryCount), 40)}
              s...
            </span>
            <button
              onClick={() => {
                setForceRefresh((prev) => !prev);
                setRetryCount((prev) => prev + 1);
              }}
              className="p-1 text-red-400 rounded-full hover:text-white hover:bg-red-500/50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0A8.003 8.003 0 0019.418 15m0 0H15"
                ></path>
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}

function MetricBox({
  label,
  value,
  subValue,
  icon,
  color,
  delay = 0,
  changePercentage = null,
  isLoading = false,
  hasError = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="p-6 transition-all duration-300 border shadow-lg bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl border-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-sm font-medium text-gray-400"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            {label}
          </p>
          <div className="flex items-center gap-2">
            <motion.p
              className="mt-1 text-2xl font-bold text-white sm:text-3xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.2 }}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {isLoading ? (
                <div className="w-24 h-8 bg-gray-700/50 rounded animate-pulse"></div>
              ) : (
                value
              )}
            </motion.p>
            {hasError && !isLoading && (
              <div className="relative group">
                <FaExclamationTriangle className="text-red-400 w-4 h-4" />
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-6 hidden group-hover:block px-2 py-1 text-xs bg-gray-800/80 border border-white/20 rounded shadow-lg text-red-400"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  Data unavailable
                </div>
              </div>
            )}
          </div>
          <p
            className="mt-1 text-xs text-gray-400"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            {isLoading ? (
              <div className="w-16 h-4 bg-gray-700/50 rounded animate-pulse"></div>
            ) : (
              subValue
            )}
          </p>
        </div>
        <div className={`bg-gradient-to-br ${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>

      {changePercentage && !isLoading && !hasError && (
        <div className="pt-4 mt-4 border-t border-gray-700/50">
          <div className="flex items-center">
            <div
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-400 rounded-full bg-green-500/20"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{changePercentage}</span>
            </div>
            <span
              className="ml-2 text-xs text-gray-400"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              from last update
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

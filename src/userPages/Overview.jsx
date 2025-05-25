import { ReferenceLine } from "recharts";
import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  XAxis,
  Legend,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  BarChart,
  Bar,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../DashboardLayout";
import { motion } from "framer-motion";
import {
  Clock,
  PieChart,
  Target,
  Award,
  Wallet,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { ethers } from "ethers";
import PresaleABI from "../abi/presaleABI";

export default function OverviewPage() {
  const { theme } = useTheme();
  const { walletConnected, signer, walletAddress, connectWallet } = useWallet();
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [presaleState, setPresaleState] = useState("NotStarted");
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeRewards, setRealTimeRewards] = useState("0");
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [stakingBreakdown, setStakingBreakdown] = useState([]);
  const [presaleData, setPresaleData] = useState({
    totalPurchased: "0",
    totalUSDTSpent: "0",
    remainingAllocation: "0",
    claimableTokens: "0",
    nextUnlock: "N/A",
    endTime: 0,
    userHardCap: "0",
    usdtDecimals: 6,
    startTime: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load environment variables
  const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
  const HPT_DECIMALS = Number(import.meta.env.VITE_HPT_DECIMALS) || 18;
  const REWARD_UPDATE_INTERVAL =
    Number(import.meta.env.VITE_REWARD_UPDATE_INTERVAL) || 30000;
  const STAKING_OPTIONS = import.meta.env.VITE_STAKING_OPTIONS
    ? JSON.parse(import.meta.env.VITE_STAKING_OPTIONS)
    : [
        { name: "6-Month", apr: 70, lockupSeconds: 6 * 30 * 24 * 60 * 60 },
        { name: "12-Month", apr: 150, lockupSeconds: 12 * 30 * 24 * 60 * 60 },
      ];

  // Validate environment variables
  useEffect(() => {
    if (!PRESALE_ADDRESS || !ethers.isAddress(PRESALE_ADDRESS)) {
      console.error("Invalid or missing VITE_PRESALE_CONTRACT_ADDRESS");
      setIsLoading(false);
      return;
    }
    console.log("Environment variables loaded:", {
      PRESALE_ADDRESS,
      HPT_DECIMALS,
      REWARD_UPDATE_INTERVAL,
      STAKING_OPTIONS,
    });
  }, []);

  // Fetch presale data
  const loadPresaleData = async () => {
    if (!walletConnected || !signer || !walletAddress) return;
    console.time("loadPresaleData");
    try {
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      const usdtAddress = await presaleContract.usdtToken();
      const usdtContract = new ethers.Contract(
        usdtAddress,
        ["function decimals() view returns (uint8)"],
        signer
      );

      const [
        usdtDecimals,
        totalUserPayment,
        participantData,
        estimatedRewards,
        totalAccumulatedRewards,
        claimableTokens,
        userHardCap,
        endTime,
        state,
        participationCount,
        startTime,
      ] = await Promise.all([
        usdtContract.decimals(),
        presaleContract.totalUserPayment(walletAddress),
        presaleContract.getParticipantData(walletAddress),
        presaleContract.getEstimatedRewards(walletAddress),
        presaleContract.totalAccumulatedRewards(walletAddress),
        presaleContract.calculateTotalClaimable(walletAddress),
        presaleContract.userHardCap(),
        presaleContract.endTime(),
        presaleContract.getCurrentPresaleState(),
        presaleContract.getParticipationCount(walletAddress),
        presaleContract.startTime(),
      ]);

      const participationPromises = Array(Number(participationCount))
        .fill()
        .map((_, i) =>
          presaleContract.getParticipationDetails(walletAddress, i)
        );
      const participationsRaw = await Promise.all(participationPromises);

      const participations = [
        {
          date: new Date(Number(startTime) * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          usdtSpent: 0,
          hptBought: 0,
        },
      ];
      let stakingData = STAKING_OPTIONS.map((option) => ({
        name: option.name,
        staked: BigInt(0),
        apr: option.apr,
        endDate: null,
      }));
      let nextUnlock = null;

      participationsRaw.forEach((participation) => {
        const purchaseTime =
          Number(participation.stakingEndTime) -
          Number(participation.stakingOption);
        participations.push({
          date: new Date(purchaseTime * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          usdtSpent: Number(
            ethers.formatUnits(participation.paymentAmount, usdtDecimals)
          ),
          hptBought: Number(
            ethers.formatUnits(participation.purchasedAmount, HPT_DECIMALS)
          ),
        });

        const stakingOption = Number(participation.stakingOption);
        const purchasedAmount = BigInt(participation.purchasedAmount);
        const stakingEndTime = Number(participation.stakingEndTime);

        const matchedOption = STAKING_OPTIONS.find(
          (opt) => opt.lockupSeconds === stakingOption
        );
        if (matchedOption) {
          const index = STAKING_OPTIONS.indexOf(matchedOption);
          stakingData[index].staked += purchasedAmount;
          stakingData[index].endDate = new Date(
            stakingEndTime * 1000
          ).toLocaleDateString();
        }

        const periodsPassed = Math.floor(
          (Date.now() / 1000 - Number(endTime)) / (60 * 24 * 60 * 60)
        );
        const nextUnlockTime =
          Number(endTime) + 60 * 24 * 60 * 60 * (periodsPassed + 1);
        if (!nextUnlock || nextUnlockTime < nextUnlock)
          nextUnlock = nextUnlockTime;
      });

      const totalStaked = stakingData.reduce(
        (sum, item) => sum + item.staked,
        BigInt(0)
      );
      const rewardsBN = BigInt(estimatedRewards);
      stakingData = stakingData.map((item) => ({
        ...item,
        rewards:
          totalStaked > 0
            ? Number(
                ethers.formatUnits(
                  (rewardsBN * item.staked) / totalStaked,
                  HPT_DECIMALS
                )
              )
            : 0,
        staked: Number(ethers.formatUnits(item.staked, HPT_DECIMALS)),
      }));

      setPurchaseHistory(participations);
      setStakingBreakdown(stakingData);

      setPresaleData({
        totalPurchased: ethers.formatUnits(
          participantData.totalPurchased,
          HPT_DECIMALS
        ),
        totalUSDTSpent: ethers.formatUnits(totalUserPayment, usdtDecimals),
        remainingAllocation: ethers.formatUnits(
          BigInt(userHardCap) - BigInt(totalUserPayment),
          usdtDecimals
        ),
        claimableTokens: ethers.formatUnits(claimableTokens, HPT_DECIMALS),
        nextUnlock: nextUnlock
          ? new Date(nextUnlock * 1000).toLocaleDateString()
          : "N/A",
        endTime: Number(endTime) * 1000,
        userHardCap: ethers.formatUnits(userHardCap, usdtDecimals),
        usdtDecimals,
        startTime: Number(startTime) * 1000,
      });

      setRealTimeRewards(ethers.formatUnits(estimatedRewards, HPT_DECIMALS));
      setPresaleState(
        ["NotStarted", "Active", "Ended", "ClaimOpen"][Number(state)]
      );
    } catch (err) {
      console.error("Failed to load presale data:", err);
    } finally {
      console.timeEnd("loadPresaleData");
      setIsLoading(false);
    }
  };

  // Claim rewards function
  const claimRewards = async () => {
    if (!signer) return;
    try {
      setIsLoading(true);
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      const tx = await presaleContract.claimRewards();
      await tx.wait();
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to claim rewards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced fetch with event listener
  useEffect(() => {
    let timeout;
    const debouncedLoad = () => {
      clearTimeout(timeout);
      setIsLoading(true);
      timeout = setTimeout(() => loadPresaleData(), 500);
    };

    debouncedLoad();

    if (signer) {
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      presaleContract.on("PresalePurchase", (user) => {
        if (user.toLowerCase() === walletAddress.toLowerCase()) debouncedLoad();
      });
      presaleContract.on("RewardsClaimed", (user) => {
        if (user.toLowerCase() === walletAddress.toLowerCase()) debouncedLoad();
      });
      return () => {
        presaleContract.removeAllListeners("PresalePurchase");
        presaleContract.removeAllListeners("RewardsClaimed");
        clearTimeout(timeout);
      };
    }
  }, [walletConnected, signer, walletAddress, refreshTrigger]);

  // Countdown timer
  useEffect(() => {
    let targetTime;
    if (presaleState === "NotStarted") targetTime = presaleData.startTime;
    else if (presaleState === "Active") targetTime = presaleData.endTime;
    else {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    if (!targetTime) return;

    const updateCountdown = () => {
      const timeLeft = targetTime - Date.now();
      if (timeLeft <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((timeLeft % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [presaleState, presaleData.startTime, presaleData.endTime]);

  // Real-time rewards update
  useEffect(() => {
    if (!walletConnected || !signer) return;
    const updateRewards = async () => {
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      const rewards = await presaleContract.getEstimatedRewards(walletAddress);
      setRealTimeRewards(ethers.formatUnits(rewards, HPT_DECIMALS));
    };
    updateRewards();
    const raiseTimer = setInterval(updateRewards, REWARD_UPDATE_INTERVAL);
    return () => clearInterval(raiseTimer);
  }, [walletConnected, signer, walletAddress, refreshTrigger]);

  if (!walletConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.button
          onClick={connectWallet}
          className="px-6 py-3 font-medium rounded-lg text-base"
          style={{
            background: `linear-gradient(to right, #3b82f6, #9333ea)`,
            color: `var(--color-text-on-color)`,
          }}
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
          className="w-16 h-16 border-t-4 border-b-4 rounded-full"
          style={{ borderColor: `var(--color-accent-blue)` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen p-6 space-y-6 font-sans"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-start), var(--color-bg-end))`,
        maxWidth: "100%",
        overflowX: "hidden",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Inline responsive styles */}
      <style>
        {`
          .glass {
            background: rgba(255, 255, 255, ${
              theme === "dark" ? "0.05" : "0.1"
            });
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .quick-stats-grid {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(4, 1fr);
          }

          .countdown-grid {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: repeat(4, 1fr);
          }

          .two-column-section {
            display: grid;
            gap: 1rem;
            grid-template-columns: 2fr 1fr;
          }

          @media (max-width: 640px) {
            .quick-stats-grid {
              grid-template-columns: 1fr;
            }
            .countdown-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .two-column-section {
              grid-template-columns: 1fr;
            }
            .p-6 {
              padding: min(1rem, 4vw);
            }
            .text-4xl {
              font-size: min(1.5rem, 6vw);
            }
            .text-2xl {
              font-size: min(1.25rem, 5vw);
            }
            .text-base {
              font-size: min(0.875rem, 4vw);
            }
            .h-80 {
              height: min(16rem, 45vh);
            }
            .h-64 {
              height: min(14rem, 40vh);
            }
          }

          @media (min-width: 641px) and (max-width: 767px) {
            .quick-stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .countdown-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            .two-column-section {
              grid-template-columns: 1fr;
            }
            .p-6 {
              padding: min(1.25rem, 3vw);
            }
            .h-80 {
              height: min(18rem, 50vh);
            }
            .h-64 {
              height: min(16rem, 45vh);
            }
          }

          @media (min-width: 768px) and (max-width: 1023px) {
            .quick-stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .countdown-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            .two-column-section {
              grid-template-columns: 1fr;
            }
            .p-6 {
              padding: min(1.5rem, 2.5vw);
            }
          }

          @media (min-width: 1024px) {
            .quick-stats-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            .countdown-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            .two-column-section {
              grid-template-columns: 2fr 1fr;
            }
          }

          /* Ensure touch-friendly buttons */
          button {
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
          }
        `}
      </style>

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{ color: `var(--color-text-header)` }}
          >
            Dashboard
          </h1>
          <p
            className="mt-1 text-base"
            style={{ color: `var(--color-text-sub)` }}
          >
            Track your presale participation and staking rewards
          </p>
        </div>
      </motion.div>

      {/* Overview Title */}
      <motion.h2
        className="text-2xl font-semibold"
        style={{ color: `var(--color-text-header)` }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Overview
      </motion.h2>

      {/* Quick Stats */}
      <motion.div
        className="quick-stats-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, staggerChildren: 0.1 }}
      >
        {[
          {
            title: "HPT Purchased",
            value: `${Number(presaleData.totalPurchased).toLocaleString(
              undefined,
              { maximumFractionDigits: 2 }
            )} HPT`,
            icon: PieChart,
            color: "#3b82f6",
            gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
            tooltip: "Total HPT tokens bought during the presale",
          },
          {
            title: "USDT Spent",
            value: `${Number(presaleData.totalUSDTSpent).toLocaleString(
              undefined,
              { maximumFractionDigits: 2 }
            )} USDT`,
            icon: Target,
            color: "#9333ea",
            gradient: "linear-gradient(135deg, #9333ea, #c084fc)",
            tooltip: "Total USDT spent on HPT purchases",
          },
          {
            title: "Staking Rewards",
            value: `${Number(realTimeRewards).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} HPT`,
            icon: Award,
            color: "#22c55e",
            gradient: "linear-gradient(135deg, #22c55e, #4ade80)",
            tooltip: "Real-time staking rewards earned",
          },
          {
            title: "Remaining Allocation",
            value: `${Number(presaleData.remainingAllocation).toLocaleString(
              undefined,
              { maximumFractionDigits: 2 }
            )} USDT`,
            icon: Wallet,
            color: "#eab308",
            gradient: "linear-gradient(135deg, #eab308, #facc15)",
            tooltip: `Remaining USDT available of your ${Number(
              presaleData.userHardCap
            ).toLocaleString()} USDT cap`,
          },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            className="relative p-4 overflow-hidden rounded-xl glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: stat.gradient }}
            />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p
                  className="text-base font-medium"
                  style={{ color: `var(--color-text-sub)` }}
                >
                  {stat.title}
                </p>
                <h3
                  className="mt-1 text-2xl font-bold"
                  style={{
                    color: `var(--color-text-body)`,
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {stat.value}
                </h3>
                <motion.p
                  className="mt-1 text-sm"
                  style={{ color: `var(--color-text-sub)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {stat.title === "Remaining Allocation" &&
                  Number(presaleData.remainingAllocation) <= 0
                    ? "Cap Reached"
                    : stat.title === "Staking Rewards" &&
                      Number(realTimeRewards) > 0
                    ? "Live Updates"
                    : "Current Total"}
                </motion.p>
              </div>
              <motion.div
                className="flex-shrink-0 p-2 rounded-full"
                style={{
                  background: `${stat.color}20`,
                  border: `1px solid ${stat.color}30`,
                }}
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon size={24} style={{ color: stat.color }} />
              </motion.div>
            </div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="p-2 text-sm rounded-lg shadow-lg"
                style={{
                  backgroundColor: "var(--color-card-bg)",
                  border: `1px solid ${stat.color}50`,
                  color: "var(--color-text-body)",
                }}
              >
                {stat.tooltip}
              </div>
            </motion.div>
            {stat.title === "Remaining Allocation" && (
              <motion.div
                className="w-full h-1 mt-2 overflow-hidden rounded-full"
                style={{ background: "var(--color-switch-off)" }}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div
                  className="h-full"
                  style={{
                    background: stat.gradient,
                    width: `${
                      (Number(presaleData.remainingAllocation) /
                        Number(presaleData.userHardCap)) *
                      100
                    }%`,
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4">
        {/* Purchase History */}
        <motion.div className="p-6 shadow-lg rounded-xl glass">
          <h2
            className="mb-4 text-xl font-semibold"
            style={{ color: `var(--color-text-body)` }}
          >
            Purchase History
          </h2>
          {purchaseHistory.length > 1 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={purchaseHistory}
                  margin={{ top: 10, right: 0, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorHpt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUsdt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis yAxisId="left" stroke="#888" />
                  <YAxis yAxisId="right" orientation="right" stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card-bg)",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      color: "var(--color-text-body)",
                    }}
                    formatter={(value, name) =>
                      name === "hptBought"
                        ? [`${value.toLocaleString()} HPT`, "HPT Bought"]
                        : [`${value.toLocaleString()} USDT`, "USDT Spent"]
                    }
                  />
                  <Legend />
                  <ReferenceLine
                    yAxisId="left"
                    x={new Date(presaleData.endTime).toLocaleDateString(
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
                    }}
                  />
                  <Area
                    yAxisId="left"
                    dataKey="hptBought"
                    stroke="#3b82f6"
                    fill="url(#colorHpt)"
                    strokeWidth={2}
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
                    dataKey="usdtSpent"
                    stroke="#9333ea"
                    fill="url(#colorUsdt)"
                    strokeWidth={2}
                    activeDot={{
                      r: 8,
                      fill: "#9333ea",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p
                className="text-base"
                style={{ color: `var(--color-text-sub)` }}
              >
                No purchases yet.{" "}
                <a
                  href="/dashboard/new"
                  style={{ color: `#3b82f6`, textDecoration: "underline" }}
                >
                  Buy HPT
                </a>{" "}
                to see your history!
              </p>
            </div>
          )}
          <style>
            {`
      @media (max-width: 640px) {
        .p-6 {
          padding: min(1rem, 4vw);
        }
        .h-80 {
          height: min(16rem, 45vh);
        }
        .recharts-text, .recharts-cartesian-axis-tick-value {
          font-size: min(12px, 3vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-default-tooltip {
          font-size: min(14px, 3.5vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-tooltip-label {
          font-size: min(12px, 3vw) !important;
        }
      }
      @media (min-width: 641px) and (max-width: 767px) {
        .p-6 {
          padding: min(1.25rem, 3vw);
        }
        .h-80 {
          height: min(18rem, 50vh);
        }
        .recharts-text, .recharts-cartesian-axis-tick-value {
          font-size: min(13px, 2.5vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-default-tooltip {
          font-size: min(15px, 3vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-tooltip-label {
          font-size: min(13px, 2.5vw) !important;
        }
      }
      @media (min-width: 768px) {
        .recharts-text, .recharts-cartesian-axis-tick-value {
          font-size: 14px !important;
        }
        .recharts-tooltip-wrapper .recharts-default-tooltip {
          font-size: 16px !important;
        }
        .recharts-tooltip-wrapper .recharts-tooltip-label {
          font-size: 14px !important;
        }
      }
    `}
          </style>
        </motion.div>

        {/* Two-Column Section */}
        <div className="two-column-section">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Staking Breakdown */}
              <motion.div className="p-6 shadow-lg rounded-xl glass">
                <h2
                  className="mb-4 text-xl font-semibold"
                  style={{ color: `var(--color-text-body)` }}
                >
                  Staking Breakdown
                </h2>
                {stakingBreakdown.some((option) => option.staked > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stakingBreakdown}
                        margin={{ top: 30, right: 0, left: 0, bottom: 10 }}
                        barSize={Math.min(40, window.innerWidth * 0.1)}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#444"
                          opacity={0.5}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#888"
                          tickLine={false}
                          padding={{ left: 20, right: 20 }}
                        />
                        <YAxis
                          stroke="#888"
                          tickLine={false}
                          label={{
                            value: "HPT",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#888",
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card-bg)",
                            border: "1px solid #444",
                            borderRadius: "8px",
                            color: "var(--color-text-body)",
                          }}
                          formatter={(value, name) => [
                            `${value.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })} HPT`,
                            name === "staked"
                              ? "Staked HPT"
                              : "Staking Rewards",
                          ]}
                          labelFormatter={(label) => `${label} Staking`}
                        />
                        <Legend wrapperStyle={{ paddingTop: 10 }} />
                        <Bar
                          dataKey="staked"
                          fill="#22c55e"
                          name="Staked HPT"
                          radius={[4, 4, 0, 0]}
                          animationDuration={1000}
                          animationEasing="ease-out"
                        >
                          <LabelList
                            dataKey="staked"
                            position="top"
                            formatter={(value) =>
                              value.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })
                            }
                            fill="#22c55e"
                            offset={8}
                            style={{ fontWeight: "bold" }}
                          />
                        </Bar>
                        <Bar
                          dataKey="rewards"
                          fill="#eab308"
                          name="Staking Rewards"
                          radius={[4, 4, 0, 0]}
                          animationDuration={1000}
                          animationEasing="ease-out"
                        >
                          <LabelList
                            dataKey="rewards"
                            position="top"
                            formatter={(value) =>
                              value.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })
                            }
                            fill="#eab308"
                            offset={8}
                            style={{ fontWeight: "bold" }}
                          />
                        </Bar>
                        {stakingBreakdown.map((entry, index) => (
                          <ReferenceLine
                            key={`apr-${index}`}
                            y={entry.staked + entry.rewards}
                            stroke="#9333ea"
                            strokeDasharray="5 5"
                            label={{
                              value: `${entry.apr}% APR`,
                              position: "insideTop",
                              fill: "#9333ea",
                              offset: 10,
                            }}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p
                      className="text-base"
                      style={{ color: `var(--color-text-sub)` }}
                    >
                      No staking activity yet.{" "}
                      <a
                        href="/dashboard/new"
                        style={{
                          color: `#3b82f6`,
                          textDecoration: "underline",
                        }}
                      >
                        Stake HPT
                      </a>{" "}
                      to see your breakdown!
                    </p>
                  </div>
                )}
                <style>
                  {`
      @media (max-width: 640px) {
        .p-6 {
          padding: min(1rem, 4vw);
        }
        .h-64 {
          height: min(14rem, 40vh);
        }
        .recharts-text, .recharts-cartesian-axis-tick-value {
          font-size: min(12px, 3vw) !important;
        }
        .recharts-label-list text {
          font-size: min(10px, 2.5vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-default-tooltip {
          font-size: min(14px, 3.5vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-tooltip-label {
          font-size: min(12px, 3vw) !important;
        }
      }
      @media (min-width: 641px) and (max-width: 767px) {
        .p-6 {
          padding: min(1.25rem, 3vw);
        }
        .h-64 {
          height: min(16rem, 45vh);
        }
        .recharts-text, .recharts-cartesian-axis-tick-value {
          font-size: min(13px, 2.5vw) !important;
        }
        .recharts-label-list text {
          font-size: min(11px, 2vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-default-tooltip {
          font-size: min(15px, 3vw) !important;
        }
        .recharts-tooltip-wrapper .recharts-tooltip-label {
          font-size: min(13px, 2.5vw) !important;
        }
      }
      @media (min-width: 768px) {
        .recharts-text, .recharts-cartesian-axis-tick-value {
          font-size: 14px !important;
        }
        .recharts-label-list text {
          font-size: 12px !important;
        }
        .recharts-tooltip-wrapper .recharts-default-tooltip {
          font-size: 16px !important;
        }
        .recharts-tooltip-wrapper .recharts-tooltip-label {
          font-size: 14px !important;
        }
      }
    `}
                </style>
              </motion.div>

              {/* Contribution Progress */}
              <motion.div
                className="p-6 shadow-lg rounded-xl glass"
                whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
              >
                <h2
                  className="mb-10 text-xl font-semibold"
                  style={{ color: `var(--color-text-body)` }}
                >
                  Contribution Progress
                </h2>
                <div className="flex flex-col items-center justify-center h-64">
                  <motion.div
                    className="relative"
                    style={{ width: "200px", height: "200px" }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <linearGradient
                          id="progressGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#9333ea" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="var(--color-switch-off)"
                        strokeWidth="10"
                        opacity={0.3}
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="url(#progressGradient)"
                        strokeWidth="10"
                        strokeDasharray={282.7}
                        strokeDashoffset={
                          282.7 *
                          (1 -
                            Math.min(
                              Number(presaleData.totalUSDTSpent) /
                                Number(presaleData.userHardCap),
                              1
                            ))
                        }
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        initial={{ strokeDashoffset: 282.7 }}
                        animate={{
                          strokeDashoffset:
                            282.7 *
                            (1 -
                              Math.min(
                                Number(presaleData.totalUSDTSpent) /
                                  Number(presaleData.userHardCap),
                                1
                              )),
                        }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="rgba(0, 0, 0, 0.1)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        className="text-3xl font-bold"
                        style={{ color: `var(--color-text-header)` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.8,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        {Math.round(
                          (Number(presaleData.totalUSDTSpent) /
                            Number(presaleData.userHardCap)) *
                            100
                        )}
                        %
                      </motion.span>
                      <motion.span
                        className="text-sm"
                        style={{ color: `var(--color-text-sub)` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                      >
                        {Number(presaleData.totalUSDTSpent) >=
                        Number(presaleData.userHardCap)
                          ? "Cap Reached"
                          : "Used"}
                      </motion.span>
                    </div>
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className="p-2 text-sm rounded-lg shadow-lg"
                        style={{
                          backgroundColor: "var(--color-card-bg)",
                          border: "1px solid #444",
                          color: "var(--color-text-body)",
                        }}
                      >
                        <p>
                          Spent:{" "}
                          {Number(presaleData.totalUSDTSpent).toLocaleString()}{" "}
                          USDT
                        </p>
                        <p>
                          Remaining:{" "}
                          {Number(
                            presaleData.remainingAllocation
                          ).toLocaleString()}{" "}
                          USDT
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                  <div
                    className="flex flex-col items-center mt-4 text-base"
                    style={{ color: `var(--color-text-sub)` }}
                  >
                    <span>
                      {Number(presaleData.totalUSDTSpent).toLocaleString()} /{" "}
                      {Number(presaleData.userHardCap).toLocaleString()} USDT
                    </span>
                    <motion.span
                      className="mt-1"
                      style={{
                        color:
                          Number(presaleData.remainingAllocation) > 0
                            ? "#22c55e"
                            : "#eab308",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.5 }}
                    >
                      {Number(presaleData.remainingAllocation).toLocaleString()}{" "}
                      USDT Remaining
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Countdown */}
            <motion.div
              className="relative p-6 overflow-hidden shadow-lg rounded-xl"
              style={{
                background: `linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9))`,
              }}
              whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)" }}
            >
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent)`,
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: `var(--color-text-on-color)` }}
                >
                  {presaleState === "NotStarted"
                    ? "Presale Starts In"
                    : "Presale Ends In"}
                </h2>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Clock
                    size={20}
                    style={{ color: `var(--color-text-on-color)` }}
                  />
                </motion.div>
              </div>
              <div className="countdown-grid text-center">
                {["days", "hours", "minutes", "seconds"].map((unit, index) => (
                  <motion.div
                    key={unit}
                    className="relative p-2 rounded-lg glass"
                    whileHover={{
                      scale: 1.1,
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    }}
                    transition={{ type: "spring", stiffness: 400 }}
                    animate={{
                      borderColor:
                        countdown[unit] <= (unit === "seconds" ? 10 : 1) &&
                        countdown.days === 0
                          ? "#ef4444"
                          : "transparent",
                    }}
                  >
                    <motion.div
                      className="text-2xl font-bold"
                      style={{
                        background: `linear-gradient(to bottom, var(--color-text-on-color), ${
                          index % 2 === 0 ? "#60a5fa" : "#c084fc"
                        })`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -2 }}
                    >
                      {countdown[unit].toString().padStart(2, "0")}
                    </motion.div>
                    <div
                      className="mt-1 text-sm"
                      style={{ color: `var(--color-text-on-color)` }}
                    >
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </div>
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className="p-1 text-sm rounded-md"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "var(--color-text-on-color)",
                        }}
                      >
                        {unit === "days"
                          ? `${countdown[unit]} days remaining`
                          : `${countdown[unit]} ${unit}`}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
              {countdown.days === 0 &&
                countdown.hours <= 1 &&
                presaleState === "Active" && (
                  <motion.div
                    className="mt-4 font-medium text-center text-base"
                    style={{ color: "#ef4444" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    Ending Soon!
                  </motion.div>
                )}
              {countdown.days === 0 &&
                countdown.hours === 0 &&
                countdown.minutes === 0 &&
                countdown.seconds === 0 && (
                  <motion.div
                    className="mt-4 font-medium text-center text-base"
                    style={{ color: "#eab308" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {presaleState === "NotStarted"
                      ? "Presale Starting"
                      : "Presale Ended"}
                  </motion.div>
                )}
            </motion.div>

            {/* Allocation */}
            <motion.div
              className="relative p-6 overflow-hidden shadow-lg rounded-xl glass"
              whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, #3b82f6, #9333ea)`,
                }}
              />
              <div className="relative flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: `var(--color-text-body)` }}
                >
                  Your Allocation
                </h2>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Wallet
                    size={20}
                    style={{ color: `var(--color-text-sub)` }}
                  />
                </motion.div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "Your Limit",
                    value: `${Number(presaleData.userHardCap).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 2 }
                    )} USDT`,
                    width: "100%",
                    color: "#22c55e",
                    gradient: "linear-gradient(to right, #22c55e, #4ade80)",
                    tooltip: "Your maximum USDT allocation",
                    icon: Target,
                  },
                  {
                    label: "Purchased",
                    value: `${Number(presaleData.totalPurchased).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 2 }
                    )} HPT`,
                    width: `${Math.min(
                      (Number(presaleData.totalUSDTSpent) /
                        Number(presaleData.userHardCap)) *
                        100,
                      100
                    )}%`,
                    color: "#3b82f6",
                    gradient: "linear-gradient(to right, #3b82f6, #60a5fa)",
                    tooltip: "HPT tokens purchased so far",
                    icon: PieChart,
                  },
                  {
                    label: "Claimable Now",
                    value: `${Number(
                      presaleData.claimableTokens
                    ).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })} HPT`,
                    width: "auto",
                    color: "#9333ea",
                    gradient: "linear-gradient(to right, #9333ea, #c084fc)",
                    tooltip: "HPT tokens available to claim now",
                    icon: Award,
                  },
                  {
                    label: "Next Unlock",
                    value: presaleData.nextUnlock,
                    width: "auto",
                    color: "#eab308",
                    gradient: "linear-gradient(to right, #eab308, #facc15)",
                    tooltip: "Date of your next token unlock",
                    icon: Clock,
                  },
                  {
                    label: "Staking Rewards",
                    value: `${Number(realTimeRewards).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 2 }
                    )} HPT`,
                    width: "auto",
                    color: "#22c55e",
                    gradient: "linear-gradient(to right, #22c55e, #4ade80)",
                    tooltip: "Current staking rewards earned",
                    icon: Award,
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="relative"
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center space-x-2">
                        <item.icon size={20} style={{ color: item.color }} />
                        <span style={{ color: `var(--color-text-sub)` }}>
                          {item.label}
                        </span>
                      </div>
                      <span
                        style={{
                          color:
                            Number(presaleData.totalUSDTSpent) >=
                              Number(presaleData.userHardCap) &&
                            item.label === "Purchased"
                              ? "#eab308"
                              : `var(--color-text-header)`,
                          fontWeight: "bold",
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                    {item.width !== "auto" && (
                      <div
                        className="w-full h-2 mt-2 overflow-hidden rounded-full"
                        style={{ background: `var(--color-switch-off)` }}
                      >
                        <motion.div
                          className="h-2 rounded-full"
                          style={{ background: item.gradient }}
                          initial={{ width: 0 }}
                          animate={{ width: item.width }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    )}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className="p-2 text-sm rounded-lg shadow-lg"
                        style={{
                          backgroundColor: "var(--color-card-bg)",
                          border: `1px solid ${item.color}50`,
                          color: "var(--color-text-body)",
                        }}
                      >
                        {item.tooltip}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
                <motion.button
                  className="relative w-full px-4 py-3 overflow-hidden font-medium rounded-lg"
                  style={{ color: `var(--color-text-on-color)` }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => (window.location.href = "/dashboard/new")}
                  disabled={Number(presaleData.remainingAllocation) <= 0}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to right, #3b82f6, #9333ea)`,
                    }}
                  />
                  <span className="relative z-10">
                    {Number(presaleData.remainingAllocation) <= 0
                      ? "Allocation Full"
                      : "Buy More Tokens"}
                  </span>
                </motion.button>
              </div>
            </motion.div>

            {/* Staking Options */}
            <motion.div
              className="relative p-6 overflow-hidden shadow-lg rounded-xl glass"
              whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, #3b82f6, #9333ea)`,
                }}
              />
              <div className="relative flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: `var(--color-text-body)` }}
                >
                  Your Staking Options
                </h2>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Award size={20} style={{ color: `var(--color-text-sub)` }} />
                </motion.div>
              </div>
              <div className="space-y-4">
                {stakingBreakdown.map((option, index) => {
                  const endDate = option.endDate
                    ? new Date(option.endDate)
                    : null;
                  const now = new Date();
                  const daysRemaining = endDate
                    ? Math.max(
                        0,
                        Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
                      )
                    : 0;
                  const isActive = option.staked > 0;

                  return (
                    <motion.div
                      key={option.name}
                      className="relative p-3 overflow-hidden rounded-lg"
                      style={{ background: `var(--color-bg-start)` }}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                      <div
                        className="absolute top-0 left-0 w-1 h-full"
                        style={{
                          background: isActive
                            ? `linear-gradient(to bottom, ${
                                option.name === "6-Month"
                                  ? "#22c55e"
                                  : "#9333ea"
                              }, ${
                                option.name === "6-Month"
                                  ? "#4ade80"
                                  : "#c084fc"
                              })`
                            : "gray",
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Clock
                              size={20}
                              style={{
                                color: isActive
                                  ? option.name === "6-Month"
                                    ? "#22c55e"
                                    : "#9333ea"
                                  : "#888",
                              }}
                            />
                            <h3
                              className="text-base font-medium"
                              style={{ color: `var(--color-text-header)` }}
                            >
                              {option.name}
                            </h3>
                          </div>
                          <div className="mt-2 space-y-1 text-base">
                            <p style={{ color: `var(--color-text-sub)` }}>
                              <span
                                className="font-medium"
                                style={{ color: isActive ? "#22c55e" : "#888" }}
                              >
                                Staked:
                              </span>{" "}
                              {option.staked.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              HPT
                            </p>
                            <p style={{ color: `var(--color-text-sub)` }}>
                              <span
                                className="font-medium"
                                style={{ color: "#eab308" }}
                              >
                                APR:
                              </span>{" "}
                              {option.apr}%
                            </p>
                            <p style={{ color: `var(--color-text-sub)` }}>
                              <span
                                className="font-medium"
                                style={{ color: "#9333ea" }}
                              >
                                Rewards:
                              </span>{" "}
                              {option.rewards.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              HPT
                            </p>
                            {isActive && (
                              <p style={{ color: `var(--color-text-sub)` }}>
                                <span
                                  className="font-medium"
                                  style={{
                                    color:
                                      daysRemaining <= 7 ? "#ef4444" : "#888",
                                  }}
                                >
                                  Ends:
                                </span>{" "}
                                {option.endDate} ({daysRemaining} days)
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <div
                              className="w-full h-1 mt-2 overflow-hidden rounded-full"
                              style={{ background: `var(--color-switch-off)` }}
                            >
                              <motion.div
                                className="h-1 rounded-full"
                                style={{
                                  background: `linear-gradient(to right, ${
                                    option.name === "6-Month"
                                      ? "#22c55e"
                                      : "#9333ea"
                                  }, ${
                                    option.name === "6-Month"
                                      ? "#4ade80"
                                      : "#c084fc"
                                  })`,
                                  width: `${
                                    (daysRemaining /
                                      (option.name === "6-Month" ? 180 : 365)) *
                                    100
                                  }%`,
                                }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${
                                    (daysRemaining /
                                      (option.name === "6-Month" ? 180 : 365)) *
                                    100
                                  }%`,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          )}
                        </div>
                        <motion.div
                          className="p-2 rounded-full"
                          style={{
                            background: isActive
                              ? `${
                                  option.name === "6-Month"
                                    ? "#22c55e"
                                    : "#9333ea"
                                }20`
                              : "#88888820",
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {isActive ? (
                            <Check
                              size={20}
                              style={{
                                color:
                                  option.name === "6-Month"
                                    ? "#22c55e"
                                    : "#9333ea",
                              }}
                            />
                          ) : (
                            <X size={20} style={{ color: "#888" }} />
                          )}
                        </motion.div>
                      </div>
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0, y: 5 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          className="p-2 text-sm rounded-lg shadow-lg"
                          style={{
                            backgroundColor: "var(--color-card-bg)",
                            border: `1px solid ${
                              isActive
                                ? option.name === "6-Month"
                                  ? "#22c55e"
                                  : "#9333ea"
                                : "#888"
                            }50`,
                            color: "var(--color-text-body)",
                          }}
                        >
                          {isActive
                            ? `${option.name} staking active with ${option.rewards} HPT rewards`
                            : `No ${option.name} stake yet`}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
                <motion.button
                  className="relative w-full px-4 py-3 overflow-hidden font-medium rounded-lg"
                  style={{ color: `var(--color-text-on-color)` }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => (window.location.href = "/dashboard/new")}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to right, #3b82f6, #9333ea)`,
                    }}
                  />
                  <span className="relative z-10">Stake More Tokens</span>
                </motion.button>
                <motion.button
                  className="relative w-full px-4 py-3 overflow-hidden font-medium rounded-lg"
                  style={{ color: `var(--color-text-on-color)` }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={claimRewards}
                  disabled={Number(realTimeRewards) <= 0}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to right, #22c55e, #4ade80)`,
                    }}
                  />
                  <span className="relative z-10">
                    {Number(realTimeRewards) <= 0
                      ? "No Rewards"
                      : "Claim Rewards"}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Notification */}
        <motion.div
          className="p-6 shadow-lg rounded-xl glass"
          style={{
            background: `linear-gradient(to right, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.2))`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-start">
            <AlertTriangle
              size={20}
              className="flex-shrink-0 mt-1 mr-3 text-yellow-400"
            />
            <div>
              <h3
                className="text-xl font-semibold"
                style={{ color: `var(--color-text-body)` }}
              >
                Real-Time Updates
              </h3>
              <p
                className="text-base"
                style={{ color: `var(--color-text-sub)` }}
              >
                Your rewards are updating live! Presale ends on{" "}
                {new Date(presaleData.endTime).toLocaleDateString()}.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

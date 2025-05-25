import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
  Brush,
} from "recharts";
import { useTheme } from "../DashboardLayout";
import {
  TrendingUp,
  Coins,
  Clock,
  Gift,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  Download,
  Info,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import PresaleABI from "../abi/presaleABI";

const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const HPT_DECIMALS = Number(import.meta.env.VITE_HPT_DECIMALS) || 18;
const SECONDS_PER_MONTH =
  Number(import.meta.env.VITE_SECONDS_PER_MONTH) || 30 * 24 * 60 * 60;
const SECONDS_PER_YEAR =
  Number(import.meta.env.VITE_SECONDS_PER_YEAR) || 365 * 24 * 60 * 60;
const PLATFORM_NAME =
  import.meta.env.VITE_PLATFORM_NAME || "HPT Staking Platform";
const START_BLOCK = Number(import.meta.env.VITE_START_BLOCK) || 8403060;

export default function ClaimRewards() {
  const { theme } = useTheme();
  const { walletConnected, signer, walletAddress, connectWallet } = useWallet();
  const [rewardsData, setRewardsData] = useState({
    currentAccumulatedRewards: 0,
    stakingOptions: [],
    totalStaked: 0,
    totalTokenClaimed: 0,
    rewardsProjection: [],
    rewardClaimHistory: [],
  });
  const [activeModal, setActiveModal] = useState(null);
  const [claimAnimation, setClaimAnimation] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tokenDecimals, setTokenDecimals] = useState(HPT_DECIMALS);

  // Validate environment variables
  useEffect(() => {
    if (!PRESALE_ADDRESS || !ethers.isAddress(PRESALE_ADDRESS)) {
      console.error("Invalid or missing VITE_PRESALE_CONTRACT_ADDRESS");
      setError("Invalid contract address configuration");
      setIsLoading(false);
      return;
    }
    console.log("Environment variables loaded:", {
      PRESALE_ADDRESS,
      HPT_DECIMALS,
      SECONDS_PER_MONTH,
      SECONDS_PER_YEAR,
      PLATFORM_NAME,
      START_BLOCK,
    });
    setIsClient(true);
  }, []);

  const loadRewardsData = async () => {
    if (!walletConnected || !signer || !walletAddress) return;
    try {
      setIsLoading(true);
      const provider = signer.provider;
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

      const participantData = await presaleContract.getParticipantData(
        walletAddress
      );
      const participationCount = Number(
        await presaleContract.getParticipationCount(walletAddress)
      );
      const estimatedRewards = BigInt(
        await presaleContract.getEstimatedRewards(walletAddress)
      );
      const isPaused = await presaleContract.paused();
      const currentBlock = await provider.getBlock("latest");
      const currentTime = currentBlock.timestamp;

      let totalStaked = Number(
        ethers.formatUnits(participantData.totalPurchased, decimals)
      );
      let totalTokenClaimed = Number(
        ethers.formatUnits(participantData.totalClaimed, decimals)
      );
      let currentAccumulatedRewards = Number(
        ethers.formatUnits(estimatedRewards, decimals)
      );

      if (participationCount === 0) {
        setRewardsData({
          currentAccumulatedRewards: 0,
          stakingOptions: [],
          totalStaked: 0,
          totalTokenClaimed: 0,
          rewardsProjection: [],
          rewardClaimHistory: [],
        });
        setPaused(isPaused);
        setIsLoading(false);
        return;
      }

      const participations = await Promise.all(
        Array.from({ length: participationCount }, (_, i) =>
          presaleContract.getParticipationDetails(walletAddress, i)
        )
      );
      const stakingOptions = participations.map((p, i) => ({
        id: `P${i + 1}`,
        months: Number(p.stakingOption) / SECONDS_PER_MONTH,
        apr: Number(p.stakingAPR),
        staked: Number(ethers.formatUnits(p.purchasedAmount, decimals)),
        startTime: Number(p.lastRewardCalculationTime || currentTime),
        endTime: Number(p.stakingEndTime),
        lastRewardTime: Number(p.lastRewardCalculationTime),
      }));

      const earliestStart = Math.min(
        ...stakingOptions.map((opt) => opt.startTime)
      );
      const latestEnd = Math.max(...stakingOptions.map((opt) => opt.endTime));
      const totalMonths =
        Math.ceil((latestEnd - earliestStart) / SECONDS_PER_MONTH) + 1;
      const rewardsProjection = [];

      for (let month = 0; month < totalMonths; month++) {
        const monthStart = earliestStart + month * SECONDS_PER_MONTH;
        const monthEnd = monthStart + SECONDS_PER_MONTH;
        let totalRewards = 0;
        const breakdown = {};
        stakingOptions.forEach((opt) => {
          const reward =
            monthEnd <= opt.startTime || monthStart >= opt.endTime
              ? 0
              : (((opt.staked * (opt.apr * 1e18)) / (100 * SECONDS_PER_YEAR)) *
                  (Math.min(monthEnd, opt.endTime) -
                    Math.max(opt.startTime, monthStart))) /
                1e18;
          breakdown[opt.id] = reward;
          totalRewards += reward;
        });
        rewardsProjection.push({
          month: new Date(monthStart * 1000).toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          totalRewards,
          breakdown,
        });
      }

      // Fetch RewardsClaimed events with limited block range
      const latestBlock = await provider.getBlockNumber();
      console.log(
        `Querying RewardsClaimed events from block ${START_BLOCK} to ${latestBlock}`
      );
      const blockRange = 500; // Complies with RPC limit
      const filter = presaleContract.filters.RewardsClaimed(walletAddress);
      let events = [];

      for (
        let fromBlock = START_BLOCK;
        fromBlock <= latestBlock;
        fromBlock += blockRange
      ) {
        const toBlock = Math.min(fromBlock + blockRange - 1, latestBlock);
        console.log(
          `Fetching RewardsClaimed events from ${fromBlock} to ${toBlock}`
        );
        const batchEvents = await presaleContract
          .queryFilter(filter, fromBlock, toBlock)
          .catch((err) => {
            console.error(
              `Error querying RewardsClaimed from ${fromBlock} to ${toBlock}:`,
              err
            );
            return [];
          });
        events = events.concat(batchEvents);
      }

      const rewardClaimHistory = await Promise.all(
        events.map(async (event) => ({
          date: new Date((await event.getBlock()).timestamp * 1000),
          amount: Number(ethers.formatUnits(event.args.amount, decimals)),
          transactionHash: event.transactionHash,
          platform: PLATFORM_NAME,
        }))
      );
      rewardClaimHistory.reverse();

      setRewardsData({
        currentAccumulatedRewards,
        stakingOptions,
        totalStaked,
        totalTokenClaimed,
        rewardsProjection,
        rewardClaimHistory,
      });
      setPaused(isPaused);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading rewards data:", err);
      setError("Failed to load rewards data. Please try again.");
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (
      !walletConnected ||
      !signer ||
      paused ||
      rewardsData.currentAccumulatedRewards <= 0
    )
      return;
    try {
      setClaimAnimation(true);
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      const tx = await presaleContract.claimRewards();
      const receipt = await tx.wait();
      const claimedAmount = rewardsData.currentAccumulatedRewards;
      await loadRewardsData();
      setClaimAnimation(false);
      setSelectedClaim({
        amount: claimedAmount,
        date: new Date(),
        transactionHash: tx.hash,
      });
      setActiveModal("claimConfirmation");
    } catch (err) {
      console.error("Error claiming rewards:", err);
      setError(
        err.reason ||
          "Failed to claim rewards. Check your wallet and try again."
      );
      setClaimAnimation(false);
    }
  };

  useEffect(() => {
    if (walletConnected && signer && walletAddress) {
      loadRewardsData();
    }
  }, [walletConnected, signer, walletAddress]);

  const totalClaimedRewards = useMemo(
    () =>
      rewardsData.rewardClaimHistory.reduce(
        (sum, claim) => sum + claim.amount,
        0
      ),
    [rewardsData.rewardClaimHistory]
  );

  const handleClaimDetails = (claim) => {
    setSelectedClaim(claim);
    setActiveModal("claimDetails");
  };

  const renderRewardsProjectionChart = () => {
    if (!isClient) return null;
    const barColor = "#9333ea";
    const brushColor = theme === "dark" ? "#c084fc" : "#9333ea";
    const width = window.innerWidth;
    const chartHeight = width < 640 ? 250 : width < 1024 ? 300 : 350;
    const barSize = width < 640 ? 15 : width < 1024 ? 18 : 20;

    return (
      <div id="rewards-projection-chart">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={rewardsData.rewardsProjection}
            margin={{ top: 30, right: 10, left: -10, bottom: 20 }}
            barSize={barSize}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={barColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={barColor} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
            <XAxis
              dataKey="month"
              stroke="var(--color-text-sub)"
              tick={{
                fontSize: width < 640 ? "0.625rem" : "0.75rem",
                fill: "var(--color-text-sub)",
              }}
              label={{
                value: "Months",
                position: "insideBottom",
                offset: -10,
                fill: "var(--color-text-sub)",
                fontSize: width < 640 ? "0.75rem" : "0.875rem",
              }}
            />
            <YAxis
              domain={[0, (dataMax) => Math.ceil(dataMax * 1.5)]}
              stroke="var(--color-text-sub)"
              tick={{
                fontSize: width < 640 ? "0.625rem" : "0.75rem",
                fill: "var(--color-text-sub)",
              }}
              label={{
                value: "Rewards (HPT)",
                angle: -90,
                position: "insideLeft",
                fill: "var(--color-text-sub)",
                fontSize: width < 640 ? "0.75rem" : "0.875rem",
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  const breakdown = rewardsData.rewardsProjection.find(
                    (p) => p.month === label
                  ).breakdown;
                  return (
                    <div
                      style={{
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(30, 41, 59, 0.9)"
                            : "rgba(255, 255, 255, 0.9)",
                        border: `1px solid ${
                          theme === "dark" ? "#4b5563" : "#d1d5db"
                        }`,
                        borderRadius: "8px",
                        padding: "10px",
                        color: theme === "dark" ? "#e5e7eb" : "#1f2937",
                        fontSize: width < 640 ? "0.75rem" : "0.875rem",
                      }}
                    >
                      <strong>{label}</strong>
                      <p>{`Total: ${payload[0].value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} HPT`}</p>
                      {Object.entries(breakdown).map(
                        ([id, reward]) =>
                          reward > 0 && (
                            <p key={id}>{`${id}: ${reward.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )} HPT`}</p>
                          )
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={() => (
                <span
                  style={{
                    color: "var(--color-text-body)",
                    fontSize: width < 640 ? "0.75rem" : "0.875rem",
                  }}
                >
                  Total Rewards
                </span>
              )}
            />
            <Bar
              dataKey="totalRewards"
              fill="url(#barGradient)"
              name="Total Rewards"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="totalRewards"
                position="top"
                formatter={(value) =>
                  value > 0
                    ? value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : ""
                }
                fill={barColor}
                fontSize={width < 640 ? "0.625rem" : "0.75rem"}
                offset={8}
              />
            </Bar>
            <Brush
              dataKey="month"
              height={30}
              stroke={brushColor}
              fill={theme === "dark" ? "#1e293b" : "#e5e7eb"}
              travellerWidth={10}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderRewardsOverTimeChart = () => {
    if (!isClient) return null;
    const lineColor = "#9333ea";
    const width = window.innerWidth;
    const chartHeight = width < 640 ? 250 : width < 1024 ? 300 : 350;

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={rewardsData.rewardsProjection}
          margin={{ top: 30, right: 10, left: -10, bottom: 20 }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
          <XAxis
            dataKey="month"
            stroke="var(--color-text-sub)"
            tick={{
              fontSize: width < 640 ? "0.625rem" : "0.75rem",
              fill: "var(--color-text-sub)",
            }}
            label={{
              value: "Months",
              position: "insideBottom",
              offset: -10,
              fill: "var(--color-text-sub)",
              fontSize: width < 640 ? "0.75rem" : "0.875rem",
            }}
          />
          <YAxis
            domain={[0, (dataMax) => Math.ceil(dataMax * 1.5)]}
            stroke="var(--color-text-sub)"
            tick={{
              fontSize: width < 640 ? "0.625rem" : "0.75rem",
              fill: "var(--color-text-sub)",
            }}
            label={{
              value: "Rewards (HPT)",
              angle: -90,
              position: "insideLeft",
              fill: "var(--color-text-sub)",
              fontSize: width < 640 ? "0.75rem" : "0.875rem",
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload?.length) {
                const breakdown = rewardsData.rewardsProjection.find(
                  (p) => p.month === label
                ).breakdown;
                return (
                  <div
                    style={{
                      backgroundColor:
                        theme === "dark"
                          ? "rgba(30, 41, 59, 0.9)"
                          : "rgba(255, 255, 255, 0.9)",
                      border: `1px solid ${
                        theme === "dark" ? "#4b5563" : "#d1d5db"
                      }`,
                      borderRadius: "8px",
                      padding: "10px",
                      color: theme === "dark" ? "#e5e7eb" : "#1f2937",
                      fontSize: width < 640 ? "0.75rem" : "0.875rem",
                    }}
                  >
                    <strong>{label}</strong>
                    <p>{`Total: ${payload[0].value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })} HPT`}</p>
                    {Object.entries(breakdown).map(
                      ([id, reward]) =>
                        reward > 0 && (
                          <p key={id}>{`${id}: ${reward.toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )} HPT`}</p>
                        )
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={() => (
              <span
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: width < 640 ? "0.75rem" : "0.875rem",
                }}
              >
                Total Rewards
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="totalRewards"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            name="Total Rewards"
            activeDot={{
              r: 8,
              fill: lineColor,
              stroke: "var(--color-card-bg)",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (!walletConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.button
          onClick={connectWallet}
          className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm font-medium rounded-lg"
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

  const uniqueStakingOptions = Array.from(
    new Map(
      rewardsData.stakingOptions.map((opt) => [`${opt.months}-${opt.apr}`, opt])
    ).values()
  );

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 space-y-8 font-sans"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-start), var(--color-bg-end))`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-7xl">
        <motion.h1
          className="mb-6 text-xl sm:text-2xl md:text-3xl font-semibold"
          style={{ color: `var(--color-text-header)` }}
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Rewards
        </motion.h1>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between p-3 sm:p-4 mb-6 rounded-lg"
              style={{
                background: `rgba(239, 68, 68, 0.2)`,
                border: `1px solid rgba(239, 68, 68, 0.3)`,
              }}
            >
              <div className="flex items-center">
                <Info
                  size={16}
                  style={{ color: `var(--color-accent-red)` }}
                  className="mr-2 sm:mr-3"
                />
                <span style={{ color: `var(--color-text-body)` }}>{error}</span>
              </div>
              <button onClick={() => setError(null)}>
                <X size={16} style={{ color: `var(--color-accent-red)` }} />
              </button>
            </motion.div>
          )}
          {paused && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center p-3 sm:p-4 mb-6 rounded-lg"
              style={{
                background: `rgba(234, 179, 8, 0.2)`,
                border: `1px solid rgba(234, 179, 8, 0.3)`,
              }}
            >
              <Info
                size={16}
                style={{ color: `var(--color-accent-yellow)` }}
                className="mr-2"
              />
              <span style={{ color: `var(--color-text-body)` }}>
                Presale is paused. Reward claims are temporarily disabled.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {rewardsData.totalStaked === 0 ? (
          <motion.div
            className="p-4 sm:p-6 text-center rounded-xl glass"
            style={{
              background: `var(--color-card-bg)`,
              border: `1px solid var(--color-border)`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p style={{ color: `var(--color-text-sub)` }}>
              No staking activity yet. Start staking to earn rewards!
            </p>
            <motion.button
              className="px-4 py-2 mt-4 text-xs sm:px-6 sm:py-3 sm:text-sm font-medium rounded-lg"
              style={{
                background: `linear-gradient(to right, #3b82f6, #9333ea)`,
                color: `var(--color-text-on-color)`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (window.location.href = "/dashboard/new")}
            >
              Stake Now
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <motion.div
              className="space-y-4 sm:space-y-6 lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Rewards Overview */}
              <motion.div
                className="relative p-4 sm:p-6 overflow-hidden rounded-xl glass"
                whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, #3b82f6, #9333ea)`,
                  }}
                />
                <div className="relative flex flex-col items-start justify-between mb-4 sm:mb-6 sm:flex-row sm:items-center">
                  <h2
                    className="text-base sm:text-lg md:text-xl font-semibold"
                    style={{ color: `var(--color-text-body)` }}
                  >
                    Rewards Overview
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaimRewards}
                    disabled={
                      claimAnimation ||
                      paused ||
                      rewardsData.currentAccumulatedRewards <= 0
                    }
                    className="relative flex items-center justify-center w-full px-3 py-3 mt-3 text-xs sm:px-4 sm:py-2 sm:text-sm sm:mt-0 sm:w-auto overflow-hidden rounded-lg"
                    style={{
                      color: `var(--color-text-on-color)`,
                      cursor:
                        claimAnimation ||
                        paused ||
                        rewardsData.currentAccumulatedRewards <= 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          claimAnimation ||
                          paused ||
                          rewardsData.currentAccumulatedRewards <= 0
                            ? `var(--color-switch-off)`
                            : `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))`,
                      }}
                    />
                    <span className="relative z-10">
                      {claimAnimation ? (
                        <div className="flex items-center">
                          <RefreshCw size={15} className="mr-1 animate-spin " />
                          Processing...
                        </div>
                      ) : (
                        "Claim Rewards"
                      )}
                    </span>
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: Coins,
                      label: "Current Rewards",
                      value: rewardsData.currentAccumulatedRewards,
                      color: "#3b82f6",
                    },
                    {
                      icon: TrendingUp,
                      label: "Max APR",
                      value: `${
                        rewardsData.stakingOptions.length > 0
                          ? Math.max(
                              ...rewardsData.stakingOptions.map((o) => o.apr)
                            )
                          : 0
                      }%`,
                      color: "#9333ea",
                    },
                    {
                      icon: Clock,
                      label: "Max Staking Period",
                      value: `${
                        rewardsData.stakingOptions.length > 0
                          ? Math.max(
                              ...rewardsData.stakingOptions.map((o) => o.months)
                            )
                          : 0
                      } Months`,
                      color: "#22c55e",
                    },
                    {
                      icon: Gift,
                      label: "Total Staked",
                      value: rewardsData.totalStaked,
                      color: "#eab308",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="relative p-4 rounded-lg"
                      style={{ background: `var(--color-bg-start)` }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center mb-2">
                        <item.icon
                          size={20}
                          style={{ color: item.color, marginRight: "8px" }}
                          className=""
                        />
                        <span style={{ color: `var(--color-text-sub)` }}>
                          {item.label}
                        </span>
                      </div>
                      <p
                        className="text-base sm:text-lg md:text-xl font-bold"
                        style={{ color: `var(--color-text-header)` }}
                      >
                        {typeof item.value === "number"
                          ? item.value.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })
                          : item.value}{" "}
                        {item.label === "Max APR" ||
                        item.label === "Max Staking Period"
                          ? ""
                          : "HPT"}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Charts */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <motion.div
                  className="p-4 sm:p-6 rounded-xl glass"
                  whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                >
                  <h3
                    className="mb-4 text-base sm:text-lg font-semibold"
                    style={{ color: `var(--color-text-body)` }}
                  >
                    Monthly Rewards Projection
                  </h3>
                  <div
                    className="rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      boxShadow: `inset 0 2px 10px rgba(0, 0, 0, 0.05)`,
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="projection"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {renderRewardsProjectionChart()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
                <motion.div
                  className="p-4 sm:p-6 rounded-xl glass"
                  whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                >
                  <h3
                    className="mb-4 text-base sm:text-lg font-semibold"
                    style={{ color: `var(--color-text-body)` }}
                  >
                    Rewards Over Time
                  </h3>
                  <div
                    className="rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      boxShadow: `inset 0 2px 10px rgba(0, 0, 0, 0.05)`,
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="over-time"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {renderRewardsOverTimeChart()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column */}
            <motion.div
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Reward Calculation */}
              <motion.div
                className="relative p-4 sm:p-6 overflow-hidden rounded-xl glass"
                whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, #eab308, #facc15)`,
                  }}
                />
                <div className="relative flex items-center justify-between mb-4">
                  <h3
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: `var(--color-text-body)` }}
                  >
                    Reward Calculation
                  </h3>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Info
                      size={20}
                      style={{ color: `var(--color-accent-yellow)` }}
                      className=""
                    />
                  </motion.div>
                </div>
                <div
                  className="space-y-3 text-xs sm:text-sm"
                  style={{ color: `var(--color-text-sub)` }}
                >
                  <p>
                    Rewards are calculated based on your staked amount and
                    duration.
                  </p>
                  {uniqueStakingOptions.map((opt, index) => (
                    <motion.div
                      key={index}
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span>{`${opt.months}-Month APR`}</span>
                      <span
                        style={{ color: `var(--color-text-header)` }}
                      >{`${opt.apr}%`}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Reward Claim History */}
              <motion.div
                className="relative p-4 sm:p-6 overflow-hidden rounded-xl glass"
                whileHover={{ boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, #22c55e, #4ade80)`,
                  }}
                />
                <div className="relative flex items-center justify-between mb-4">
                  <h3
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: `var(--color-text-body)` }}
                  >
                    Reward Claim History
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    style={{ color: `var(--color-text-sub)` }}
                  >
                    <Download size={20} className="" />
                  </motion.button>
                </div>
                {rewardsData.rewardClaimHistory.length === 0 ? (
                  <p style={{ color: `var(--color-text-sub)` }}>
                    No rewards claimed yet.
                  </p>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-64">
                    {rewardsData.rewardClaimHistory.map((claim, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleClaimDetails(claim)}
                        className="flex justify-between px-2 py-2 sm:py-3 rounded-lg cursor-pointer hover:bg-[var(--color-switch-off)]"
                      >
                        <span style={{ color: `var(--color-text-sub)` }}>
                          {claim.date.toLocaleDateString()}
                        </span>
                        <span style={{ color: `var(--color-text-header)` }}>
                          {claim.amount.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          HPT
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {activeModal === "claimConfirmation" && selectedClaim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative w-full max-w-md p-6 sm:p-8 overflow-hidden text-center rounded-xl"
                style={{
                  background: `var(--color-card-bg)`,
                  border: `1px solid rgba(34, 197, 94, 0.3)`,
                  boxShadow: `0 10px 20px rgba(0, 0, 0, 0.2)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, var(--color-accent-green), var(--color-accent-blue))`,
                  }}
                />
                <motion.div
                  className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full"
                  style={{ background: `rgba(34, 197, 94, 0.2)` }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <CheckCircle
                    size={32}
                    style={{ color: `var(--color-accent-green)` }}
                  />
                </motion.div>
                <h2
                  className="mb-2 text-lg sm:text-xl md:text-2xl font-bold"
                  style={{ color: `var(--color-text-header)` }}
                >
                  Rewards Claimed Successfully
                </h2>
                <p
                  className="mb-6 text-xs sm:text-sm"
                  style={{ color: `var(--color-text-sub)` }}
                >
                  You’ve claimed{" "}
                  {selectedClaim.amount.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  HPT
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div
                    className="relative p-3 sm:p-4 rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <p style={{ color: `var(--color-text-sub)` }}>
                      Total Rewards Claimed
                    </p>
                    <p
                      className="text-base sm:text-lg font-semibold"
                      style={{ color: `var(--color-text-header)` }}
                    >
                      {(
                        totalClaimedRewards + selectedClaim.amount
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      HPT
                    </p>
                  </div>
                  <div
                    className="relative p-3 sm:p-4 rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <p style={{ color: `var(--color-text-sub)` }}>
                      Remaining Staked
                    </p>
                    <p
                      className="text-base sm:text-lg font-semibold"
                      style={{ color: `var(--color-text-header)` }}
                    >
                      {(
                        rewardsData.totalStaked - rewardsData.totalTokenClaimed
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      HPT
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal(null)}
                  className="relative w-full px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm overflow-hidden rounded-lg"
                  style={{ color: `var(--color-text-on-color)` }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))`,
                    }}
                  />
                  <span className="relative z-10 flex items-center justify-center">
                    Close <ChevronRight className="ml-2" size={16} />
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeModal === "claimDetails" && selectedClaim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative w-full max-w-md p-6 sm:p-8 overflow-hidden rounded-xl"
                style={{
                  background: `var(--color-card-bg)`,
                  border: `1px solid var(--color-border)`,
                  boxShadow: `0 10px 20px rgba(0, 0, 0, 0.2)`,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    background: `linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))`,
                  }}
                />
                <h2
                  className="relative z-10 mb-6 text-lg sm:text-xl font-bold"
                  style={{ color: `var(--color-text-body)` }}
                >
                  Claim Details
                </h2>
                <div
                  className="relative z-10 space-y-4 text-xs sm:text-sm"
                  style={{ color: `var(--color-text-sub)` }}
                >
                  <div
                    className="flex justify-between p-3 rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <span>Date:</span>
                    <span style={{ color: `var(--color-text-header)` }}>
                      {selectedClaim.date.toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className="flex justify-between p-3 rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <span>Amount:</span>
                    <span style={{ color: `var(--color-text-header)` }}>
                      {selectedClaim.amount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      HPT
                    </span>
                  </div>
                  <div
                    className="flex justify-between p-3 rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <span>Platform:</span>
                    <span style={{ color: `var(--color-text-header)` }}>
                      {selectedClaim.platform}
                    </span>
                  </div>
                  <div
                    className="flex justify-between p-3 rounded-lg"
                    style={{
                      background: `var(--color-bg-start)`,
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <span>Transaction Hash:</span>
                    <span
                      className="truncate"
                      style={{ color: `var(--color-accent-blue)` }}
                    >
                      {selectedClaim.transactionHash}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal(null)}
                  className="relative z-10 w-full px-4 py-2 mt-6 text-xs sm:px-6 sm:py-3 sm:text-sm overflow-hidden rounded-lg"
                  style={{ color: `var(--color-text-on-color)` }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))`,
                    }}
                  />
                  <span className="relative z-10">Close</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

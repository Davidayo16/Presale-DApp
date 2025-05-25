import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "../DashboardLayout";
import { CheckCircle, RefreshCw, Info, Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import PresaleABI from "../abi/presaleABI";

const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const HPT_DECIMALS = Number(import.meta.env.VITE_HPT_DECIMALS) || 18;
const SECONDS_PER_DAY =
  Number(import.meta.env.VITE_SECONDS_PER_DAY) || 24 * 60 * 60;
const TOKEN_NAME = import.meta.env.VITE_TOKEN_NAME || "HPT";

export default function ClaimToken({ isCollapsed }) {
  const { theme } = useTheme();
  const { walletConnected, signer, walletAddress, connectWallet } = useWallet();
  const [activeView, setActiveView] = useState("overview");
  const [tokenData, setTokenData] = useState({
    totalPurchased: 0,
    vestingSchedule: [],
    claimPeriod: 0,
  });
  const [claimAnimations, setClaimAnimations] = useState({});
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
      SECONDS_PER_DAY,
      TOKEN_NAME,
    });
  }, []);

  const loadVestingData = async () => {
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

      const participantData = await presaleContract.getParticipantData(
        walletAddress
      );
      const totalClaimable = BigInt(
        await presaleContract.calculateTotalClaimable(walletAddress)
      );
      const endTime = Number(await presaleContract.endTime());
      const claimPeriod = Number(await presaleContract.claimPeriod());
      const initialUnlockPercentage = Number(
        await presaleContract.initialUnlockPercentage()
      );
      const claimUnlockPercentage = Number(
        await presaleContract.claimUnlockPercentage()
      );
      const presaleState = Number(
        await presaleContract.getCurrentPresaleState()
      );
      const isPaused = await presaleContract.paused();

      let totalPurchased = BigInt(participantData[0]);
      let totalClaimed = BigInt(participantData[1]);

      if (totalPurchased === BigInt(0)) {
        setTokenData({
          totalPurchased: 0,
          vestingSchedule: [],
          claimPeriod: 0,
        });
        setChartData([]);
        setPaused(isPaused);
        setIsLoading(false);
        return;
      }

      const periods =
        1 + Math.ceil((100 - initialUnlockPercentage) / claimUnlockPercentage);
      const tokensPerPeriod = totalPurchased / BigInt(periods);
      const currentTime = Math.floor(Date.now() / 1000);
      const vestingSchedule = [];
      let cumulativeUnlockedTokens = BigInt(0);
      let remainingClaimed = totalClaimed;

      for (let i = 0; i < periods; i++) {
        const unlockTime = i === 0 ? endTime : endTime + claimPeriod * i;
        const isClaimable =
          currentTime >= unlockTime &&
          presaleState === 3 &&
          totalClaimable > 0 &&
          !isPaused;
        const periodTokens =
          i === periods - 1
            ? totalPurchased - tokensPerPeriod * BigInt(periods - 1)
            : tokensPerPeriod;
        cumulativeUnlockedTokens += periodTokens;

        const isClaimed =
          remainingClaimed >= periodTokens &&
          cumulativeUnlockedTokens <= totalClaimed;
        if (isClaimed) remainingClaimed -= periodTokens;

        vestingSchedule.push({
          period:
            ["Initial", "First", "Second", "Third", "Final"][i] ||
            `Period ${i + 1}`,
          percentage: i === 0 ? initialUnlockPercentage : claimUnlockPercentage,
          tokens: periodTokens,
          claimed: isClaimed,
          claimable: isClaimable && !isClaimed,
          date: new Date(unlockTime * 1000),
        });
      }

      setTokenData({
        totalPurchased: Number(ethers.formatUnits(totalPurchased, decimals)),
        vestingSchedule,
        claimPeriod: claimPeriod / SECONDS_PER_DAY, // Days
      });
      setChartData(
        vestingSchedule.map((period) => ({
          name: period.period,
          tokens: Number(ethers.formatUnits(period.tokens, decimals)),
          claimed: period.claimed
            ? Number(ethers.formatUnits(period.tokens, decimals))
            : 0,
        }))
      );
      setPaused(isPaused);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading vesting data:", err);
      setError("Failed to load vesting data. Please try again.");
      setIsLoading(false);
    }
  };

  const handleClaimAll = async () => {
    if (
      !walletConnected ||
      !signer ||
      paused ||
      !tokenData.vestingSchedule.some((p) => p.claimable)
    )
      return;
    try {
      setClaimAnimations((prev) => ({ ...prev, claiming: true }));
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      const tx = await presaleContract.claimTokens();
      await tx.wait();
      await loadVestingData();
      setClaimAnimations((prev) => ({ ...prev, claiming: false }));
    } catch (err) {
      console.error("Error claiming tokens:", err);
      setError(
        err.reason || "Failed to claim tokens. Check your wallet and try again."
      );
      setClaimAnimations((prev) => ({ ...prev, claiming: false }));
    }
  };

  useEffect(() => {
    if (walletConnected && signer && walletAddress) loadVestingData();
  }, [walletConnected, signer, walletAddress]);

  const renderChartView = () => {
    const width = window.innerWidth;
    const chartHeight = width < 640 ? 250 : width < 1024 ? 300 : 350;
    const pieOuterRadius = width < 640 ? 80 : width < 1024 ? 100 : 120;
    const pieInnerRadius = width < 640 ? 50 : width < 1024 ? 60 : 70;

    switch (activeView) {
      case "progress":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="5 5"
                stroke="var(--color-border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                stroke="var(--color-text-sub)"
                tick={{
                  fill: `var(--color-text-sub)`,
                  fontSize: width < 640 ? "0.625rem" : "0.75rem",
                }}
              />
              <YAxis
                stroke="var(--color-text-sub)"
                tick={{
                  fill: `var(--color-text-sub)`,
                  fontSize: width < 640 ? "0.625rem" : "0.75rem",
                }}
              />
              <Tooltip
                contentStyle={{
                  background: `var(--color-card-bg)`,
                  border: `1px solid var(--color-border)`,
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  color: `var(--color-text-body)`,
                  fontSize: width < 640 ? "0.75rem" : "0.875rem",
                }}
                formatter={(value) => `${value.toLocaleString()} ${TOKEN_NAME}`}
              />
              <Legend
                formatter={(value) => (
                  <span
                    style={{
                      color: `var(--color-text-sub)`,
                      fontSize: width < 640 ? "0.75rem" : "0.875rem",
                    }}
                  >
                    {value === "tokens"
                      ? `Total ${TOKEN_NAME}`
                      : `Claimed ${TOKEN_NAME}`}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="tokens"
                stroke="var(--color-accent-blue)"
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--color-accent-blue)" }}
                activeDot={{
                  r: 8,
                  fill: "var(--color-accent-blue)",
                  stroke: "var(--color-card-bg)",
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="claimed"
                stroke="var(--color-accent-green)"
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--color-accent-green)" }}
                activeDot={{
                  r: 8,
                  fill: "var(--color-accent-green)",
                  stroke: "var(--color-card-bg)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "distribution":
        const distributionData = [
          {
            name: "Claimed",
            value: chartData.reduce((sum, p) => sum + p.claimed, 0),
          },
          {
            name: "Unclaimed",
            value: chartData.reduce(
              (sum, p) => sum + (p.tokens - p.claimed),
              0
            ),
          },
        ];
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                outerRadius={pieOuterRadius}
                innerRadius={pieInnerRadius}
                dataKey="value"
                label={{ fontSize: width < 640 ? "0.625rem" : "0.75rem" }}
              >
                {distributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 0
                        ? "var(--color-accent-green)"
                        : "var(--color-accent-blue)"
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: width < 640 ? "0.75rem" : "0.875rem",
                }}
                formatter={(value) => `${value.toLocaleString()} ${TOKEN_NAME}`}
              />
              <Legend
                formatter={(value) => (
                  <span
                    style={{
                      color: `var(--color-text-sub)`,
                      fontSize: width < 640 ? "0.75rem" : "0.875rem",
                    }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default: // "overview"
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="tokensGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-accent-blue)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-accent-blue)"
                    stopOpacity={0.2}
                  />
                </linearGradient>
                <linearGradient
                  id="claimedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-accent-green)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-accent-green)"
                    stopOpacity={0.3}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="5 5"
                stroke="var(--color-border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                stroke="var(--color-text-sub)"
                tick={{
                  fill: `var(--color-text-sub)`,
                  fontSize: width < 640 ? "0.625rem" : "0.75rem",
                }}
              />
              <YAxis
                stroke="var(--color-text-sub)"
                tick={{
                  fill: `var(--color-text-sub)`,
                  fontSize: width < 640 ? "0.625rem" : "0.75rem",
                }}
              />
              <Tooltip
                contentStyle={{
                  background: `var(--color-card-bg)`,
                  border: `1px solid var(--color-border)`,
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  color: `var(--color-text-body)`,
                  fontSize: width < 640 ? "0.75rem" : "0.875rem",
                }}
                formatter={(value, name) => [
                  `${value.toLocaleString()} ${TOKEN_NAME}`,
                  name === "tokens" ? "Total" : "Claimed",
                ]}
                labelStyle={{
                  color: `var(--color-text-header)`,
                  fontSize: width < 640 ? "0.75rem" : "0.875rem",
                }}
              />
              <Legend
                formatter={(value) => (
                  <span
                    style={{
                      color: `var(--color-text-sub)`,
                      fontSize: width < 640 ? "0.75rem" : "0.875rem",
                    }}
                  >
                    {value === "tokens"
                      ? `Total ${TOKEN_NAME}`
                      : `Claimed ${TOKEN_NAME}`}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="var(--color-accent-blue)"
                strokeWidth={3}
                fill="url(#tokensGradient)"
                animationDuration={1000}
                activeDot={{
                  r: 8,
                  fill: "var(--color-accent-blue)",
                  stroke: "var(--color-card-bg)",
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="claimed"
                stroke="var(--color-accent-green)"
                strokeWidth={3}
                fill="url(#claimedGradient)"
                animationDuration={1000}
                activeDot={{
                  r: 8,
                  fill: "var(--color-accent-green)",
                  stroke: "var(--color-card-bg)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  if (!walletConnected) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4"
        style={{
          background:
            "linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))",
        }}
      >
        <motion.div
          className="w-full max-w-md p-6 shadow-lg rounded-xl"
          style={{
            background: "var(--color-card-bg)",
            border: "1px solid var(--color-border)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-text-header)" }}
            >
              Connect Your Wallet
            </h2>
            <p style={{ color: "var(--color-text-sub)" }}>
              Please connect your wallet to view your vesting details
            </p>
            <motion.button
              onClick={connectWallet}
              className="px-6 py-2 font-medium rounded-lg"
              style={{
                background:
                  "linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))",
                color: "var(--color-text-on-color)",
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
          style={{ borderColor: "var(--color-accent-blue)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const claimedPercentage =
    (chartData.reduce((sum, p) => sum + p.claimed, 0) /
      tokenData.totalPurchased) *
    100;

  return (
    <div
      className="w-full min-h-screen p-4 sm:p-6"
      style={{
        background:
          "linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))",
      }}
    >
      <div className="w-full">
        <motion.h1
          className="mb-3 text-lg sm:text-xl md:text-2xl font-bold"
          style={{ color: "var(--color-text-header)" }}
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Token Vesting
        </motion.h1>
        <p
          style={{ color: "var(--color-text-sub)" }}
          className="mb-3 sm:mb-4 text-sm"
        >
          Track your {TOKEN_NAME} token vesting and claim available tokens
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between p-3 mb-4 rounded-lg w-full max-w-lg"
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <span style={{ color: "var(--color-text-body)" }}>{error}</span>
              <button onClick={() => setError(null)}>
                <X size={16} style={{ color: "var(--color-accent-red)" }} />
              </button>
            </motion.div>
          )}
          {paused && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center p-3 mb-4 rounded-lg w-full max-w-lg"
              style={{
                background: "rgba(234, 179, 8, 0.2)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
              }}
            >
              <Info
                size={16}
                style={{ color: "var(--color-accent-yellow)" }}
                className="mr-2"
              />
              <span style={{ color: "var(--color-text-body)" }}>
                Presale is paused. Claims are temporarily disabled.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {tokenData.totalPurchased === 0 ? (
          <motion.div
            className="p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-md"
            style={{
              background: "var(--color-card-bg)",
              border: "1px solid var(--color-border)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center">
              <h2
                className="mb-3 text-base sm:text-lg font-semibold"
                style={{ color: "var(--color-text-header)" }}
              >
                Start Your Journey with {TOKEN_NAME}
              </h2>
              <p
                className="mb-4 text-sm"
                style={{ color: "var(--color-text-sub)" }}
              >
                You haven’t purchased any {TOKEN_NAME} tokens yet. Join the
                presale now to unlock exclusive vesting benefits!
              </p>
              <motion.button
                className="px-4 py-2 font-medium rounded-lg"
                style={{
                  background:
                    "linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))",
                  color: "var(--color-text-on-color)",
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/dashboard/purchase")}
              >
                Purchase {TOKEN_NAME} Now
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <motion.div
              className="overflow-hidden shadow-lg rounded-lg w-full lg:w-2/3"
              style={{
                background: "var(--color-card-bg)",
                border: "1px solid var(--color-border)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-0">
                    {["overview", "progress", "distribution"].map((view) => (
                      <motion.button
                        key={view}
                        onClick={() => setActiveView(view)}
                        className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm rounded-lg"
                        style={{
                          background:
                            activeView === view
                              ? "linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))"
                              : "var(--color-switch-off)",
                          color:
                            activeView === view
                              ? "var(--color-text-on-color)"
                              : "var(--color-text-sub)",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    onClick={handleClaimAll}
                    disabled={
                      claimAnimations.claiming ||
                      paused ||
                      !tokenData.vestingSchedule.some((p) => p.claimable)
                    }
                    className="px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm rounded-lg"
                    style={{
                      background:
                        tokenData.vestingSchedule.some((p) => p.claimable) &&
                        !paused
                          ? "linear-gradient(to right, var(--color-accent-blue), var(--color-accent-purple))"
                          : "var(--color-switch-off)",
                      color: "var(--color-text-on-color)",
                      cursor:
                        tokenData.vestingSchedule.some((p) => p.claimable) &&
                        !paused
                          ? "pointer"
                          : "not-allowed",
                    }}
                    whileHover={{
                      scale:
                        tokenData.vestingSchedule.some((p) => p.claimable) &&
                        !paused
                          ? 1.05
                          : 1,
                    }}
                    whileTap={{
                      scale:
                        tokenData.vestingSchedule.some((p) => p.claimable) &&
                        !paused
                          ? 0.95
                          : 1,
                    }}
                  >
                    {claimAnimations.claiming ? (
                      <div className="flex items-center">
                        <RefreshCw
                          size={12}
                          className="mr-1 animate-spin sm:size-14"
                        />
                        Claiming...
                      </div>
                    ) : (
                      "Claim All Available"
                    )}
                  </motion.button>
                </div>

                <div
                  className="rounded-lg"
                  style={{
                    background: "var(--color-bg-start)",
                    boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {renderChartView()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-4 sm:mt-6">
                  <h3
                    className="text-base sm:text-lg font-semibold mb-3"
                    style={{ color: "var(--color-text-body)" }}
                  >
                    Vesting Schedule
                  </h3>
                  <div className="w-full bg-[var(--color-switch-off)] rounded-full h-2 mb-3">
                    <motion.div
                      className="bg-[var(--color-accent-green)] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${claimedPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="space-y-3">
                    {tokenData.vestingSchedule.map((period) => (
                      <motion.div
                        key={period.period}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg"
                        style={{
                          background: period.claimed
                            ? "rgba(34, 197, 94, 0.1)"
                            : period.claimable
                            ? "rgba(96, 165, 250, 0.1)"
                            : "var(--color-bg-start)",
                          border: `1px solid ${
                            period.claimed
                              ? "rgba(34, 197, 94, 0.3)"
                              : period.claimable
                              ? "rgba(96, 165, 250, 0.3)"
                              : "var(--color-border)"
                          }`,
                        }}
                        whileHover={{
                          scale: 1.02,
                        }}
                      >
                        <div className="flex items-center w-full mb-2 sm:mb-0 sm:w-auto">
                          <div
                            className="flex items-center justify-center w-8 h-8 mr-2 rounded-full"
                            style={{
                              background: period.claimed
                                ? "rgba(34, 197, 94, 0.2)"
                                : period.claimable
                                ? "rgba(96, 165, 250, 0.2)"
                                : "var(--color-switch-off)",
                            }}
                          >
                            <span
                              className="text-sm"
                              style={{
                                color: period.claimed
                                  ? "var(--color-accent-green)"
                                  : period.claimable
                                  ? "var(--color-accent-blue)"
                                  : "var(--color-text-sub)",
                              }}
                            >
                              {period.percentage}%
                            </span>
                          </div>
                          <div>
                            <h4
                              className="text-sm font-medium"
                              style={{ color: "var(--color-text-header)" }}
                            >
                              {period.period} Unlock
                            </h4>
                            <p
                              className="text-sm"
                              style={{ color: "var(--color-text-sub)" }}
                            >
                              {period.date.toLocaleDateString()} |{" "}
                              {Number(
                                ethers.formatUnits(period.tokens, tokenDecimals)
                              ).toLocaleString()}{" "}
                              {TOKEN_NAME}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {period.claimed ? (
                            <CheckCircle
                              size={16}
                              style={{ color: "var(--color-accent-green)" }}
                            />
                          ) : (
                            <span
                              className="text-sm"
                              style={{
                                color: period.claimable
                                  ? "var(--color-accent-blue)"
                                  : "var(--color-text-sub)",
                              }}
                            >
                              {period.claimable ? "Claimable" : "Locked"}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col gap-4 w-full lg:w-1/3">
              <motion.div
                className="overflow-hidden shadow-lg rounded-lg"
                style={{
                  background: "var(--color-card-bg)",
                  border: "1px solid var(--color-border)",
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="p-3 sm:p-4">
                  <h3
                    className="mb-3 text-base sm:text-lg font-semibold"
                    style={{ color: "var(--color-accent-blue)" }}
                  >
                    Vesting Insights
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--color-text-sub)" }}>
                        Total {TOKEN_NAME}
                      </span>
                      <span style={{ color: "var(--color-text-header)" }}>
                        {tokenData.totalPurchased.toLocaleString()} {TOKEN_NAME}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--color-text-sub)" }}>
                        Claimed
                      </span>
                      <span style={{ color: "var(--color-accent-green)" }}>
                        {chartData
                          .reduce((sum, p) => sum + p.claimed, 0)
                          .toLocaleString()}{" "}
                        {TOKEN_NAME}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--color-text-sub)" }}>
                        Unclaimed
                      </span>
                      <span style={{ color: "var(--color-accent-blue)" }}>
                        {chartData
                          .reduce((sum, p) => sum + (p.tokens - p.claimed), 0)
                          .toLocaleString()}{" "}
                        {TOKEN_NAME}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="p-3 sm:p-4 rounded-lg shadow-lg"
                style={{
                  background: "rgba(234, 179, 8, 0.1)",
                  border: "1px solid rgba(234, 179, 8, 0.3)",
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center mb-2">
                  <Info
                    size={16}
                    style={{ color: "var(--color-accent-yellow)" }}
                    className="mr-2"
                  />
                  
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-accent-yellow)" }}
                    >
                      Vesting Notice
                    </h3>
                  
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-sub)" }}
                >
                  Initial {tokenData.vestingSchedule[0]?.percentage}% unlocks
                  post-presale, then {tokenData.vestingSchedule[1]?.percentage}%
                  every {tokenData.claimPeriod} days. Claim when available.
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

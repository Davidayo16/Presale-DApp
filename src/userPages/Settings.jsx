
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../DashboardLayout";
import { useWallet } from "../context/WalletContext";
import {
  Copy,
  Bell,
  Sun,
  Moon,
  Mail,
  User,
  Link as LinkIcon,
  Check,
  TrendingUp,
  LogOut,
  Wallet,
} from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { walletConnected, walletAddress, connectWallet, disconnectWallet } =
    useWallet();
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const navigate = useNavigate();

  const referralLink = walletAddress
    ? `https://hipro.com/ref/${walletAddress.slice(0, 6)}`
    : "Connect wallet to generate referral link";

  const handleCopyWallet = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleCopyReferral = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectWallet(); // Await in case disconnectWallet is async
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="w-full h-full p-3 sm:p-4 lg:p-6">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-lg sm:text-xl lg:text-2xl font-bold text-[var(--color-text-header)]"
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        Account Settings
      </motion.h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Wallet Management */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-5 lg:p-6 rounded-lg backdrop-blur-md bg-[var(--color-card-bg)] border border-[var(--color-border)]"
        >
          <h2
            className="flex items-center mb-3 text-base sm:text-lg font-semibold text-[var(--color-text-header)]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            <Wallet className="mr-2" size={18} style={{ color: `#3b82f6` }} />{" "}
            Wallet Management
          </h2>
          {walletConnected ? (
            <>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs sm:text-sm truncate max-w-[60%] sm:max-w-[70%]"
                  style={{
                    color: `var(--color-text-body)`,
                    fontFamily: "'Exo 2', sans-serif",
                  }}
                >
                  {walletAddress}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyWallet}
                  className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-[var(--color-text-on-color)]"
                >
                  {copiedWallet ? <Check size={14} /> : <Copy size={14} />}
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="relative w-full px-4 py-2 mt-3 text-xs sm:text-sm font-medium rounded-lg overflow-hidden text-[var(--color-text-on-color)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#ef4444] to-[#f97316]" />
                <span
                  className="relative z-10 flex items-center justify-center"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  {isDisconnecting ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 animate-spin text-white"
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
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2" size={14} /> Disconnect Wallet
                    </>
                  )}
                </span>
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet}
              className="relative w-full px-4 py-2 text-xs sm:text-sm font-medium rounded-lg overflow-hidden text-[var(--color-text-on-color)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#9333ea]" />
              <span
                className="relative z-10 flex items-center justify-center"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                <Wallet className="mr-2" size={14} /> Connect Wallet
              </span>
            </motion.button>
          )}
          <p
            className="mt-2 text-xs text-[var(--color-text-sub)]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            {walletConnected
              ? "Disconnect or copy your connected wallet address."
              : "Connect a wallet to manage your account."}
          </p>
        </motion.div>

        {/* Whitelist Status */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-5 lg:p-6 rounded-lg backdrop-blur-md bg-[var(--color-card-bg)] border border-[var(--color-border)]"
        >
          <h2
            className="flex items-center mb-3 text-base sm:text-lg font-semibold text-[var(--color-text-header)]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            <User className="mr-2" size={18} style={{ color: `#22c55e` }} />{" "}
            Whitelist Status
            <span className="px-1.5 py-0.5 ml-2 text-xs font-medium rounded-full bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-[var(--color-text-on-color)]">
              Preview
            </span>
          </h2>
          <div className="pointer-events-none opacity-60">
            <p
              className="text-[#22c55e] text-xs sm:text-sm"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              Whitelisted
            </p>
            <p
              className="mt-2 text-xs text-[var(--color-text-sub)]"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              Indicates eligibility for presale participation. (Coming soon)
            </p>
          </div>
        </motion.div>

        {/* Referral Link */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-5 lg:p-6 rounded-lg backdrop-blur-md bg-[var(--color-card-bg)] border border-[var(--color-border)]"
        >
          <h2
            className="flex items-center mb-3 text-base sm:text-lg font-semibold text-[var(--color-text-header)]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            <LinkIcon className="mr-2" size={18} style={{ color: `#9333ea` }} />{" "}
            Referral Link
            <span className="px-1.5 py-0.5 ml-2 text-xs font-medium rounded-full bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-[var(--color-text-on-color)]">
              Preview
            </span>
          </h2>
          <div className="flex items-center justify-between pointer-events-none opacity-60">
            <span
              className="text-xs sm:text-sm truncate max-w-[60%] sm:max-w-[70%]"
              style={{
                color: `var(--color-text-body)`,
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              {referralLink}
            </span>
            <motion.button
              className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-[#22c55e] to-[#3b82f6] text-[var(--color-text-on-color)]"
              disabled
            >
              <Copy size={14} />
            </motion.button>
          </div>
          <p
            className="mt-2 text-xs text-[var(--color-text-sub)] opacity-60"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            Share this link to earn rewards. (Coming soon)
          </p>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-5 lg:p-6 rounded-lg backdrop-blur-md bg-[var(--color-card-bg)] border border-[var(--color-border)]"
        >
          <h2
            className="flex items-center mb-3 text-base sm:text-lg font-semibold text-[var(--color-text-header)]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            <Bell className="mr-2" size={18} style={{ color: `#eab308` }} />{" "}
            Notification Preferences
            <span className="px-1.5 py-0.5 ml-2 text-xs font-medium rounded-full bg-gradient-to-r from-[#3b82f6] to-[#9333ea] text-[var(--color-text-on-color)]">
              Preview
            </span>
          </h2>
          <div className="space-y-3 pointer-events-none opacity-60">
            <div className="flex items-center justify-between">
              <span
                className="flex items-center text-xs sm:text-sm text-[var(--color-text-body)]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                <Mail className="mr-2" size={14} style={{ color: `#3b82f6` }} />{" "}
                Email Notifications
              </span>
              <button
                className="flex items-center w-10 h-5 p-1 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#9333ea]"
                disabled
              >
                <motion.div
                  className="w-3 h-3 bg-white rounded-full"
                  initial={{ x: 20 }}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="flex items-center text-xs sm:text-sm text-[var(--color-text-body)]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                <Bell className="mr-2" size={14} style={{ color: `#eab308` }} />{" "}
                In-App Notifications
              </span>
              <button
                className="flex items-center w-10 h-5 p-1 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#9333ea]"
                disabled
              >
                <motion.div
                  className="w-3 h-3 bg-white rounded-full"
                  initial={{ x: 20 }}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="flex items-center text-xs sm:text-sm text-[var(--color-text-body)]"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                <TrendingUp
                  className="mr-2"
                  size={14}
                  style={{ color: `#22c55e` }}
                />{" "}
                Staking Updates
              </span>
              <button
                className="flex items-center w-10 h-5 p-1 rounded-full bg-[var(--color-switch-off)]"
                disabled
              >
                <motion.div
                  className="w-3 h-3 bg-white rounded-full"
                  initial={{ x: 0 }}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-5 lg:p-6 rounded-lg backdrop-blur-md bg-[var(--color-card-bg)] border border-[var(--color-border)]"
        >
          <h2
            className="flex items-center mb-3 text-base sm:text-lg font-semibold text-[var(--color-text-header)]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            {theme === "dark" ? (
              <Moon className="mr-2" size={18} style={{ color: `#9333ea` }} />
            ) : (
              <Sun className="mr-2" size={18} style={{ color: `#eab308` }} />
            )}
            Theme
          </h2>
          <div className="flex items-center justify-between">
            <span
              className="text-xs sm:text-sm text-[var(--color-text-body)]"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <button
              onClick={toggleTheme}
              className="relative flex items-center w-12 h-6 p-1 rounded-full cursor-pointer"
              style={{
                background:
                  theme === "dark"
                    ? `linear-gradient(to right, #3b82f6, #9333ea)`
                    : `var(--color-switch-off)`,
              }}
            >
              <motion.div
                className="flex items-center justify-center w-4 h-4 rounded-full"
                animate={{ x: theme === "dark" ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  background: theme === "dark" ? "#1f2937" : "#ffffff",
                }}
              >
                {theme === "dark" ? (
                  <Moon size={12} style={{ color: `#9333ea` }} />
                ) : (
                  <Sun size={12} style={{ color: `#eab308` }} />
                )}
              </motion.div>
            </button>
          </div>
          <p
            className="mt-2 text-xs text-[var(--color-text-sub)]"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            Customize your dashboard appearance.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

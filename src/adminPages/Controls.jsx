import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/WalletContext";
import { useTheme } from "../AdminDashboardLayout";
import {
  Settings,
  Users,
  SlidersHorizontal,
  Banknote,
  ChevronDown,
  RefreshCw,
  ArrowRightLeft,
} from "lucide-react";
import PresaleABI from "../abi/presaleABI";
import { toast } from "react-hot-toast";

// Constants from environment variables
const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
const HPT_DECIMALS = parseInt(import.meta.env.VITE_HPT_DECIMALS);
const USDT_DECIMALS = parseInt(import.meta.env.VITE_USDT_DECIMALS);
const COLORS = {
  primary: "var(--color-accent-blue, #3b82f6)",
  secondary: "var(--color-accent-purple, #9333ea)",
  success: "var(--color-accent-green, #22c55e)",
  danger: "var(--color-accent-red, #ef4444)",
  warning: "var(--color-accent-yellow, #eab308)",
};
const STATE_MAP = ["NotStarted", "Active", "Ended", "ClaimOpen"];

// Helper to format BigInt
const formatBigInt = (value, decimals) => {
  try {
    return Number(ethers.formatUnits(value, decimals));
  } catch {
    return 0;
  }
};

// Confirmation Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, action, address }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 max-[380px]:p-1 sm:p-2 bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-[90vw] sm:max-w-md p-1.5 max-[380px]:p-1 sm:p-2 lg:p-4 rounded-xl bg-[var(--color-card-bg)]/90 backdrop-blur-lg border border-[var(--color-border)]"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <h3
          style={{ color: "var(--color-text-header)" }}
          className="text-sm max-[380px]:text-xs sm:text-base lg:text-lg font-semibold"
        >
          Confirm {action}
        </h3>
        <p
          style={{ color: "var(--color-text-body)" }}
          className="mt-1 max-[380px]:mt-0.5 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
        >
          {action}{" "}
          {address ? `to ${address.slice(0, 6)}...${address.slice(-4)}` : ""}
        </p>
        <div className="flex gap-1.5 max-[380px]:gap-1 sm:gap-2 mt-2 max-[380px]:mt-1 sm:mt-3">
          <motion.button
            onClick={onClose}
            className="flex-1 px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1 max-[380px]:py-0.75 sm:py-1.5 lg:py-2 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-[var(--color-bg-start)] text-[var(--color-text-body)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={onConfirm}
            className="flex-1 px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1 max-[380px]:py-0.75 sm:py-1.5 lg:py-2 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Collapsible Section
const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  isOpen,
  toggle,
}) => {
  return (
    <motion.div
      className="rounded-xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)] overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full p-1.5 max-[380px]:p-1 sm:p-2 lg:p-3"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <Icon
            className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5 mr-1.5 max-[380px]:mr-1 sm:mr-2"
            style={{ color: COLORS.primary }}
          />
          <h2
            style={{ color: "var(--color-text-header)" }}
            className="text-sm max-[380px]:text-xs sm:text-base lg:text-lg font-semibold"
          >
            {title}
          </h2>
        </div>
        <ChevronDown
          className={`w-3 max-[380px]:w-2.5 sm:w-3.5 lg:w-4 h-3 max-[380px]:h-2.5 sm:h-3.5 lg:h-4 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "var(--color-text-sub)" }}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="p-1.5 max-[380px]:p-1 sm:p-2 lg:p-4 border-t border-[var(--color-border)]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, label, id }) => {
  return (
    <label className="flex items-center cursor-pointer" htmlFor={id}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
          aria-label={label}
        />
        <div
          className={`w-8 max-[380px]:w-7 sm:w-10 lg:w-12 h-4 max-[380px]:h-3.5 sm:h-5 lg:h-6 rounded-full transition-colors ${
            checked
              ? "bg-[var(--color-accent-green)]"
              : "bg-[var(--color-border)]"
          }`}
        ></div>
        <div
          className={`absolute top-0.5 max-[380px]:top-[2px] sm:top-0.5 lg:top-0.5 left-0.5 w-3 max-[380px]:w-2.5 sm:w-4 lg:w-5 h-3 max-[380px]:h-2.5 sm:h-4 lg:h-5 bg-white rounded-full shadow-sm transform transition-transform ${
            checked
              ? "translate-x-4 max-[380px]:translate-x-3.5 sm:translate-x-5 lg:translate-x-6"
              : "translate-x-0"
          }`}
        ></div>
      </div>
      <span
        style={{ color: "var(--color-text-body)" }}
        className="ml-1.5 max-[380px]:ml-1 sm:ml-2 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
      >
        {label}
      </span>
    </label>
  );
};

export default function ControlsPage() {
  const { signer, walletConnected, walletAddress, connectWallet } = useWallet();
  const { theme } = useTheme();
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    state: false,
    whitelist: false,
    settings: false,
    deposit: false,
    withdraw: false,
  });
  const [fetchError, setFetchError] = useState(null);
  const [hptDecimals, setHptDecimals] = useState(HPT_DECIMALS);
  const [usdtDecimals, setUsdtDecimals] = useState(USDT_DECIMALS);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [paused, setPaused] = useState(false);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [currentState, setCurrentState] = useState(0);
  const [currentSettings, setCurrentSettings] = useState({
    usdtPrice: 0,
    minPurchase: 0,
    maxPurchase: 0,
    userHardCap: 0,
    initialUnlockPercentage: 0,
    claimPeriod: 0,
    claimUnlockPercentage: 0,
  });
  const [formData, setFormData] = useState({
    state: "0",
    whitelistAddresses: "",
    whitelistAction: "add",
    usdtPrice: "",
    minPurchase: "",
    maxPurchase: "",
    userHardCap: "",
    initialUnlockPercentage: "",
    claimPeriod: "",
    claimUnlockPercentage: "",
    presaleTokens: "",
    withdrawAddress: "",
    withdrawType: "USDT Funds",
  });
  const [errors, setErrors] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: "",
    address: "",
    onConfirm: () => {},
  });
  const [openSections, setOpenSections] = useState({
    state: true,
    whitelist: true,
    settings: true,
    funds: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!walletConnected || !signer) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);

    try {
      const presaleContract = new ethers.Contract(
        PRESALE_ADDRESS,
        PresaleABI,
        signer
      );
      setContract(presaleContract);

      const owner = await presaleContract.owner();
      setIsOwner(walletAddress.toLowerCase() === owner.toLowerCase());

      const [
        hptAddr,
        usdtAddr,
        pausedStatus,
        whitelistStatus,
        state,
        usdtPrice,
        minPurchase,
        maxPurchase,
        userHardCap,
        initialUnlockPercentage,
        claimPeriod,
        claimUnlockPercentage,
      ] = await Promise.all([
        presaleContract.hptToken(),
        presaleContract.usdtToken(),
        presaleContract.paused(),
        presaleContract.whitelistEnabled(),
        presaleContract.getCurrentPresaleState(),
        presaleContract.usdtPrice(),
        presaleContract.minPurchase(),
        presaleContract.maxPurchase(),
        presaleContract.userHardCap(),
        presaleContract.initialUnlockPercentage(),
        presaleContract.claimPeriod(),
        presaleContract.claimUnlockPercentage(),
      ]);

      const hptContract = new ethers.Contract(
        hptAddr,
        ["function decimals() view returns (uint8)"],
        signer
      );
      const usdtContract = new ethers.Contract(
        usdtAddr,
        ["function decimals() view returns (uint8)"],
        signer
      );
      const [hptDec, usdtDec] = await Promise.all([
        hptContract.decimals(),
        usdtContract.decimals(),
      ]);
      setHptDecimals(hptDec);
      setUsdtDecimals(usdtDec);

      setPaused(pausedStatus);
      setWhitelistEnabled(whitelistStatus);
      setCurrentState(Number(state));
      setCurrentSettings({
        usdtPrice: formatBigInt(usdtPrice, usdtDec),
        minPurchase: formatBigInt(minPurchase, usdtDec),
        maxPurchase: formatBigInt(maxPurchase, usdtDec),
        userHardCap: formatBigInt(userHardCap, usdtDec),
        initialUnlockPercentage: Number(initialUnlockPercentage),
        claimPeriod: Number(claimPeriod) / import.meta.env.VITE_SECONDS_PER_DAY,
        claimUnlockPercentage: Number(claimUnlockPercentage),
      });

      setFormData((prev) => ({
        ...prev,
        state: Number(state).toString(),
        usdtPrice: formatBigInt(usdtPrice, usdtDec).toString(),
        minPurchase: formatBigInt(minPurchase, usdtDec).toString(),
        maxPurchase: formatBigInt(maxPurchase, usdtDec).toString(),
        userHardCap: formatBigInt(userHardCap, usdtDec).toString(),
        initialUnlockPercentage: Number(initialUnlockPercentage).toString(),
        claimPeriod: (
          Number(claimPeriod) / import.meta.env.VITE_SECONDS_PER_DAY
        ).toString(),
        claimUnlockPercentage: Number(claimUnlockPercentage).toString(),
      }));

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching data:", err);
      setFetchError(`Failed to load controls: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [signer, walletConnected, walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Execute transaction with loading state
  const executeTransaction = async (
    method,
    args,
    successMessage,
    actionKey
  ) => {
    if (!contract || !signer) {
      toast.error("Contract or signer not initialized");
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, [actionKey]: true }));
      const tx = await contract[method](...args);
      toast.loading("Transaction pending...", { id: method });
      await tx.wait();
      toast.success(successMessage, { id: method });
      await fetchData();
    } catch (err) {
      toast.error(`Error: ${err.reason || err.message}`, { id: method });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Validate settings
  const validateSettings = () => {
    const newErrors = {};
    const fields = [
      {
        name: "usdtPrice",
        validate: (v) => v > 0,
        message: "Price must be greater than 0",
      },
      {
        name: "minPurchase",
        validate: (v) => v >= 0,
        message: "Minimum purchase must be non-negative",
      },
      {
        name: "maxPurchase",
        validate: (v) =>
          v >= parseFloat(formData.minPurchase || currentSettings.minPurchase),
        message: "Max purchase must be >= min purchase",
      },
      {
        name: "userHardCap",
        validate: (v) =>
          v >= parseFloat(formData.maxPurchase || currentSettings.maxPurchase),
        message: "Hard cap must be >= max purchase",
      },
      {
        name: "initialUnlockPercentage",
        validate: (v) => v >= 0 && v <= 100,
        message: "Unlock % must be between 0 and 100",
      },
      {
        name: "claimPeriod",
        validate: (v) => v > 0,
        message: "Claim period must be greater than 0",
      },
      {
        name: "claimUnlockPercentage",
        validate: (v) => v >= 0 && v <= 100,
        message: "Claim unlock % must be between 0 and 100",
      },
    ];

    fields.forEach(({ name, validate, message }) => {
      const value = parseFloat(formData[name]);
      if (!formData[name] || isNaN(value) || !validate(value)) {
        newErrors[name] = message;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleStateChange = () => {
    const state = parseInt(formData.state);
    if (isNaN(state) || state < 0 || state >= STATE_MAP.length) {
      toast.error("Invalid state");
      return;
    }
    setConfirmModal({
      isOpen: true,
      action: `Set State to ${STATE_MAP[state]}`,
      address: "",
      onConfirm: () => {
        setConfirmModal({
          isOpen: false,
          action: "",
          address: "",
          onConfirm: () => {},
        });
        executeTransaction(
          "setPresaleState",
          [state],
          `State set to ${STATE_MAP[state]}`,
          "state"
        );
      },
    });
  };

  const handlePauseToggle = (pause) => {
    executeTransaction(
      pause ? "pause" : "unpause",
      [],
      pause ? "Presale paused" : "Presale unpaused",
      "state"
    );
  };

  const handleWhitelistToggle = (enable) => {
    executeTransaction(
      "setWhitelistEnabled",
      [enable],
      `Whitelist ${enable ? "enabled" : "disabled"}`,
      "whitelist"
    );
  };

  const handleWhitelistUpdate = () => {
    const addresses = formData.whitelistAddresses
      .split(/[\n,]/)
      .map((addr) => addr.trim())
      .filter((addr) => ethers.isAddress(addr));
    if (addresses.length === 0) {
      setErrors((prev) => ({
        ...prev,
        whitelistAddresses: "No valid addresses provided",
      }));
      return;
    }
    const add = formData.whitelistAction === "add";
    setConfirmModal({
      isOpen: true,
      action: `${add ? "Add" : "Remove"} Addresses to Whitelist`,
      address: "",
      onConfirm: () => {
        setConfirmModal({
          isOpen: false,
          action: "",
          address: "",
          onConfirm: () => {},
        });
        executeTransaction(
          "updateWhitelist",
          [addresses, add],
          `Addresses ${add ? "added to" : "removed from"} whitelist`,
          "whitelist"
        );
        setFormData((prev) => ({ ...prev, whitelistAddresses: "" }));
      },
    });
  };

  const handleSettingsUpdate = () => {
    if (!validateSettings()) return;

    const methods = [
      {
        name: "usdtPrice",
        method: "setUsdtPrice",
        format: (v) => ethers.parseUnits(v.toString(), usdtDecimals),
      },
      {
        name: "minPurchase",
        method: "setMinPurchase",
        format: (v) => ethers.parseUnits(v.toString(), usdtDecimals),
      },
      {
        name: "maxPurchase",
        method: "setMaxPurchase",
        format: (v) => ethers.parseUnits(v.toString(), usdtDecimals),
      },
      {
        name: "userHardCap",
        method: "setUserHardCap",
        format: (v) => ethers.parseUnits(v.toString(), usdtDecimals),
      },
      {
        name: "initialUnlockPercentage",
        method: "setInitialUnlockPercentage",
        format: (v) => Math.round(v),
      },
      {
        name: "claimPeriod",
        method: "setClaimPeriod",
        format: (v) => Math.round(v * import.meta.env.VITE_SECONDS_PER_DAY),
      },
      {
        name: "claimUnlockPercentage",
        method: "setClaimUnlockPercentage",
        format: (v) => Math.round(v),
      },
    ];

    const changes = methods
      .filter(({ name }) => {
        const current = currentSettings[name];
        const newValue = parseFloat(formData[name]);
        return formData[name] && !isNaN(newValue) && newValue !== current;
      })
      .map(({ method, format, name }) => ({
        method,
        args: [format(parseFloat(formData[name]))],
      }));

    if (changes.length === 0) {
      toast.error("No changes to save");
      return;
    }

    setConfirmModal({
      isOpen: true,
      action: `Update ${changes.length} Setting${
        changes.length > 1 ? "s" : ""
      }`,
      address: "",
      onConfirm: async () => {
        setConfirmModal({
          isOpen: false,
          action: "",
          address: "",
          onConfirm: () => {},
        });
        for (const { method, args } of changes) {
          await executeTransaction(
            method,
            args,
            `${method} updated`,
            "settings"
          );
        }
      },
    });
  };

  const handlePresaleTokens = () => {
    const amount = parseFloat(formData.presaleTokens);
    if (isNaN(amount) || amount <= 0) {
      setErrors((prev) => ({
        ...prev,
        presaleTokens: "Amount must be greater than 0",
      }));
      return;
    }
    setConfirmModal({
      isOpen: true,
      action: `Deposit ${amount} ${import.meta.env.VITE_TOKEN_NAME}`,
      address: "",
      onConfirm: () => {
        setConfirmModal({
          isOpen: false,
          action: "",
          address: "",
          onConfirm: () => {},
        });
        executeTransaction(
          "setPresaleTokens",
          [ethers.parseUnits(amount.toString(), hptDecimals)],
          `Deposited ${amount} ${import.meta.env.VITE_TOKEN_NAME}`,
          "deposit"
        );
        setFormData((prev) => ({ ...prev, presaleTokens: "" }));
      },
    });
  };

  const handleWithdraw = () => {
    const address = formData.withdrawAddress;
    if (!ethers.isAddress(address)) {
      setErrors((prev) => ({
        ...prev,
        withdrawAddress: "Invalid address",
      }));
      return;
    }
    const type = formData.withdrawType;
    const methodMap = {
      "USDT Funds": "withdrawRaisedFunds",
      [`${import.meta.env.VITE_TOKEN_NAME} Tokens`]: "emergencyWithdrawTokens",
      "USDT Emergency": "emergencyWithdrawPaymentTokens",
    };
    const method = methodMap[type];
    setConfirmModal({
      isOpen: true,
      action: `Withdraw ${type}`,
      address,
      onConfirm: () => {
        setConfirmModal({
          isOpen: false,
          action: "",
          address: "",
          onConfirm: () => {},
        });
        executeTransaction(method, [address], `${type} withdrawn`, "withdraw");
        setFormData((prev) => ({ ...prev, withdrawAddress: "" }));
      },
    });
  };

  // Toggle sections
  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
        <motion.div
          className="w-10 max-[380px]:w-8 sm:w-12 lg:w-16 h-10 max-[380px]:h-8 sm:h-12 lg:h-16 border-4 border-t-transparent border-[var(--color-accent-purple)] rounded-full"
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
          className="w-full max-w-[90vw] sm:max-w-md p-1.5 max-[380px]:p-1 sm:p-2 lg:p-4 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <h2
            style={{ color: "var(--color-text-header)" }}
            className="mb-2 max-[380px]:mb-1 sm:mb-3 text-lg max-[380px]:text-base sm:text-xl lg:text-2xl font-bold text-center"
          >
            Connect Wallet
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-3 max-[380px]:mb-2 sm:mb-4 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm text-center"
          >
            Access the controls dashboard by connecting your wallet.
          </p>
          <motion.button
            onClick={connectWallet}
            className="w-full px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1 max-[380px]:py-0.75 sm:py-1.5 lg:py-2 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
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
          className="w-full max-w-[90vw] sm:max-w-md p-1.5 max-[380px]:p-1 sm:p-2 lg:p-4 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-2 max-[380px]:mb-1 sm:mb-3 text-lg max-[380px]:text-base sm:text-xl lg:text-2xl font-bold text-center"
          >
            Access Denied
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-3 max-[380px]:mb-2 sm:mb-4 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm text-center"
          >
            Only the contract owner can access this dashboard.
          </p>
        </motion.div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)]">
        <motion.div
          className="w-full max-w-[90vw] sm:max-w-md p-1.5 max-[380px]:p-1 sm:p-2 lg:p-4 rounded-2xl bg-[var(--color-card-bg)]/80 backdrop-blur-lg border border-[var(--color-border)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <h2
            style={{ color: "var(--color-accent-red)" }}
            className="mb-2 max-[380px]:mb-1 sm:mb-3 text-lg max-[380px]:text-base sm:text-xl lg:text-2xl font-bold text-center"
          >
            Error
          </h2>
          <p
            style={{ color: "var(--color-text-body)" }}
            className="mb-3 max-[380px]:mb-2 sm:mb-4 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm text-center"
          >
            {fetchError}
          </p>
          <motion.button
            onClick={fetchData}
            className="w-full px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1 max-[380px]:py-0.75 sm:py-1.5 lg:py-2 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm font-medium text-white rounded-full bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)] p-1.5 max-[380px]:p-1 sm:p-2 md:p-4 lg:p-6 font-sans">
      <div className="mx-auto space-y-2 max-[380px]:space-y-1.5 sm:space-y-3 md:space-y-4 lg:space-y-6 max-w-[100vw] sm:max-w-3xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl">
        {/* Header */}
        <motion.div
          className="flex flex-col items-start justify-between gap-2 max-[380px]:gap-1 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: `var(--color-text-header)` }}
          >
            {import.meta.env.VITE_PLATFORM_NAME} Presale Controls
          </h2>
        </motion.div>

        {/* Last Updated and Refresh */}
        <motion.div
          className="flex items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-1.5 max-[380px]:space-x-1 sm:space-x-2 lg:space-x-3">
            <span
              style={{ color: "var(--color-text-header)" }}
              className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm font-semibold"
            >
              {lastUpdated
                ? `Last Updated: ${lastUpdated.toLocaleTimeString()}`
                : "Fetching Data..."}
            </span>
            <motion.button
              onClick={fetchData}
              className="p-1 max-[380px]:p-0.75 sm:p-1.5 lg:p-2 rounded-full bg-[var(--color-bg-start)] border border-[var(--color-border)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              disabled={isLoading}
              aria-label="Refresh data"
            >
              {isLoading ? (
                <motion.div
                  className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5 border-2 rounded-full border-t-transparent"
                  style={{ borderColor: COLORS.primary }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <RefreshCw
                  className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5"
                  style={{ color: COLORS.primary }}
                />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Controls Sections */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <motion.div
              className="w-6 max-[380px]:w-5 sm:w-7 lg:w-8 h-6 max-[380px]:h-5 sm:h-7 lg:h-8 border-2 rounded-full border-t-transparent"
              style={{ borderColor: COLORS.primary }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <div className="space-y-2 max-[380px]:space-y-1.5 sm:space-y-3 lg:space-y-4">
            {/* State Controls */}
            <CollapsibleSection
              title="State Management"
              icon={Settings}
              isOpen={openSections.state}
              toggle={() => toggleSection("state")}
            >
              <div className="grid grid-cols-1 max-[380px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-[380px]:gap-1.5 sm:gap-3 lg:gap-4">
                <div className="relative group">
                  <label
                    style={{ color: "var(--color-text-sub)" }}
                    className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                  >
                    Presale State
                    <span className="ml-1 text-[var(--color-accent-green)]">
                      (Current: {STATE_MAP[currentState]})
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full p-1.5 max-[380px]:p-1 sm:p-2 lg:p-2.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm appearance-none"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      {STATE_MAP.map((state, index) => (
                        <option key={state} value={index}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute w-3 max-[380px]:w-2.5 sm:w-3.5 lg:w-4 h-3 max-[380px]:h-2.5 sm:h-3.5 lg:h-4 -translate-y-1/2 pointer-events-none right-2 top-1/2"
                      style={{ color: "var(--color-text-sub)" }}
                    />
                  </div>
                  <div
                    className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                    style={{ color: "var(--color-text-header)" }}
                  >
                    Select NotStarted, Active, Ended, or ClaimOpen
                  </div>
                </div>
                <div className="relative group">
                  <label
                    style={{ color: "var(--color-text-sub)" }}
                    className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                  >
                    Pause Status
                    <span className="ml-1 text-[var(--color-accent-green)]">
                      (Current: {paused ? "Paused" : "Unpaused"})
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={paused}
                    onChange={() => handlePauseToggle(!paused)}
                    label={paused ? "Paused" : "Unpaused"}
                    id="pause-toggle"
                  />
                  <div
                    className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                    style={{ color: "var(--color-text-header)" }}
                  >
                    Pause or unpause the presale
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {loadingStates.state && (
                  <motion.div
                    className="mt-2 max-[380px]:mt-1.5 sm:mt-3 flex items-center justify-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5 border-2 rounded-full border-t-transparent mr-1.5 max-[380px]:mr-1 sm:mr-2"
                      style={{ borderColor: COLORS.primary }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span
                      style={{ color: "var(--color-text-body)" }}
                      className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                    >
                      Updating state...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                onClick={handleStateChange}
                className={`mt-2 max-[380px]:mt-1.5 sm:mt-3 lg:mt-4 w-full sm:w-auto px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1.5 max-[380px]:py-1 sm:py-2 lg:py-2.5 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] text-white font-medium ${
                  loadingStates.state ? "opacity-50 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: loadingStates.state ? 1 : 1.05 }}
                whileTap={{ scale: loadingStates.state ? 1 : 0.95 }}
                transition={{ duration: 0.1 }}
                disabled={
                  parseInt(formData.state) === currentState ||
                  loadingStates.state
                }
                aria-label="Set presale state"
              >
                Set State
              </motion.button>
            </CollapsibleSection>

            {/* Whitelist Controls */}
            <CollapsibleSection
              title="Whitelist Management"
              icon={Users}
              isOpen={openSections.whitelist}
              toggle={() => toggleSection("whitelist")}
            >
              <div className="grid grid-cols-1 max-[380px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-[380px]:gap-1.5 sm:gap-3 lg:gap-4">
                <div className="relative group">
                  <label
                    style={{ color: "var(--color-text-sub)" }}
                    className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                  >
                    Whitelist Status
                    <span className="ml-1 text-[var(--color-accent-green)]">
                      (Current: {whitelistEnabled ? "Enabled" : "Disabled"})
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={whitelistEnabled}
                    onChange={() => handleWhitelistToggle(!whitelistEnabled)}
                    label={whitelistEnabled ? "Enabled" : "Disabled"}
                    id="whitelist-toggle"
                  />
                  <div
                    className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                    style={{ color: "var(--color-text-header)" }}
                  >
                    Toggle whitelist requirement
                  </div>
                </div>
                <div className="relative group">
                  <label
                    style={{ color: "var(--color-text-sub)" }}
                    className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                  >
                    Manage Addresses
                  </label>
                  <textarea
                    name="whitelistAddresses"
                    value={formData.whitelistAddresses}
                    onChange={handleInputChange}
                    placeholder="0x123...\n0x456..."
                    className="w-full p-1.5 max-[380px]:p-1 sm:p-2 lg:p-2.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm resize-y min-h-[60px] sm:min-h-[80px] lg:min-h-[100px]"
                    style={{ color: "var(--color-text-body)" }}
                  />
                  {errors.whitelistAddresses && (
                    <p className="mt-0.5 max-[380px]:mt-0 sm:mt-1 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] text-[var(--color-accent-red)]">
                      {errors.whitelistAddresses}
                    </p>
                  )}
                  <div className="flex gap-2 max-[380px]:gap-1.5 sm:gap-3 mt-1.5 max-[380px]:mt-1 sm:mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="whitelistAction"
                        value="add"
                        checked={formData.whitelistAction === "add"}
                        onChange={handleInputChange}
                        className="mr-1 max-[380px]:mr-0.5 text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)]"
                        id="whitelist-add"
                      />
                      <span
                        style={{ color: "var(--color-text-body)" }}
                        className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                      >
                        Add
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="whitelistAction"
                        value="remove"
                        checked={formData.whitelistAction === "remove"}
                        onChange={handleInputChange}
                        className="mr-1 max-[380px]:mr-0.5 text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)]"
                        id="whitelist-remove"
                      />
                      <span
                        style={{ color: "var(--color-text-body)" }}
                        className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                      >
                        Remove
                      </span>
                    </label>
                  </div>
                  <div
                    className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                    style={{ color: "var(--color-text-header)" }}
                  >
                    Enter addresses (comma or newline separated)
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {loadingStates.whitelist && (
                  <motion.div
                    className="mt-2 max-[380px]:mt-1.5 sm:mt-3 flex items-center justify-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5 border-2 rounded-full border-t-transparent mr-1.5 max-[380px]:mr-1 sm:mr-2"
                      style={{ borderColor: COLORS.primary }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span
                      style={{ color: "var(--color-text-body)" }}
                      className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                    >
                      Updating whitelist...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                onClick={handleWhitelistUpdate}
                className={`mt-2 max-[380px]:mt-1.5 sm:mt-3 lg:mt-4 w-full sm:w-auto px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1.5 max-[380px]:py-1 sm:py-2 lg:py-2.5 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] text-white font-medium ${
                  loadingStates.whitelist ? "opacity-50 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: loadingStates.whitelist ? 1 : 1.05 }}
                whileTap={{ scale: loadingStates.whitelist ? 1 : 0.95 }}
                transition={{ duration: 0.1 }}
                disabled={
                  !formData.whitelistAddresses ||
                  !formData.whitelistAddresses
                    .split(/[\n,]/)
                    .some((addr) => ethers.isAddress(addr.trim())) ||
                  loadingStates.whitelist
                }
                aria-label="Update whitelist"
              >
                Update Whitelist
              </motion.button>
            </CollapsibleSection>

            {/* Settings Controls */}
            <CollapsibleSection
              title="Presale Settings"
              icon={SlidersHorizontal}
              isOpen={openSections.settings}
              toggle={() => toggleSection("settings")}
            >
              <div className="grid grid-cols-1 max-[380px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-[380px]:gap-1.5 sm:gap-3 lg:gap-4">
                {[
                  {
                    label: "USDT Price",
                    name: "usdtPrice",
                    placeholder: "e.g., 1000000",
                    current: currentSettings.usdtPrice,
                    unit: "USDT",
                    tooltip: `Price per ${
                      import.meta.env.VITE_TOKEN_NAME
                    } in USDT`,
                  },
                  {
                    label: "Min Purchase",
                    name: "minPurchase",
                    placeholder: "e.g., 100",
                    current: currentSettings.minPurchase,
                    unit: "USDT",
                    tooltip: "Minimum purchase amount",
                  },
                  {
                    label: "Max Purchase",
                    name: "maxPurchase",
                    placeholder: "e.g., 10000",
                    current: currentSettings.maxPurchase,
                    unit: "USDT",
                    tooltip: "Maximum purchase per transaction",
                  },
                  {
                    label: "User Hard Cap",
                    name: "userHardCap",
                    placeholder: "e.g., 50000",
                    current: currentSettings.userHardCap,
                    unit: "USDT",
                    tooltip: "Total purchase limit per user",
                  },
                ].map((field) => (
                  <div key={field.name} className="relative group">
                    <label
                      style={{ color: "var(--color-text-sub)" }}
                      className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                      htmlFor={field.name}
                    >
                      {field.label}
                      <span className="ml-1 text-[var(--color-accent-green)]">
                        (Current: {field.current} {field.unit})
                      </span>
                    </label>
                    <input
                      type="number"
                      id={field.name}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      className={`w-full p-1.5 max-[380px]:p-1 sm:p-2 lg:p-2.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm ${
                        formData[field.name] &&
                        parseFloat(formData[field.name]) !== field.current
                          ? "ring-2 ring-[var(--color-accent-blue)]"
                          : ""
                      }`}
                      style={{ color: "var(--color-text-body)" }}
                    />
                    {errors[field.name] && (
                      <p className="mt-0.5 max-[380px]:mt-0 sm:mt-1 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] text-[var(--color-accent-red)]">
                        {errors[field.name]}
                      </p>
                    )}
                    <div
                      className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                      style={{ color: "var(--color-text-header)" }}
                    >
                      {field.tooltip}
                    </div>
                  </div>
                ))}
              </div>
              <motion.button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-2 max-[380px]:mt-1.5 sm:mt-3 lg:mt-4 px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1 max-[380px]:py-0.75 sm:py-1.5 lg:py-2 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-[var(--color-bg-start)] text-[var(--color-text-body)] border border-[var(--color-border)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                aria-label={
                  showAdvanced
                    ? "Hide advanced settings"
                    : "Show advanced settings"
                }
              >
                {showAdvanced ? "Hide Advanced" : "Show Advanced"}
              </motion.button>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    className="grid grid-cols-1 max-[380px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-[380px]:gap-1.5 sm:gap-3 lg:gap-4 mt-2 max-[380px]:mt-1.5 sm:mt-3 lg:mt-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {[
                      {
                        label: "Initial Unlock %",
                        name: "initialUnlockPercentage",
                        placeholder: "e.g., 20",
                        current: currentSettings.initialUnlockPercentage,
                        unit: "%",
                        tooltip: "Tokens unlocked at TGE",
                      },
                      {
                        label: "Claim Period",
                        name: "claimPeriod",
                        placeholder: "e.g., 30",
                        current: currentSettings.claimPeriod,
                        unit: "days",
                        tooltip: "Vesting period between claims",
                      },
                      {
                        label: "Claim Unlock %",
                        name: "claimUnlockPercentage",
                        placeholder: "e.g., 20",
                        current: currentSettings.claimUnlockPercentage,
                        unit: "%",
                        tooltip: "Tokens unlocked per claim",
                      },
                    ].map((field) => (
                      <div key={field.name} className="relative group">
                        <label
                          style={{ color: "var(--color-text-sub)" }}
                          className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                          htmlFor={field.name}
                        >
                          {field.label}
                          <span className="ml-1 text-[var(--color-accent-green)]">
                            (Current: {field.current} {field.unit})
                          </span>
                        </label>
                        <input
                          type="number"
                          id={field.name}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          placeholder={field.placeholder}
                          className={`w-full p-1.5 max-[380px]:p-1 sm:p-2 lg:p-2.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm ${
                            formData[field.name] &&
                            parseFloat(formData[field.name]) !== field.current
                              ? "ring-2 ring-[var(--color-accent-blue)]"
                              : ""
                          }`}
                          style={{ color: "var(--color-text-body)" }}
                        />
                        {errors[field.name] && (
                          <p className="mt-0.5 max-[380px]:mt-0 sm:mt-1 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] text-[var(--color-accent-red)]">
                            {errors[field.name]}
                          </p>
                        )}
                        <div
                          className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                          style={{ color: "var(--color-text-header)" }}
                        >
                          {field.tooltip}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {loadingStates.settings && (
                  <motion.div
                    className="mt-2 max-[380px]:mt-1.5 sm:mt-3 flex items-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5 border-2 rounded-full border-t-transparent mr-1.5 max-[380px]:mr-1 sm:mr-2"
                      style={{ borderColor: COLORS.primary }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span
                      style={{ color: "var(--color-text-body)" }}
                      className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                    >
                      Updating settings...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-2 max-[380px]:mt-1.5 sm:mt-3 lg:mt-4">
                <motion.button
                  onClick={handleSettingsUpdate}
                  className={`px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1.5 max-[380px]:py-1 sm:py-2 lg:py-2.5 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] text-white font-medium ${
                    loadingStates.settings
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  whileHover={{ scale: loadingStates.settings ? 1 : 1.05 }}
                  whileTap={{ scale: loadingStates.settings ? 1 : 0.95 }}
                  transition={{ duration: 0.1 }}
                  disabled={
                    !Object.keys(formData).some(
                      (key) =>
                        [
                          "usdtPrice",
                          "minPurchase",
                          "maxPurchase",
                          "userHardCap",
                          "initialUnlockPercentage",
                          "claimPeriod",
                          "claimUnlockPercentage",
                        ].includes(key) &&
                        formData[key] &&
                        parseFloat(formData[key]) !== currentSettings[key]
                    ) || loadingStates.settings
                  }
                  aria-label="Save presale settings"
                >
                  Save Settings
                </motion.button>
              </div>
            </CollapsibleSection>

            {/* Fund Management */}
            <CollapsibleSection
              title="Fund Management"
              icon={Banknote}
              isOpen={openSections.funds}
              toggle={() => toggleSection("funds")}
            >
              <div className="grid grid-cols-1 max-[380px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-[380px]:gap-1.5 sm:gap-3 lg:gap-4">
                <div className="relative group">
                  <label
                    style={{ color: "var(--color-text-sub)" }}
                    className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                    htmlFor="presaleTokens"
                  >
                    Deposit {import.meta.env.VITE_TOKEN_NAME} Tokens
                  </label>
                  <input
                    type="number"
                    id="presaleTokens"
                    name="presaleTokens"
                    value={formData.presaleTokens}
                    onChange={handleInputChange}
                    placeholder="e.g., 1000000"
                    className="w-full p-1.5 max-[380px]:p-1 sm:p-2 lg:p-2.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                    style={{ color: "var(--color-text-body)" }}
                  />
                  {errors.presaleTokens && (
                    <p className="mt-0.5 max-[380px]:mt-0 sm:mt-1 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] text-[var(--color-accent-red)]">
                      {errors.presaleTokens}
                    </p>
                  )}
                  <AnimatePresence>
                    {loadingStates.deposit && (
                      <motion.div
                        className="mt-1.5 max-[380px]:mt-1 sm:mt-2 flex items-center justify-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.1 }}
                      >
                        <motion.div
                          className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5 border-2 rounded-full border-t-transparent mr-1.5 max-[380px]:mr-1 sm:mr-2"
                          style={{ borderColor: COLORS.primary }}
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span
                          style={{ color: "var(--color-text-body)" }}
                          className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                        >
                          Depositing {import.meta.env.VITE_TOKEN_NAME}...
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button
                    onClick={handlePresaleTokens}
                    className={`mt-1.5 max-[380px]:mt-1 sm:mt-2 w-full sm:w-auto px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1.5 max-[380px]:py-1 sm:py-2 lg:py-2.5 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-blue)] text-white font-medium ${
                      loadingStates.deposit
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    whileHover={{ scale: loadingStates.deposit ? 1 : 1.05 }}
                    whileTap={{ scale: loadingStates.deposit ? 1 : 0.95 }}
                    transition={{ duration: 0.1 }}
                    disabled={
                      !formData.presaleTokens ||
                      parseFloat(formData.presaleTokens) <= 0 ||
                      loadingStates.deposit
                    }
                    aria-label={`Deposit ${
                      import.meta.env.VITE_TOKEN_NAME
                    } tokens`}
                  >
                    Deposit {import.meta.env.VITE_TOKEN_NAME}
                  </motion.button>
                  <div
                    className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                    style={{ color: "var(--color-text-header)" }}
                  >
                    Transfer {import.meta.env.VITE_TOKEN_NAME} tokens to presale
                  </div>
                </div>
                <div className="relative group">
                  <label
                    style={{ color: "var(--color-text-sub)" }}
                    className="block text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm mb-0.5 max-[380px]:mb-0 sm:mb-1 font-medium"
                    htmlFor="withdrawAddress"
                  >
                    Withdraw Funds
                  </label>
                  <input
                    type="text"
                    id="withdrawAddress"
                    name="withdrawAddress"
                    value={formData.withdrawAddress}
                    onChange={handleInputChange}
                    placeholder="0x123..."
                    className="w-full p-1.5 max-[380px]:p-1 sm:p-2 lg:p-2.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                    style={{ color: "var(--color-text-body)" }}
                  />
                  {errors.withdrawAddress && (
                    <p className="mt-0.5 max-[380px]:mt-0 sm:mt-1 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] text-[var(--color-accent-red)]">
                      {errors.withdrawAddress}
                    </p>
                  )}
                  <div className="relative">
                    <select
                      name="withdrawType"
                      value={formData.withdrawType}
                      onChange={handleInputChange}
                      className="w-full mt-1.5 max-[380px]:mt-1 sm:mt-2 p-1.5 max-[380px]:p-1 sm:p-2 lg:p-2.5 rounded-lg bg-[var(--color-bg-start)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm appearance-none"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      {[
                        "USDT Funds",
                        `${import.meta.env.VITE_TOKEN_NAME} Tokens`,
                        "USDT Emergency",
                      ].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute w-3 max-[380px]:w-2.5 sm:w-3.5 lg:w-4 h-3 max-[380px]:h-2.5 sm:h-3.5 lg:h-4 -translate-y-1/2 pointer-events-none right-2 top-1/2"
                      style={{ color: "var(--color-text-sub)" }}
                    />
                  </div>
                  <AnimatePresence>
                    {loadingStates.withdraw && (
                      <motion.div
                        className="mt-1.5 max-[380px]:mt-1 sm:mt-2 flex items-center justify-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.1 }}
                      >
                        <motion.div
                          className="w-3.5 max-[380px]:w-3 sm:w-4 lg:w-5 h-3.5 max-[380px]:h-3 sm:h-4 lg:h-5 border-2 rounded-full border-t-transparent mr-1.5 max-[380px]:mr-1 sm:mr-2"
                          style={{ borderColor: COLORS.primary }}
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span
                          style={{ color: "var(--color-text-body)" }}
                          className="text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm"
                        >
                          Withdrawing funds...
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button
                    onClick={handleWithdraw}
                    className={`mt-1.5 max-[380px]:mt-1 sm:mt-2 w-full sm:w-auto px-2 max-[380px]:px-1.5 sm:px-3 lg:px-4 py-1.5 max-[380px]:py-1 sm:py-2 lg:py-2.5 text-[9px] max-[380px]:text-[8px] sm:text-xs lg:text-sm rounded-lg bg-gradient-to-r from-[#ef4444] to-[#f87171] text-white font-medium ${
                      loadingStates.withdraw
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    whileHover={{ scale: loadingStates.withdraw ? 1 : 1.05 }}
                    whileTap={{ scale: loadingStates.withdraw ? 1 : 0.95 }}
                    transition={{ duration: 0.1 }}
                    disabled={
                      !ethers.isAddress(formData.withdrawAddress) ||
                      loadingStates.withdraw
                    }
                    aria-label="Withdraw funds"
                  >
                    <ArrowRightLeft className="inline w-3 max-[380px]:w-2.5 sm:w-3.5 lg:w-4 h-3 max-[380px]:h-2.5 sm:h-3.5 lg:h-4 mr-1" />
                    Withdraw
                  </motion.button>
                  <div
                    className="absolute z-10 invisible p-1 max-[380px]:p-0.5 sm:p-1.5 text-[8px] max-[380px]:text-[7px] sm:text-[9px] lg:text-[10px] bg-[var(--color-card-bg)]/90 border border-[var(--color-border)] rounded-md shadow-lg opacity-0 left-1/2 transform -translate-x-1/2 -top-6 max-[380px]:-top-5 sm:-top-7 lg:-top-8 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity font-semibold"
                    style={{ color: "var(--color-text-header)" }}
                  >
                    Withdraw funds to this address
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() =>
            setConfirmModal({
              isOpen: false,
              action: "",
              address: "",
              onConfirm: () => {},
            })
          }
          onConfirm={confirmModal.onConfirm}
          action={confirmModal.action}
          address={confirmModal.address}
        />
      </div>
    </div>
  );
}

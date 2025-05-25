import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./components/AdminSidebar";
import { useWallet } from "./context/WalletContext.jsx";
import { ethers } from "ethers";

// Create a ThemeContext
const ThemeContext = createContext();

export default function AdminDashboardLayout() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  const { walletConnected, walletAddress } = useWallet();
  const navigate = useNavigate();
  const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS
    ? ethers.getAddress(import.meta.env.VITE_ADMIN_ADDRESS)
    : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Fallback

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("Wallet State:", { walletConnected, walletAddress });
    // Clear isCheckingWallet when wallet state is confirmed or after timeout
    if (walletConnected || walletAddress) {
      setIsCheckingWallet(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsCheckingWallet(false);
    }, 2000); // 2s timeout for slow wallet checks
    return () => clearTimeout(timer);
  }, [walletConnected, walletAddress]);

  useEffect(() => {
    if (!mounted || isCheckingWallet) return;

    // Log for debugging
    console.log("Admin Check:", {
      walletConnected,
      walletAddress,
      normalizedWallet: walletAddress
        ? ethers.getAddress(walletAddress)
        : null,
      ADMIN_ADDRESS,
      isCheckingWallet,
      mounted,
    });

    if (
      !walletConnected ||
      !walletAddress ||
      ethers.getAddress(walletAddress) !== ADMIN_ADDRESS
    ) {
      console.log("Redirecting to /: Invalid admin credentials");
      navigate("/", { replace: true });
    }
  }, [
    walletConnected,
    walletAddress,
    mounted,
    isCheckingWallet,
    navigate,
    ADMIN_ADDRESS,
  ]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  if (!mounted || isCheckingWallet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
          <p
            className="mt-2 text-sm text-gray-300"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  if (
    !walletConnected ||
    !walletAddress ||
    ethers.getAddress(walletAddress) !== ADMIN_ADDRESS
  ) {
    return null; // Redirect handled by useEffect
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className="flex min-h-screen font-sans"
        style={{
          background: theme === "dark" ? "#1F2937" : "#E5E7EB",
        }}
      >
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className="overflow-hidden flex-1 flex flex-col md:ml-[var(--sidebar-width)] transition-all duration-300"
          style={{ "--sidebar-width": isCollapsed ? "80px" : "256px" }}
        >
          <main className="px-6 pt-20 lg:pt-8 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

// Custom hook to access theme context
export function useTheme() {
  return useContext(ThemeContext);
}

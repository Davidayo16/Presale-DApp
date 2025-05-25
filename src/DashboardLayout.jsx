import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useWallet } from "./context/WalletContext.jsx";

// Create a ThemeContext
const ThemeContext = createContext();

export default function DashboardLayout() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  const { walletConnected, walletAddress } = useWallet();
  const navigate = useNavigate();

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
    console.log("Wallet Check:", {
      walletConnected,
      walletAddress,
      isCheckingWallet,
      mounted,
    });

    if (!walletConnected || !walletAddress) {
      console.log("Redirecting to /: No wallet connected");
      navigate("/", { replace: true });
    }
  }, [walletConnected, walletAddress, mounted, isCheckingWallet, navigate]);

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
            Checking wallet...
          </p>
        </div>
      </div>
    );
  }

  if (!walletConnected || !walletAddress) {
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
          className="flex-1 flex flex-col md:ml-[var(--sidebar-width)] transition-all duration-300"
          style={{ "--sidebar-width": isCollapsed ? "80px" : "256px" }}
        >
          <main className="px-6 pt-20 lg:pt-8">
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

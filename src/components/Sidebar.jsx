import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../DashboardLayout";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import {
  HomeIcon,
  ShoppingCartIcon,
  GiftIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
  BellIcon,
} from "@heroicons/react/outline";
import { useState, useEffect, useMemo } from "react";
import { Link as ScrollLink } from "react-scroll";

import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";

const menuItems = [
  { name: "Overview", href: "/dashboard", icon: HomeIcon },
  { name: "Purchase", href: "/dashboard/purchase", icon: ShoppingCartIcon },
  { name: "Claim Token", href: "/dashboard/claim", icon: GiftIcon },
  { name: "Claim Rewards", href: "/dashboard/rewards", icon: ChartBarIcon },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: CurrencyDollarIcon,
  },
  { name: "Account", href: "/dashboard/settings", icon: UserIcon },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { theme } = useTheme();
  const location = useLocation();
  const { walletConnected, walletAddress } = useWallet();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
    expanded: { width: "16rem" },
    collapsed: { width: "5rem" },
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu button */}
      <div
        className={`fixed top-0 left-0 z-40 w-full md:hidden transition-all duration-300 ${
          isScrolled ? "shadow-lg" : ""
        }`}
        style={{
          background: `linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center text-xl font-semibold">
            <Link
              to="/"
              smooth={true}
              duration={500}
              className="block h-12 cursor-pointer"
            >
              <img
                src="/images/logo1.png"
                alt="Logo"
                className="w-12 min-w-[48px] h-auto object-contain hover:rotate-[5deg] transition-transform"
              />
            </Link>
          </div>
          <motion.button
            type="button"
            onClick={toggleSidebar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{ color: `var(--color-text-body)` }}
          >
            {isSidebarOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <motion.div
        className="fixed top-0 left-0 z-30 hidden h-full overflow-hidden md:block"
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        initial="expanded"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="relative flex flex-col h-full">
          {/* Animated background */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))`,
            }}
          ></div>

          {/* Animated orbs */}
          <div
            className="absolute w-40 h-40 rounded-full top-1/4 left-1/4 filter blur-3xl opacity-20 animate-pulse"
            style={{ background: `var(--color-switch-off)` }}
          ></div>
          <div
            className="absolute right-0 w-32 h-32 rounded-full bottom-1/3 filter blur-3xl opacity-20 animate-pulse"
            style={{
              background: `var(--color-switch-off)`,
              animationDelay: "1s",
            }}
          ></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full backdrop-blur-sm">
            {/* Logo with Collapse Button */}
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "justify-between"
              } h-16 px-4`}
              style={{
                borderBottom: `1px solid var(--color-border)`,
                background: `var(--color-bg-start)`,
              }}
            >
              {!isCollapsed && (
                <div className="flex items-center">
                  <Link
                    to="/"
                    smooth={true}
                    duration={500}
                    className="block h-12 cursor-pointer"
                  >
                    <img
                      src="/images/logo1.png"
                      alt="Logo"
                      className="w-12 min-w-[48px] h-auto object-contain hover:rotate-[5deg] transition-transform"
                    />
                  </Link>
                </div>
              )}

              {/* Collapse Button (visible when expanded) */}
              {!isCollapsed && (
                <motion.button
                  onClick={toggleCollapse}
                  className="p-1 transition-colors rounded-full "
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Collapse sidebar"
                >
                  <FiArrowLeft
                    className="w-5 h-5"
                    style={{ color: `var(--color-text-sub)` }}
                  />
                </motion.button>
              )}
            </div>

            {/* Floating Expand Button (visible when collapsed) */}
            {isCollapsed && (
              <motion.button
                onClick={toggleCollapse}
                className="absolute z-20 p-2 -translate-x-1/2 rounded-full shadow-lg left-1/2 top-4"
                whileHover={{
                  scale: 1.1,
                }}
                whileTap={{ scale: 0.95 }}
                aria-label="Expand sidebar"
                style={{
                  background: `var(--color-bg-start)`,
                  border: `1px solid var(--color-border)`,
                }}
              >
                <FiArrowRight
                  className="w-4 h-4"
                  style={{ color: `var(--color-text-sub)` }}
                />
              </motion.button>
            )}

            {/* Navigation */}
            <nav
              className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin"
              style={{
                scrollbarColor: `${
                  theme === "dark" ? "#4b5563" : "#9ca3af"
                } transparent`,
              }}
            >
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  location.pathname.startsWith(`${item.href}/`);
                const isExactMatch = location.pathname === item.href;
                const isChildRoute =
                  location.pathname.startsWith(`${item.href}/`) &&
                  !isExactMatch;

                return (
                  <motion.div
                    key={item.name}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <NavLink
                      to={item.href}
                      className={`flex items-center ${
                        isCollapsed ? "justify-center px-2" : "px-4"
                      } py-3 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden group`}
                      style={{
                        color:
                          isActive && !isChildRoute
                            ? `var(--color-text-header)`
                            : `var(--color-text-sub)`,
                      }}
                    >
                      {/* Background layers */}
                      {isActive && !isChildRoute && (
                        <motion.div
                          className="absolute inset-0 border rounded-lg"
                          layoutId="activeBackground"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                          style={{
                            background: `linear-gradient(to right, var(--color-bg-end), var(--color-switch-off))`,
                            borderColor: `var(--color-border)`,
                          }}
                        />
                      )}

                      {!isActive && hoveredItem === item.name && (
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ background: `var(--color-bg-end)` }}
                        />
                      )}

                      {/* Icon with glow effect */}
                      <div
                        className="relative z-10"
                        style={{
                          color:
                            isActive && !isChildRoute
                              ? `var(--color-text-header)`
                              : `var(--color-text-body)`,
                        }}
                      >
                        <item.icon
                          className={`w-5 h-5 ${
                            !isCollapsed && "mr-3"
                          } transition-all duration-300 ${
                            hoveredItem === item.name
                              ? "scale-110"
                              : "scale-100"
                          }`}
                        />
                        {isActive && !isChildRoute && (
                          <motion.div
                            className="absolute inset-0 bg-blue-400 rounded-full opacity-50 filter blur-md"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 0.5 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              repeatType: "reverse",
                            }}
                          />
                        )}
                      </div>

                      {/* Text (hidden when collapsed) */}
                      {!isCollapsed && (
                        <span className="relative z-10">{item.name}</span>
                      )}

                      {/* Arrow indicator (hidden when collapsed) */}
                      {!isCollapsed && isActive && !isChildRoute && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-auto"
                        >
                          <ChevronRightIcon
                            className="w-4 h-4"
                            style={{ color: `var(--color-text-header)` }}
                          />
                        </motion.div>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div
                          className="absolute z-50 px-2 py-1 ml-2 text-xs font-medium transition-opacity rounded-md shadow-lg opacity-0 left-full group-hover:opacity-100 whitespace-nowrap"
                          style={{
                            background: `var(--color-bg-start)`,
                            color: `var(--color-text-body)`,
                          }}
                        >
                          {item.name}
                        </div>
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </nav>

            {/* Notifications Card (hidden when collapsed) */}
            {!isCollapsed && (
              <div className="px-4 py-3">
                <motion.div
                  className="p-3 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  style={{
                    background: `linear-gradient(to right, var(--color-bg-end), var(--color-switch-off))`,
                    border: `1px solid var(--color-border)`,
                  }}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <BellIcon
                        className="w-5 h-5"
                        style={{ color: `var(--color-text-body)` }}
                      />
                      <span className="absolute w-2 h-2 bg-pink-500 rounded-full -top-1 -right-1"></span>
                    </div>
                    <div className="ml-3">
                      <p
                        className="text-xs font-medium"
                        style={{ color: `var(--color-text-header)` }}
                      >
                        New Update
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: `var(--color-text-sub)` }}
                      >
                        Presale phase 2 begins soon
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* User info (collapsed shows only MetaMask icon) */}
            <div
              className={`p-4 ${isCollapsed ? "flex justify-center" : ""}`}
              style={{
                borderTop: `1px solid var(--color-border)`,
                background: `linear-gradient(to bottom, transparent, var(--color-bg-end))`,
              }}
            >
              <motion.div
                className="flex items-center"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="relative">
                  <motion.div
                    className="flex items-center justify-center w-8 h-8 p-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    animate={{
                      boxShadow: [
                        "0 0 5px rgba(6, 182, 212, 0.3)",
                        "0 0 12px rgba(6, 182, 212, 0.6)",
                        "0 0 5px rgba(6, 182, 212, 0.3)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <img
                      src="/images/metamask-icon.png"
                      alt="Metamask Icon"
                      className={`${
                        isCollapsed ? "w-5 h-5" : "w-6 h-6"
                      } object-contain`}
                    />
                  </motion.div>
                  <motion.div
                    className="absolute w-3 h-3 bg-green-500 rounded-full -bottom-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ border: `2px solid var(--color-bg-start)` }}
                  />
                </div>
                {!isCollapsed && (
                  <div className="ml-3">
                    <p
                      className="text-sm font-medium"
                      style={{ color: `var(--color-text-header)` }}
                    >
                      Connected Wallet
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: `var(--color-text-sub)` }}
                    >
                      {walletConnected && walletAddress
                        ? formatWalletAddress(walletAddress)
                        : "Not connected"}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed top-0 left-0 z-30 w-64 h-full overflow-hidden md:hidden"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="relative flex flex-col h-full">
              {/* Animated background */}
              <div
                className="absolute inset-0 z-0"
                style={{
                  background: `linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-end))`,
                }}
              ></div>

              {/* Animated orbs */}
              <div
                className="absolute w-40 h-40 rounded-full top-1/4 left-1/4 filter blur-3xl opacity-20 animate-pulse"
                style={{ background: `var(--color-switch-off)` }}
              ></div>
              <div
                className="absolute right-0 w-32 h-32 rounded-full bottom-1/3 filter blur-3xl opacity-20 animate-pulse"
                style={{
                  background: `var(--color-switch-off)`,
                  animationDelay: "1s",
                }}
              ></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full backdrop-blur-sm">
                {/* Logo */}
                <div
                  className="flex items-center justify-center h-16 px-4"
                  style={{
                    borderBottom: `1px solid var(--color-border)`,
                    background: `var(--color-bg-start)`,
                  }}
                >
                  <div className="flex items-center">
                    <ScrollLink
                      to="home"
                      smooth={true}
                      duration={500}
                      className="block h-12 cursor-pointer"
                    >
                      <img
                        src="/images/logo.png"
                        alt="Logo"
                        className="w-12 min-w-[48px] h-auto object-contain hover:rotate-[5deg] transition-transform"
                      />
                    </ScrollLink>
                  </div>
                </div>

                {/* Navigation */}
                <nav
                  className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin"
                  style={{
                    scrollbarColor: `${
                      theme === "dark" ? "#4b5563" : "#9ca3af"
                    } transparent`,
                  }}
                >
                  {menuItems.map((item) => {
                    const isActive =
                      location.pathname === item.href ||
                      location.pathname.startsWith(`${item.href}/`);
                    const isExactMatch = location.pathname === item.href;
                    const isChildRoute =
                      location.pathname.startsWith(`${item.href}/`) &&
                      !isExactMatch;

                    return (
                      <motion.div
                        key={item.name}
                        onMouseEnter={() => setHoveredItem(item.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <NavLink
                          to={item.href}
                          className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden group"
                          onClick={() => {
                            if (isSidebarOpen) setIsSidebarOpen(false);
                          }}
                          style={{
                            color:
                              isActive && !isChildRoute
                                ? `var(--color-text-header)`
                                : `var(--color-text-sub)`,
                          }}
                        >
                          {/* Background layers */}
                          {isActive && !isChildRoute && (
                            <motion.div
                              className="absolute inset-0 border rounded-lg"
                              layoutId="activeBackground"
                              initial={false}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                              style={{
                                background: `linear-gradient(to right, var(--color-bg-end), var(--color-switch-off))`,
                                borderColor: `var(--color-border)`,
                              }}
                            />
                          )}

                          {!isActive && hoveredItem === item.name && (
                            <motion.div
                              className="absolute inset-0 rounded-lg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              style={{ background: `var(--color-bg-end)` }}
                            />
                          )}

                          {/* Icon with glow effect */}
                          <div
                            className="relative z-10"
                            style={{
                              color:
                                isActive && !isChildRoute
                                  ? `var(--color-text-header)`
                                  : `var(--color-text-body)`,
                            }}
                          >
                            <item.icon
                              className={`w-5 h-5 mr-3 transition-all duration-300 ${
                                hoveredItem === item.name
                                  ? "scale-110"
                                  : "scale-100"
                              }`}
                            />
                            {isActive && !isChildRoute && (
                              <motion.div
                                className="absolute inset-0 bg-blue-400 rounded-full opacity-50 filter blur-md"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 0.5 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                }}
                              />
                            )}
                          </div>

                          {/* Text */}
                          <span className="relative z-10">{item.name}</span>

                          {/* Arrow indicator */}
                          {isActive && !isChildRoute && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="ml-auto"
                            >
                              <ChevronRightIcon
                                className="w-4 h-4"
                                style={{ color: `var(--color-text-header)` }}
                              />
                            </motion.div>
                          )}
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Notifications Card */}
                <div className="px-4 py-3">
                  <motion.div
                    className="p-3 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    style={{
                      background: `linear-gradient(to right, var(--color-bg-end), var(--color-switch-off))`,
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <BellIcon
                          className="w-5 h-5"
                          style={{ color: `var(--color-text-body)` }}
                        />
                        <span className="absolute w-2 h-2 bg-pink-500 rounded-full -top-1 -right-1"></span>
                      </div>
                      <div className="ml-3">
                        <p
                          className="text-xs font-medium"
                          style={{ color: `var(--color-text-header)` }}
                        >
                          New Update
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: `var(--color-text-sub)` }}
                        >
                          Presale phase 2 begins soon
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* User info */}
                <div
                  className="p-4"
                  style={{
                    borderTop: `1px solid var(--color-border)`,
                    background: `linear-gradient(to bottom, transparent, var(--color-bg-end))`,
                  }}
                >
                  <motion.div
                    className="flex items-center"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="relative">
                      <motion.div
                        className="flex items-center justify-center w-8 h-8 p-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        animate={{
                          boxShadow: [
                            "0 0 5px rgba(6, 182, 212, 0.3)",
                            "0 0 12px rgba(6, 182, 212, 0.6)",
                            "0 0 5px rgba(6, 182, 212, 0.3)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <img
                          src="/images/metamask-icon.png"
                          alt="Metamask Icon"
                          className="w-6 h-6 object-contain"
                        />
                      </motion.div>
                      <motion.div
                        className="absolute w-3 h-3 bg-green-500 rounded-full -bottom-1 -right-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ border: `2px solid var(--color-bg-start)` }}
                      />
                    </div>
                    <div className="ml-3">
                      <p
                        className="text-sm font-medium"
                        style={{ color: `var(--color-text-header)` }}
                      >
                        Connected Wallet
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: `var(--color-text-sub)` }}
                      >
                        {walletConnected && walletAddress
                          ? formatWalletAddress(walletAddress)
                          : "Not connected"}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

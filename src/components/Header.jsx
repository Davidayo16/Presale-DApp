import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useWallet } from "../context/WalletContext.jsx";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { walletConnected, walletAddress, connectWallet } = useWallet();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debug isOpen state
  useEffect(() => {
    console.log("Mobile menu isOpen:", isOpen);
  }, [isOpen]);

  const navItems = [
    { name: "Staking", to: "/dashboard/purchase" },
    { name: "Dashboard", to: "/dashboard" },
    { name: "Tokenomics", to: "/tokenomics" },
  ];

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Dynamic font sizes based on screen width
  const getFontSize = () => {
    if (window.innerWidth < 640) return "text-sm";
    if (window.innerWidth < 768) return "text-base";
    return "text-lg";
  };

  return (
    <motion.header
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={`fixed w-full top-0 z-50 ${
        isScrolled ? "bg-gray-900 shadow-2xl" : "bg-gray-900"
      } transition-all duration-300`}
    >
      <div className="flex items-center justify-between px-2 sm:px-4 lg:px-6 py-3 sm:py-4 mx-auto max-w-7xl">
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
          <Link to="/" className="block h-12 sm:h-14 cursor-pointer">
            <img
              src="/images/logo1.png"
              alt="Logo"
              className="w-12 sm:w-14 lg:w-16 min-w-[48px] h-auto object-contain hover:rotate-[5deg] transition-transform"
            />
          </Link>
        </motion.div>

        <nav className="items-center hidden gap-6 md:flex">
          {navItems.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              {item.to.startsWith("/") ? (
                <Link to={item.to} className="relative cursor-pointer">
                  <span
                    className={`block px-2 sm:px-3 py-2 font-medium tracking-wide transition-all duration-300 text-white/90 hover:text-cyan-400 ${getFontSize()}`}
                  >
                    {item.name}
                    <span className="absolute inset-x-0 -bottom-1 h-[2px] bg-cyan-400 transform origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                  </span>
                </Link>
              ) : (
                <ScrollLink
                  to={item.to}
                  smooth={true}
                  duration={500}
                  className="relative cursor-pointer"
                >
                  <span
                    className={`block px-2 sm:px-3 py-2 font-medium tracking-wide transition-all duration-300 text-white/90 hover:text-cyan-400 ${getFontSize()}`}
                  >
                    {item.name}
                    <span className="absolute inset-x-0 -bottom-1 h-[2px] bg-cyan-400 transform origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
                  </span>
                </ScrollLink>
              )}
            </motion.div>
          ))}
        </nav>

        <div className="max-[370px]:hidden">
          {walletConnected ? (
            <Link to="/dashboard">
              <motion.div
                className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 space-x-2 border rounded-full bg-gray-800/80 backdrop-blur-md border-cyan-500/30 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                style={{
                  boxShadow: "0 0 15px rgba(6, 182, 212, 0.2)",
                }}
              >
                <motion.div
                  className="flex items-center justify-center w-6 sm:w-8 h-6 sm:h-8 p-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
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
                    className="w-4 sm:w-6 h-auto"
                  />
                </motion.div>
                <span className={`font-medium text-white ${getFontSize()}`}>
                  {formatWalletAddress(walletAddress)}
                </span>
              </motion.div>
            </Link>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet}
              className="relative hidden px-6 sm:px-8 py-2 sm:py-3 overflow-hidden text-white transition-all duration-300 shadow-xl md:block bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl hover:shadow-2xl"
            >
              <span className={`relative z-10 ${getFontSize()}`}>
                Connect Wallet
              </span>
              <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-white/10 hover:opacity-100" />
            </motion.button>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="md:hidden text-cyan-400"
          onClick={() => setIsOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 sm:w-9 h-7 sm:h-9"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 md:hidden overflow-y-auto"
          >
            <motion.button
              whileHover={{ rotate: 180 }}
              className="absolute text-3xl sm:text-4xl top-6 sm:top-8 right-6 sm:right-8 text-cyan-400"
              onClick={() => setIsOpen(false)}
            >
              ×
            </motion.button>

            <div className="flex flex-col items-center gap-6 sm:gap-8 text-lg sm:text-xl">
              {navItems.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.1 }}
                  className="relative"
                >
                  {item.to.startsWith("/") ? (
                    <Link
                      to={item.to}
                      className="transition-colors text-white/90 hover:text-cyan-400 cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-400 transition-all duration-500 hover:w-full" />
                    </Link>
                  ) : (
                    <ScrollLink
                      to={item.to}
                      smooth={true}
                      duration={500}
                      className="transition-colors text-white/90 hover:text-cyan-400 cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-400 transition-all duration-500 hover:w-full" />
                    </ScrollLink>
                  )}
                </motion.div>
              ))}
              <div className="">
                {walletConnected ? (
                  <Link to="/dashboard">
                    <motion.div
                      className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 space-x-2 border rounded-full bg-gray-800/80 backdrop-blur-md border-cyan-500/30 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      style={{
                        boxShadow: "0 0 15px rgba(6, 182, 212, 0.2)",
                      }}
                    >
                      <motion.div
                        className="flex items-center justify-center w-6 sm:w-8 h-6 sm:h-8 p-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
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
                          className="w-4 sm:w-6 h-auto"
                        />
                      </motion.div>
                      <span
                        className={`font-medium text-white ${getFontSize()}`}
                      >
                        {formatWalletAddress(walletAddress)}
                      </span>
                    </motion.div>
                  </Link>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={connectWallet}
                    className="px-8 sm:px-10 py-3 sm:py-4 mt-4 sm:mt-6 text-white shadow-xl bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl"
                  >
                    <span className={getFontSize()}>Connect Wallet</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

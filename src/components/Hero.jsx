// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { ethers } from "ethers";
// import { Wallet, Loader2, X } from "lucide-react";
// import { useWallet } from "../context/WalletContext.jsx";
// import { Link } from "react-router-dom";

// const presaleABI = [
//   "function presaleState() view returns (uint8)",
//   "function getCurrentPresaleState() view returns (uint8)",
// ];
// const presaleStages = ["Not Started", "Active", "Ended", "Claim Open"];

// const getStageColors = (stage) => {
//   const colors = {
//     0: {
//       gradient: "linear-gradient(to right, #8b5cf6, #6366f1)",
//       border: "rgba(139, 92, 246, 0.3)",
//       glow: "rgba(139, 92, 246, 0.3)",
//       boxShadow: "0 0 15px rgba(139, 92, 246, 0.2)",
//       animatedShadows: [
//         "0 0 10px rgba(139, 92, 246, 0.2)",
//         "0 0 20px rgba(139, 92, 246, 0.3)",
//         "0 0 10px rgba(139, 92, 246, 0.2)",
//       ],
//     },
//     1: {
//       gradient: "linear-gradient(to right, #67e8f9, #60a5fa)",
//       border: "rgba(6, 182, 212, 0.3)",
//       glow: "rgba(6, 182, 212, 0.3)",
//       boxShadow: "0 0 15px rgba(6, 182, 212, 0.2)",
//       animatedShadows: [
//         "0 0 10px rgba(6, 182, 212, 0.2)",
//         "0 0 20px rgba(6, 182, 212, 0.3)",
//         "0 0 10px rgba(6, 182, 212, 0.2)",
//       ],
//     },
//     2: {
//       gradient: "linear-gradient(to right, #ef4444, #dc2626)",
//       border: "rgba(239, 68, 68, 0.3)",
//       glow: "rgba(239, 68, 68, 0.3)",
//       boxShadow: "0 0 15px rgba(239, 68, 68, 0.2)",
//       animatedShadows: [
//         "0 0 10px rgba(239, 68, 68, 0.2)",
//         "0 0 20px rgba(239, 68, 68, 0.3)",
//         "0 0 10px rgba(239, 68, 68, 0.2)",
//       ],
//     },
//     3: {
//       gradient: "linear-gradient(to right, #10b981, #059669)",
//       border: "rgba(16, 185, 129, 0.3)",
//       glow: "rgba(16, 185, 129, 0.3)",
//       boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)",
//       animatedShadows: [
//         "0 0 10px rgba(16, 185, 129, 0.2)",
//         "0 0 20px rgba(16, 185, 129, 0.3)",
//         "0 0 10px rgba(16, 185, 129, 0.2)",
//       ],
//     },
//   };
//   return colors[stage] || colors[1];
// };

// export default function Hero() {
//   const [stage, setStage] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [debugInfo, setDebugInfo] = useState({
//     attempts: 0,
//     lastAttempt: null,
//     errors: [],
//   });

//   const {
//     walletConnected,
//     walletAddress,
//     connectingWallet,
//     error,
//     setError,
//     connectWallet,
//     disconnectWallet,
//   } = useWallet();

//   const presaleContractAddress = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
//   const rpcUrl = import.meta.env.VITE_RPC_URL;

//   const checkPresaleState = async () => {
//     console.log("Checking presale state...");
//     setLoading(true);

//     setDebugInfo((prev) => ({
//       ...prev,
//       attempts: prev.attempts + 1,
//       lastAttempt: new Date().toISOString(),
//     }));

//     try {
//       console.log("Setting up provider...");
//       const providerInstance = new ethers.JsonRpcProvider(rpcUrl);
//       console.log("Provider created");

//       console.log("Creating contract instance at", presaleContractAddress);
//       const contract = new ethers.Contract(
//         presaleContractAddress,
//         presaleABI,
//         providerInstance
//       );
//       console.log("Contract instance created");

//       console.log("Calling getCurrentPresaleState()...");
//       const state = await contract.getCurrentPresaleState();
//       console.log("Presale state (raw):", state);
//       console.log("Presale state (number):", Number(state));

//       setStage(Number(state));
//       setLoading(false);
//     } catch (err) {
//       console.error("Error checking presale state:", err);
//       setDebugInfo((prev) => ({
//         ...prev,
//         errors: [
//           ...prev.errors,
//           {
//             time: new Date().toISOString(),
//             error: err.message,
//           },
//         ],
//       }));
//     }
//   };

//   useEffect(() => {
//     console.log("Initial useEffect running");
//     checkPresaleState();

//     const interval = setInterval(() => {
//       console.log("Interval: checking presale state");
//       checkPresaleState();
//     }, 30000);

//     return () => clearInterval(interval);
//   }, []);

//   const getButtonConfig = () => {
//     if (!walletConnected) {
//       return {
//         text: "Connect Wallet",
//         action: connectWallet,
//         disabled: connectingWallet,
//         isLoading: connectingWallet,
//         to: null,
//       };
//     }

//     switch (stage) {
//       case 0:
//         return {
//           text: "Presale Not Started",
//           action: null,
//           disabled: true,
//           isLoading: false,
//           to: null,
//         };
//       case 1:
//         return {
//           text: "Buy Tokens",
//           action: null,
//           disabled: false,
//           isLoading: false,
//           to: "/dashboard",
//         };
//       case 2:
//         return {
//           text: "Presale Ended",
//           action: null,
//           disabled: true,
//           isLoading: false,
//           to: null,
//         };
//       case 3:
//         return {
//           text: "Claim Tokens",
//           action: null,
//           disabled: false,
//           isLoading: false,
//           to: "/claim",
//         };
//       default:
//         return {
//           text: "Check Presale State",
//           action: checkPresaleState,
//           disabled: loading,
//           isLoading: loading,
//           to: null,
//         };
//     }
//   };

//   const buttonConfig = getButtonConfig();

//   const formatWalletAddress = (address) => {
//     if (!address) return "";
//     return `${address.substring(0, 6)}...${address.substring(
//       address.length - 4
//     )}`;
//   };

//   return (
//     <section className="relative flex flex-col items-center justify-center min-h-screen px-4 py-16 mt-16 overflow-hidden text-white bg-gradient-to-br from-gray-900 to-gray-800">
//       <div className="absolute inset-0 bg-black/50 backdrop-blur-lg animate-pulse"></div>

//       <motion.div
//         animate={{ y: [0, -15, 0] }}
//         transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
//         className="absolute hidden opacity-50 top-10 right-10 md:block"
//       >
//         <img
//           src="/images/token.png"
//           alt="Floating Token"
//           width={80}
//           height={80}
//         />
//       </motion.div>

//       <div className="relative z-10 max-w-3xl px-4 text-center sm:px-6">
//         <motion.div
//           initial={{ scale: 0.8, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           transition={{ duration: 0.8 }}
//           className="h-48 mx-auto md:w-full md:h-64"
//         >
//           <img
//             src="/images/hero3.jpg"
//             alt="Project Logo"
//             // width={450}
//             // height={250}
//             className="w-full h-full"
//           />
//         </motion.div>

//         <motion.h1
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5, duration: 0.8 }}
//           className="mt-4 text-3xl font-extrabold tracking-wide text-transparent sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text"
//           style={{
//             WebkitBackgroundClip: "text",
//             WebkitTextFillColor: "transparent",
//             textShadow:
//               "0 0 10px rgba(0, 255, 255, 0.6), 0 0 20px rgba(0, 100, 255, 0.6)",
//           }}
//         >
//           The Future of DeFi Starts Here
//         </motion.h1>

//         <motion.p
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.7, duration: 0.8 }}
//           className="mt-4 text-base text-gray-300 sm:text-lg md:text-xl"
//         >
//           Join the revolution. Participate in the HPT token presale and be part
//           of the future of decentralized finance.
//         </motion.p>

//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ delay: 1, duration: 0.6 }}
//           className="flex flex-col items-center mt-8"
//         >
//           {loading ? (
//             <div className="flex flex-col items-center space-y-4">
//               <div className="flex items-center justify-center space-x-2">
//                 <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
//                 <div
//                   className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
//                   style={{ animationDelay: "0.2s" }}
//                 ></div>
//                 <div
//                   className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
//                   style={{ animationDelay: "0.4s" }}
//                 ></div>
//               </div>
//               <p className="text-sm text-blue-300">
//                 Checking presale status...
//               </p>
//             </div>
//           ) : (
//             <>
//               <motion.div
//                 className="px-6 py-2 rounded-full bg-gray-800/80 backdrop-blur-md"
//                 style={{
//                   border: `1px solid ${getStageColors(stage).border}`,
//                   boxShadow: getStageColors(stage).boxShadow,
//                 }}
//                 animate={{
//                   boxShadow: getStageColors(stage).animatedShadows,
//                 }}
//                 transition={{ duration: 2, repeat: Infinity }}
//               >
//                 <p className="text-sm font-medium tracking-wide md:text-base">
//                   <span
//                     style={{
//                       display: "inline-block",
//                       backgroundImage: getStageColors(stage).gradient,
//                       WebkitBackgroundClip: "text",
//                       backgroundClip: "text",
//                       WebkitTextFillColor: "transparent",
//                       color: "transparent",
//                       fontWeight: 700,
//                       letterSpacing: "0.025em",
//                       textShadow: `0 0 8px ${getStageColors(stage).glow}`,
//                     }}
//                   >
//                     {presaleStages[stage]}
//                   </span>
//                 </p>
//               </motion.div>

//               <div className="relative w-64 h-2 mt-6 overflow-hidden bg-gray-800 border border-gray-700 rounded-full sm:w-80">
//                 <motion.div
//                   className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
//                   initial={{ width: "0%" }}
//                   animate={{ width: `${(stage / 3) * 100}%` }}
//                   transition={{ duration: 1 }}
//                 />

//                 {[0, 1, 2, 3].map((idx) => (
//                   <motion.div
//                     key={idx}
//                     className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 rounded-full border-2 ${
//                       idx <= stage
//                         ? "bg-cyan-500 border-white"
//                         : "bg-gray-700 border-gray-600"
//                     }`}
//                     style={{
//                       left: `calc(${(idx / 3) * 100}% - ${
//                         idx === 0 ? "2px" : idx === 3 ? "10px" : "6px"
//                       })`,
//                     }}
//                     animate={
//                       idx <= stage
//                         ? {
//                             scale: [1, 1.2, 1],
//                             boxShadow: [
//                               "0 0 0px rgba(0, 255, 255, 0)",
//                               "0 0 10px rgba(0, 255, 255, 0.8)",
//                               "0 0 0px rgba(0, 255, 255, 0)",
//                             ],
//                           }
//                         : {}
//                     }
//                     transition={{
//                       duration: 2,
//                       repeat: idx === stage ? Infinity : 0,
//                       repeatDelay: 1,
//                     }}
//                   />
//                 ))}
//               </div>

//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 1, duration: 0.8 }}
//                 className="max-w-md px-4 py-2 mt-5 border rounded-lg bg-gray-800/50 border-gray-700/50"
//               >
//                 <p className="text-sm text-gray-300 md:text-base">
//                   {stage === 0 &&
//                     !walletConnected &&
//                     "Connect your wallet to prepare for the upcoming presale!"}
//                   {stage === 0 &&
//                     walletConnected &&
//                     "The presale has not started yet. Stay tuned for updates!"}
//                   {stage === 1 &&
//                     !walletConnected &&
//                     "Connect your wallet to participate in the live presale!"}
//                   {stage === 1 &&
//                     walletConnected &&
//                     "The presale is live! Buy HPT tokens now before it’s too late."}
//                   {stage === 2 &&
//                     !walletConnected &&
//                     "Connect your wallet to view your presale participation."}
//                   {stage === 2 &&
//                     walletConnected &&
//                     "The presale has ended. Thank you for your participation!"}
//                   {stage === 3 &&
//                     !walletConnected &&
//                     "Connect your wallet to claim your tokens!"}
//                   {stage === 3 &&
//                     walletConnected &&
//                     "Claim your tokens now! Click the button below to proceed."}
//                 </p>
//               </motion.div>
//             </>
//           )}
//         </motion.div>

//         {error && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="px-4 py-2 mt-4 text-sm text-red-200 border rounded-lg bg-red-500/20 border-red-500/50"
//           >
//             <div className="flex items-center justify-between">
//               <span>{error}</span>
//               <button
//                 onClick={() => setError(null)}
//                 className="p-1 text-red-200 rounded-full hover:text-red-100 hover:bg-red-500/30"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           </motion.div>
//         )}

//         <details className="p-2 mt-4 text-xs text-left text-gray-400 border rounded bg-gray-800/50 border-gray-700/30">
//           <summary className="cursor-pointer">
//             Debug Info (Click to expand)
//           </summary>
//           <div className="pt-2 pl-4">
//             <p>Attempts: {debugInfo.attempts}</p>
//             <p>Last attempt: {debugInfo.lastAttempt || "None"}</p>
//             <p>Current stage: {stage}</p>
//             <p>Loading: {loading ? "Yes" : "No"}</p>
//             <p>Error: {error || "None"}</p>
//             <p>Contract Address: {presaleContractAddress}</p>
//             <p>Wallet Connected: {walletConnected ? "Yes" : "No"}</p>
//             <p>Wallet Address: {walletAddress || "None"}</p>
//             {debugInfo.errors.length > 0 && (
//               <div className="mt-2">
//                 <p>Error log:</p>
//                 <ul className="pl-4 list-disc">
//                   {debugInfo.errors.map((err, i) => (
//                     <li key={i}>
//                       {err.time}: {err.error}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>
//         </details>

//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 1.2, duration: 0.8 }}
//           className="mt-8"
//         >
//           {buttonConfig.to ? (
//             <Link
//               to={buttonConfig.to}
//               className={`inline-flex items-center px-6 py-3 mx-auto text-base font-semibold text-white transition-all shadow-xl sm:px-8 sm:text-lg rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 active:scale-95 hover:shadow-cyan-500/50 focus:ring focus:ring-cyan-400 ${
//                 buttonConfig.disabled ? "opacity-60 cursor-not-allowed" : ""
//               }`}
//             >
//               {buttonConfig.text}
//             </Link>
//           ) : (
//             <button
//               className={`inline-flex items-center px-6 py-3 mx-auto text-base font-semibold text-white transition-all shadow-xl sm:px-8 sm:text-lg rounded-xl bg-gradient-to-r ${
//                 !walletConnected
//                   ? "from-purple-500 to-indigo-600 hover:shadow-purple-500/50"
//                   : "from-cyan-500 to-blue-500 hover:shadow-cyan-500/50"
//               } hover:scale-105 active:scale-95 focus:ring focus:ring-cyan-400 ${
//                 buttonConfig.disabled || connectingWallet
//                   ? "opacity-60 cursor-not-allowed"
//                   : ""
//               }`}
//               onClick={buttonConfig.action}
//               disabled={buttonConfig.disabled || connectingWallet}
//             >
//               {buttonConfig.isLoading ? (
//                 <span className="flex items-center justify-center">
//                   <Loader2 className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" />
//                   {!walletConnected ? "Connecting..." : "Checking..."}
//                 </span>
//               ) : (
//                 <>
//                   {!walletConnected && <Wallet className="w-5 h-5 mr-2" />}
//                   {buttonConfig.text}
//                 </>
//               )}
//             </button>
//           )}
//         </motion.div>
//       </div>
//     </section>
//   );
// }


import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { Wallet, Loader2, X } from "lucide-react";
import { useWallet } from "../context/WalletContext.jsx";
import { Link } from "react-router-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Player } from "@lottiefiles/react-lottie-player";

const presaleABI = [
  "function presaleState() view returns (uint8)",
  "function getCurrentPresaleState() view returns (uint8)",
];
const presaleStages = ["Not Started", "Active", "Ended", "Claim Open"];
const stageDescriptions = [
  "Presale is gearing up! Connect your wallet to prepare.",
  "Presale is live! Secure your HPT tokens now.",
  "Presale has concluded. Check your participation.",
  "Claim your tokens! Don’t miss out.",
];

const getStageColors = (stage) => {
  const colors = {
    0: {
      gradient: "linear-gradient(to right, #a78bfa, #7c3aed)",
      border: "rgba(167, 139, 250, 0.3)",
      glow: "rgba(167, 139, 250, 0.5)",
      boxShadow: "0 0 20px rgba(167, 139, 250, 0.3)",
      animatedShadows: [
        "0 0 10px rgba(167, 139, 250, 0.3)",
        "0 0 25px rgba(167, 139, 250, 0.5)",
        "0 0 10px rgba(167, 139, 250, 0.3)",
      ],
    },
    1: {
      gradient: "linear-gradient(to right, #5eead4, #06b6d4)",
      border: "rgba(6, 182, 212, 0.3)",
      glow: "rgba(6, 182, 212, 0.5)",
      boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
      animatedShadows: [
        "0 0 10px rgba(6, 182, 212, 0.3)",
        "0 0 25px rgba(6, 182, 212, 0.5)",
        "0 0 10px rgba(6, 182, 212, 0.3)",
      ],
    },
    2: {
      gradient: "linear-gradient(to right, #f87171, #dc2626)",
      border: "rgba(248, 113, 113, 0.3)",
      glow: "rgba(248, 113, 113, 0.5)",
      boxShadow: "0 0 20px rgba(248, 113, 113, 0.3)",
      animatedShadows: [
        "0 0 10px rgba(248, 113, 113, 0.3)",
        "0 0 25px rgba(248, 113, 113, 0.5)",
        "0 0 10px rgba(248, 113, 113, 0.3)",
      ],
    },
    3: {
      gradient: "linear-gradient(to right, #34d399, #059669)",
      border: "rgba(52, 211, 153, 0.3)",
      glow: "rgba(52, 211, 153, 0.5)",
      boxShadow: "0 0 20px rgba(52, 211, 153, 0.3)",
      animatedShadows: [
        "0 0 10px rgba(52, 211, 153, 0.3)",
        "0 0 25px rgba(52, 211, 153, 0.5)",
        "0 0 10px rgba(52, 211, 153, 0.3)",
      ],
    },
  };
  return colors[stage] || colors[1];
};

export default function Hero() {
  const [stage, setStage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [init, setInit] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    attempts: 0,
    lastAttempt: null,
    errors: [],
  });

  const {
    walletConnected,
    walletAddress,
    connectingWallet,
    error,
    setError,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const presaleContractAddress = import.meta.env.VITE_PRESALE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_RPC_URL;

  // Initialize tsParticles engine
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    console.log("Particles loaded:", container);
  }, []);

  const particlesOptions = useMemo(
    () => ({
      background: { color: { value: "#0d1a2d" } },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          resize: true,
        },
        modes: {
          repulse: { distance: 100, duration: 0.4 },
        },
      },
      particles: {
        color: { value: ["#5eead4", "#a78bfa", "#f87171"] },
        links: { color: "#ffffff", distance: 150, enable: true, opacity: 0.3 },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "bounce" },
          random: false,
          speed: 1,
          straight: false,
        },
        number: { density: { enable: true, area: 800 }, value: 80 },
        opacity: { value: 0.5 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
      detectRetina: true,
    }),
    []
  );

  const checkPresaleState = async () => {
    console.log("Checking presale state...");
    setLoading(true);

    setDebugInfo((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      lastAttempt: new Date().toISOString(),
    }));

    try {
      const providerInstance = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(
        presaleContractAddress,
        presaleABI,
        providerInstance
      );
      const state = await contract.getCurrentPresaleState();
      setStage(Number(state));
      setLoading(false);
    } catch (err) {
      console.error("Error checking presale state:", err);
      setDebugInfo((prev) => ({
        ...prev,
        errors: [
          ...prev.errors,
          {
            time: new Date().toISOString(),
            error: err.message,
          },
        ],
      }));
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPresaleState();
    const interval = setInterval(checkPresaleState, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const toggleDebug = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setShowDebug((prev) => !prev);
      }
    };
    window.addEventListener("keydown", toggleDebug);
    return () => window.removeEventListener("keydown", toggleDebug);
  }, []);

  const getButtonConfig = () => {
    if (!walletConnected) {
      return {
        text: "Connect Wallet",
        action: connectWallet,
        disabled: connectingWallet,
        isLoading: connectingWallet,
        to: null,
      };
    }

    switch (stage) {
      case 0:
        return {
          text: "Presale Not Started",
          action: null,
          disabled: true,
          isLoading: false,
          to: null,
        };
      case 1:
        return {
          text: "Buy Tokens",
          action: null,
          disabled: false,
          isLoading: false,
          to: "/dashboard",
        };
      case 2:
        return {
          text: "Presale Ended",
          action: null,
          disabled: true,
          isLoading: false,
          to: null,
        };
      case 3:
        return {
          text: "Claim Tokens",
          action: null,
          disabled: false,
          isLoading: false,
          to: "/claim",
        };
      default:
        return {
          text: "Check Presale State",
          action: checkPresaleState,
          disabled: loading,
          isLoading: loading,
          to: null,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <section className="hero-section relative min-h-[calc(100vh-4rem)] md:min-h-screen px-4 pt-20 sm:pt-24 pb-6 sm:pb-8 text-white isolation-isolate bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Particle Background Container */}
      <div
        className="absolute inset-0 overflow-hidden isolate z-[-1]"
        style={{ contain: "paint layout" }}
      >
        {init && (
          <Particles
            id="tsparticles"
            particlesLoaded={particlesLoaded}
            options={particlesOptions}
            className="absolute inset-0 w-full h-full"
          />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 sm:px-4 md:px-6 mx-auto mt-4 sm:mt-6">
        <div className="flex flex-col md:grid md:grid-cols-2 items-center gap-4 md:gap-4">
          {/* Left: Lottie Animation */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="relative w-full max-w-sm sm:max-w-md h-32 sm:h-40 md:h-72 mx-auto md:mx-0 order-first pt-0.5 pb-0.5"
          >
            <motion.div
              className="absolute inset-0 rounded-full z-10"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(236, 72, 153, 0.2)",
                  "0 0 40px rgba(236, 72, 153, 0.4)",
                  "0 0 20px rgba(236, 72, 153, 0.2)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ clipPath: "circle(50%)" }}
            />
            <Player
              autoplay
              loop
              src="https://assets.lottiefiles.com/packages/lf20_kkflmtur.json" // Replace with your Lottie animation
              className="w-full h-full object-contain z-10"
            />
          </motion.div>

          {/* Right: Text and CTA */}
          <div className="relative z-20 flex flex-col items-center md:items-start text-center md:text-left bg-gray-900/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-lg md:rounded-none px-4 md:px-0 py-4 md:py-0">
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 text-3xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow:
                  "0 0 20px rgba(236, 72, 153, 0.8), 0 0 30px rgba(139, 92, 246, 0.8)",
              }}
            >
              Launch Legends: Unleash DeFi’s Next Era
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 max-w-md mx-auto md:mx-0"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                textShadow: "0 0 10px rgba(236, 72, 153, 0.5)",
              }}
            >
              Secure your stake in the ultimate DeFi revolution. Limited presale
              slots—act now!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-col items-center md:items-start mt-6 w-full"
            >
              {loading ? (
                <motion.div
                  className="flex flex-col items-center space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-8 sm:w-10 h-8 sm:h-10 border-4 border-t-transparent border-cyan-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p
                    className="text-xs sm:text-sm text-cyan-300"
                    style={{ fontFamily: "'Exo 2', sans-serif" }}
                  >
                    Scanning blockchain status...
                  </p>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gray-900/80 backdrop-blur-md"
                    style={{
                      border: `1px solid ${getStageColors(stage).border}`,
                      boxShadow: getStageColors(stage).boxShadow,
                    }}
                    animate={{
                      boxShadow: getStageColors(stage).animatedShadows,
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <p className="text-xs sm:text-sm md:text-base font-medium tracking-wide">
                      <span
                        style={{
                          display: "inline-block",
                          backgroundImage: getStageColors(stage).gradient,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          color: "transparent",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textShadow: `0 0 10px ${getStageColors(stage).glow}`,
                        }}
                      >
                        {presaleStages[stage]}
                      </span>
                    </p>
                  </motion.div>

                  <div className="relative w-full max-w-xs sm:max-w-sm h-2.5 sm:h-3 mt-4 overflow-hidden bg-gray-900 border border-gray-700 rounded-full">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-pink-500 to-cyan-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(stage / 3) * 100}%` }}
                      transition={{ duration: 1 }}
                      style={{
                        background:
                          "linear-gradient(90deg, #ec4899, #5eead4, #ec4899)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 3s infinite",
                      }}
                    />
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="relative"
                        onMouseEnter={() => setHoveredStage(idx)}
                        onMouseLeave={() => setHoveredStage(null)}
                      >
                        <motion.div
                          className={`absolute top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 rounded-full border-2 ${
                            idx <= stage
                              ? "bg-cyan-500 border-white"
                              : "bg-gray-700 border-gray-600"
                          }`}
                          style={{
                            left: `calc(${(idx / 3) * 100}% - ${
                              idx === 0 ? "2px" : idx === 3 ? "10px" : "8px"
                            })`,
                          }}
                          animate={
                            idx <= stage
                              ? {
                                  scale: [1, 1.3, 1],
                                  boxShadow: [
                                    "0 0 0px rgba(0, 255, 255, 0)",
                                    "0 0 12px rgba(0, 255, 255, 0.9)",
                                    "0 0 0px rgba(0, 255, 255, 0)",
                                  ],
                                }
                              : {}
                          }
                          transition={{
                            duration: 2,
                            repeat: idx === stage ? Infinity : 0,
                            repeatDelay: 1,
                          }}
                        />
                        {hoveredStage === idx && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: -20 }}
                            className="absolute left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-gray-900/90 border border-gray-700 rounded shadow-lg whitespace-nowrap"
                            style={{ fontFamily: "'Exo 2', sans-serif" }}
                          >
                            {stageDescriptions[idx]}
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="max-w-md px-4 py-3 mt-3 border rounded-lg bg-gray-900/50 border-gray-700/50"
                  >
                    <p
                      className="text-xs sm:text-sm md:text-base text-gray-200"
                      style={{ fontFamily: "'Exo 2', sans-serif" }}
                    >
                      {stage === 0 &&
                        !walletConnected &&
                        "Connect your wallet to join the DeFi revolution!"}
                      {stage === 0 &&
                        walletConnected &&
                        "Presale launches soon! Prepare for liftoff."}
                      {stage === 1 &&
                        !walletConnected &&
                        "Presale is live! Connect to secure your HPT tokens."}
                      {stage === 1 &&
                        walletConnected &&
                        "HPT presale is live! Grab your tokens before they’re gone."}
                      {stage === 2 &&
                        !walletConnected &&
                        "Presale ended. Connect to view your stake."}
                      {stage === 2 &&
                        walletConnected &&
                        "Presale complete! Your journey with HPT begins."}
                      {stage === 3 &&
                        !walletConnected &&
                        "Claim phase open! Connect to retrieve your tokens."}
                      {stage === 3 &&
                        walletConnected &&
                        "Claim your HPT tokens now and join the future!"}
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="fixed bottom-4 right-4 px-4 py-2 text-xs sm:text-sm text-red-100 border rounded-lg bg-red-500 border-red-500/50 shadow-lg z-30"
              >
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="p-1 text-red-100 rounded-full hover:text-white hover:bg-red-500/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {showDebug && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 mt-3 text-xs text-left text-gray-400 border rounded bg-gray-900/80 border-gray-700/50 max-w-md mx-auto md:mx-0"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                <p>Attempts: {debugInfo.attempts}</p>
                <p>Last attempt: {debugInfo.lastAttempt || "None"}</p>
                <p>Current stage: {stage}</p>
                <p>Loading: {loading ? "Yes" : "No"}</p>
                <p>Error: {error || "None"}</p>
                <p>Contract Address: {presaleContractAddress}</p>
                <p>Wallet Connected: {walletConnected ? "Yes" : "No"}</p>
                <p>Wallet Address: {walletAddress || "None"}</p>
                {debugInfo.errors.length > 0 && (
                  <div className="mt-2">
                    <p>Error log:</p>
                    <ul className="pl-4 list-disc">
                      {debugInfo.errors.map((err, i) => (
                        <li key={i}>
                          {err.time}: {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-3 sm:mt-4 w-full flex justify-center md:justify-start"
            >
              {buttonConfig.to ? (
                <Link
                  to={buttonConfig.to}
                  className={`inline-flex items-center px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white transition-all shadow-xl rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(236,72,153,0.7)] focus:ring focus:ring-cyan-400 ${
                    buttonConfig.disabled ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {buttonConfig.text}
                </Link>
              ) : (
                <button
                  className={`inline-flex items-center px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white transition-all shadow-xl rounded-xl bg-gradient-to-r ${
                    !walletConnected
                      ? "from-purple-500 to-indigo-600 hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]"
                      : "from-pink-500 to-cyan-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.7)]"
                  } hover:scale-105 active:scale-95 focus:ring focus:ring-cyan-400 ${
                    buttonConfig.disabled || connectingWallet
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={buttonConfig.action}
                  disabled={buttonConfig.disabled || connectingWallet}
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {buttonConfig.isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2 -ml-1 text-white animate-spin" />
                      {!walletConnected ? "Connecting..." : "Checking..."}
                    </span>
                  ) : (
                    <>
                      {!walletConnected && (
                        <Wallet className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      )}
                      {buttonConfig.text}
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200%;
          }
          100% {
            background-position: 200%;
          }
        }
        .hero-section {
          isolation: isolate;
          contain: layout;
          z-index: 10;
        }
        #tsparticles,
        #tsparticles canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          contain: paint !important;
          z-index: -1 !important;
        }
        @media (max-width: 767px) {
          .hero-section {
            min-height: auto;
            padding-top: 5rem;
            padding-bottom: 1.5rem;
          }
          .hero-section > .relative > .flex {
            flex-direction: column;
            gap: 2rem;
          }
          .hero-section > .relative > .flex > div:first-child {
            order: -1;
            margin-bottom: 0;
          }
          .hero-section > .relative > .flex > div:last-child {
            order: 0;
          }
        }
      `}</style>
    </section>
  );
}

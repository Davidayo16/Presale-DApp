import React from "react";
import {
  FaTwitter,
  FaDiscord,
  FaTelegram,
  FaEnvelope,
  FaGithub,
  FaMedium,
  FaReddit,
  FaFileAlt,
  FaShieldAlt,
  FaBook,
  FaHandshake,
  FaQuestionCircle,
} from "react-icons/fa";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="relative px-6 py-16 overflow-hidden text-white bg-gradient-to-b from-gray-900 to-gray-900 lg:px-24">
      {/* Logo & Brand */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center w-16 h-16 mb-4 shadow-lg bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl"
        >
          {/* Replace with your actual logo */}
          <span className="text-3xl font-bold text-white">HP</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text"
          style={{
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          HPT Token
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-sm mt-1 text-sm text-center text-gray-400"
        >
          Building the future of decentralized finance
        </motion.p>
      </div>

      <motion.div
        className="relative z-10 grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2 lg:grid-cols-4 lg:gap-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Social Media Links */}
        <motion.div variants={itemVariants}>
          <h3 className="flex items-center gap-2 mb-4 text-xl font-semibold">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50">
              <FaHandshake className="text-cyan-400" size={16} />
            </span>
            Connect with Us
          </h3>
          <div className="grid grid-cols-4 gap-3 mt-5">
            <a
              href="#"
              aria-label="Twitter"
              className="flex items-center justify-center w-10 h-10 transition-all border border-gray-700 rounded-lg bg-gray-700/50 hover:bg-blue-500/20 hover:border-blue-400 group"
            >
              <FaTwitter
                size={18}
                className="text-gray-400 group-hover:text-blue-400"
              />
            </a>
            <a
              href="#"
              aria-label="Discord"
              className="flex items-center justify-center w-10 h-10 transition-all border border-gray-700 rounded-lg bg-gray-700/50 hover:bg-indigo-500/20 hover:border-indigo-400 group"
            >
              <FaDiscord
                size={18}
                className="text-gray-400 group-hover:text-indigo-400"
              />
            </a>
            <a
              href="#"
              aria-label="Telegram"
              className="flex items-center justify-center w-10 h-10 transition-all border border-gray-700 rounded-lg bg-gray-700/50 hover:bg-blue-500/20 hover:border-blue-400 group"
            >
              <FaTelegram
                size={18}
                className="text-gray-400 group-hover:text-blue-500"
              />
            </a>
            <a
              href="#"
              aria-label="Medium"
              className="flex items-center justify-center w-10 h-10 transition-all border border-gray-700 rounded-lg bg-gray-700/50 hover:bg-green-500/20 hover:border-green-400 group"
            >
              <FaMedium
                size={18}
                className="text-gray-400 group-hover:text-green-400"
              />
            </a>
            <a
              href="#"
              aria-label="GitHub"
              className="flex items-center justify-center w-10 h-10 transition-all border border-gray-700 rounded-lg bg-gray-700/50 hover:bg-gray-500/20 hover:border-gray-400 group"
            >
              <FaGithub
                size={18}
                className="text-gray-400 group-hover:text-white"
              />
            </a>
            <a
              href="#"
              aria-label="Reddit"
              className="flex items-center justify-center w-10 h-10 transition-all border border-gray-700 rounded-lg bg-gray-700/50 hover:bg-orange-500/20 hover:border-orange-400 group"
            >
              <FaReddit
                size={18}
                className="text-gray-400 group-hover:text-orange-400"
              />
            </a>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={itemVariants}>
          <h3 className="flex items-center gap-2 mb-4 text-xl font-semibold">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50">
              <FaBook className="text-cyan-400" size={16} />
            </span>
            Quick Links
          </h3>
          <ul className="mt-5 space-y-3">
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Staking Platform
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Token Dashboard
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Whitepaper
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Roadmap
              </a>
            </li>
          </ul>
        </motion.div>

        {/* Legal */}
        <motion.div variants={itemVariants}>
          <h3 className="flex items-center gap-2 mb-4 text-xl font-semibold">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50">
              <FaShieldAlt className="text-cyan-400" size={16} />
            </span>
            Legal
          </h3>
          <ul className="mt-5 space-y-3">
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Terms of Service
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Risk Disclosure
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors"></span>
                Cookie Policy
              </a>
            </li>
          </ul>
        </motion.div>

        {/* Support */}
        <motion.div variants={itemVariants}>
          <h3 className="flex items-center gap-2 mb-4 text-xl font-semibold">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-700/50">
              <FaQuestionCircle className="text-cyan-400" size={16} />
            </span>
            Support
          </h3>
          <div className="mt-5 space-y-4">
            <p className="text-gray-400">
              Need help? Our support team is available 24/7.
            </p>

            <a
              href="mailto:support@hpttoken.com"
              className="flex items-center gap-3 px-4 py-3 transition-all border group rounded-xl bg-gray-800/60 border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-700/30"
            >
              <span className="flex items-center justify-center w-8 h-8 border rounded-lg bg-cyan-500/20 border-cyan-500/30">
                <FaEnvelope size={16} className="text-cyan-400" />
              </span>
              <span className="text-gray-300 transition-colors group-hover:text-white">
                support@hpttoken.com
              </span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 transition-all border group rounded-xl bg-gray-800/60 border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-700/30"
            >
              <span className="flex items-center justify-center w-8 h-8 border rounded-lg bg-cyan-500/20 border-cyan-500/30">
                <FaFileAlt size={16} className="text-cyan-400" />
              </span>
              <span className="text-gray-300 transition-colors group-hover:text-white">
                Help Documentation
              </span>
            </a>
          </div>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <div className="h-px max-w-6xl mx-auto my-10 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

      {/* Copyright & Final Links */}
      <div className="relative z-10 flex flex-col items-center justify-between max-w-6xl gap-4 mx-auto text-sm md:flex-row">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-gray-500 md:text-left"
        >
          &copy; {currentYear} HPT Token. All rights reserved.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center gap-6"
        >
          <a
            href="#"
            className="text-gray-500 transition-colors hover:text-gray-300"
          >
            Audited by CertiK
          </a>
          <a
            href="#"
            className="text-gray-500 transition-colors hover:text-gray-300"
          >
            Bug Bounty
          </a>
          <a
            href="#"
            className="text-gray-500 transition-colors hover:text-gray-300"
          >
            Sitemap
          </a>
        </motion.div>
      </div>

      {/* Crypto Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="relative z-10 flex flex-wrap items-center justify-center max-w-6xl gap-4 px-4 py-3 mx-auto mt-8 text-xs text-gray-500 border rounded-xl bg-gray-800/30 border-gray-700/30"
      >
        <span>Trading cryptocurrencies involves risk.</span>
        <span>
          HPT is not available to residents of restricted territories.
        </span>
        <span>Always DYOR and consider your financial situation.</span>
      </motion.div>
    </footer>
  );
};

export default Footer;

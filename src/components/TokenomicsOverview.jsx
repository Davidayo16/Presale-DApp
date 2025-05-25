import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FaChartPie, FaCheckCircle } from "react-icons/fa";
import {
  FaLightbulb,
  FaPeopleGroup,
  FaChartLine,
  FaCoins,
  FaFlask,
  FaServer,
  FaGlobe,
} from "react-icons/fa6";

const tokenDistribution = [
  { name: "Community Rewards", value: 30, color: "#06b6d4" },
  { name: "Marketing Allocation", value: 25, color: "#3b82f6" },
  { name: "Market Making & Liquidity", value: 10, color: "#9333ea" },
  { name: "Ecosystem Development", value: 15, color: "#f59e0b" },
  { name: "Presale Allocation", value: 5, color: "#ef4444" },
  { name: "Team Allocation", value: 15, color: "#22c55e" },
];

const roadmapItems = [
  {
    year: "2022",
    milestone: "Concept Testing",
    icon: FaLightbulb,
    color: "#f59e0b",
  },
  {
    year: "2023",
    milestone: "Lean Team & Agency Launch",
    icon: FaPeopleGroup,
    color: "#22c55e",
  },
  {
    year: "2024",
    milestone: "Scaling & Growth",
    icon: FaChartLine,
    color: "#3b82f6",
  },
  {
    year: "2025 Q1-Q2",
    milestone: "Token Launch & Crowdfunding",
    icon: FaCoins,
    color: "#06b6d4",
  },
  {
    year: "2025 Q3-Q4",
    milestone: "Testnet Launch",
    icon: FaFlask,
    color: "#9333ea",
  },
  {
    year: "2026",
    milestone: "Mainnet Deployment",
    icon: FaServer,
    color: "#ef4444",
  },
  {
    year: "Beyond",
    milestone: "Feature Expansion & Scaling",
    icon: FaGlobe,
    color: "#8b5cf6",
  },
];

const TokenomicsOverview = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isChartVisible, setIsChartVisible] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsChartVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Dynamic font sizes based on screen width
  const getFontSize = () => {
    if (window.innerWidth < 640) return "text-xs";
    if (window.innerWidth < 768) return "text-sm";
    return "text-base";
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 sm:p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm"
        >
          <p className={`text-base sm:text-lg font-bold`}>{payload[0].name}</p>
          <p
            className={`text-lg sm:text-xl text-blue-400`}
          >{`${payload[0].value}%`}</p>
        </motion.div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className={window.innerWidth < 640 ? "text-[10px]" : "text-sm"}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const chartVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 12,
        duration: 0.8,
      },
    },
  };

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8 text-white bg-gray-900">
      <motion.div
        className="max-w-7xl mx-auto text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="inline-flex items-center justify-center gap-2 sm:gap-3"
        >
          <FaChartPie
            size={window.innerWidth < 640 ? 20 : 25}
            className="text-blue-400"
          />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Tokenomics Overview
          </h2>
        </motion.div>

        <motion.p
          className={`mt-4 text-sm sm:text-base lg:text-lg text-gray-300`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          A detailed breakdown of $HPT token distribution and its strategic
          allocation.
        </motion.p>
      </motion.div>

      {/* Token Distribution Chart */}
      <motion.div
        className="mt-12"
        variants={chartVariants}
        initial="hidden"
        animate={isChartVisible ? "visible" : "hidden"}
      >
        <div className="w-full h-64 sm:h-80 lg:h-96 -mx-4 sm:-mx-6 lg:-mx-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={tokenDistribution}
                cx="50%"
                cy="50%"
                innerRadius={window.innerWidth < 640 ? 50 : 80}
                outerRadius={window.innerWidth < 640 ? 90 : 140}
                dataKey="value"
                animationDuration={1200}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                labelLine={false}
                label={renderCustomizedLabel}
                paddingAngle={4}
              >
                {tokenDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    strokeWidth={activeIndex === index ? 3 : 0}
                    stroke={activeIndex === index ? "#fff" : "transparent"}
                    opacity={activeIndex === index ? 1 : 0.9}
                    className="transition-all duration-300"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Token Utility Section */}
      <motion.div
        className="max-w-5xl p-4 sm:p-6 lg:p-8 mx-auto mt-12 sm:mt-16 lg:mt-20 bg-gray-800 shadow-2xl rounded-xl"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.h3
          className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
        >
          Token Utility
        </motion.h3>

        <motion.p
          className={`mt-4 text-sm sm:text-base lg:text-lg text-center text-gray-300`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
        >
          The $HPT token serves multiple purposes within the ecosystem, ensuring
          value and sustainability.
        </motion.p>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {[
            {
              text: "Community Rewards & Staking Incentives",
              color: "text-green-400",
            },
            { text: "Marketing & Growth Initiatives", color: "text-blue-400" },
            { text: "Liquidity & Price Stability", color: "text-purple-400" },
            {
              text: "Ecosystem Development & Expansion",
              color: "text-yellow-400",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center gap-3 p-4 transition-colors duration-300 rounded-lg bg-gray-700/40 hover:bg-gray-700/70"
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
              >
                <FaCheckCircle
                  className={`${item.color} flex-shrink-0`}
                  size={window.innerWidth < 640 ? 16 : 20}
                />
              </motion.div>
              <span className={getFontSize()}>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Project Milestones & Roadmap */}
      <motion.div
        className="max-w-6xl mx-auto mt-12 sm:mt-16 lg:mt-24 overflow-x-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.h3
          className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center text-white"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            Project Milestones & Roadmap
          </motion.span>
        </motion.h3>

        <motion.div
          className="grid gap-4 sm:gap-6 mt-8 sm:mt-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-w-[300px]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {roadmapItems.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center p-4 sm:p-6 text-center transition-colors duration-300 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700"
              whileHover={{
                scale: 1.05,
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  delay: index * 0.1,
                }}
                whileHover={{
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.5 },
                }}
                className="p-3 sm:p-4 mb-4 rounded-full bg-gray-700/50"
              >
                <item.icon
                  size={window.innerWidth < 640 ? 24 : 32}
                  style={{ color: item.color }}
                />
              </motion.div>
              <motion.h4
                className="text-lg sm:text-xl font-bold text-white"
                whileHover={{ scale: 1.1, color: item.color }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item.year}
              </motion.h4>
              <p className={`mt-2 text-gray-300 ${getFontSize()}`}>
                {item.milestone}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default TokenomicsOverview;

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
} from "recharts";

// Constants matching contract parameters
const STAKING_OPTIONS = [
  {
    duration: "6 Months",
    durationDays: 6 * 30,
    apr: 70,
    initialStake: 1000,
    durationSeconds: 6 * 30 * 24 * 60 * 60,
  },
  {
    duration: "12 Months",
    durationDays: 12 * 30,
    apr: 150,
    initialStake: 1000,
    durationSeconds: 12 * 30 * 24 * 60 * 60,
  },
];

const StakingBenefits = () => {
  const [selectedOption, setSelectedOption] = useState("6 Months");
  const [stakeAmount, setStakeAmount] = useState(1000);
  const [sliderValue, setSliderValue] = useState(1000);
  const [chartData, setChartData] = useState([]);

  const selectedOptionData = STAKING_OPTIONS.find(
    (opt) => opt.duration === selectedOption
  );

  const calculateRewards = (stake, apr, timeInSeconds) => {
    const aprPerSecond = (apr * 10 ** 18) / (100 * 365 * 24 * 60 * 60);
    const rewards = (stake * aprPerSecond * timeInSeconds) / 10 ** 18;
    return rewards;
  };

  useEffect(() => {
    const newChartData = [];
    const maxMonths = selectedOption === "6 Months" ? 6 : 12;
    const secondsPerMonth = 30 * 24 * 60 * 60;

    newChartData.push({
      month: 0,
      value: stakeAmount,
      stakingOnly: stakeAmount,
    });

    let accumulatedRewards = 0;

    for (let i = 1; i <= maxMonths; i++) {
      const timeElapsed = i * secondsPerMonth;
      const monthlyRewards = calculateRewards(
        stakeAmount,
        selectedOptionData.apr,
        secondsPerMonth
      );

      accumulatedRewards += monthlyRewards;

      newChartData.push({
        month: i,
        value: stakeAmount + accumulatedRewards,
        stakingOnly: stakeAmount,
        rewards: accumulatedRewards,
      });
    }

    setChartData(newChartData);
  }, [stakeAmount, selectedOption, selectedOptionData]);

  const handleSliderChange = (e) => {
    setSliderValue(parseInt(e.target.value));
  };

  const handleSliderRelease = () => {
    setStakeAmount(sliderValue);
  };

  const handleInputChange = (e) => {
    const value = e.target.value === "" ? 0 : parseInt(e.target.value);
    setStakeAmount(value);
    setSliderValue(value);
  };

  const totalRewards =
    chartData.length > 0
      ? chartData[chartData.length - 1].value - stakeAmount
      : 0;
  const totalReturn = stakeAmount + totalRewards;

  // Dynamic font sizes based on screen width
  const getFontSize = () => {
    if (window.innerWidth < 640) return "text-sm";
    if (window.innerWidth < 768) return "text-base";
    return "text-lg";
  };

  return (
    <section className="position-relative px-4 py-8 sm:px-6 lg:px-8 text-white bg-gray-900">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="inline-block mb-2 text-2xl sm:text-3xl lg:text-4xl font-bold">
          Staking Benefits
        </h2>
        <p className={`mt-4 mb-6 ${getFontSize()} text-gray-300`}>
          Choose between 6-month and 12-month staking options to maximize your
          rewards.
        </p>
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
        {STAKING_OPTIONS.map((option) => (
          <button
            key={option.duration}
            onClick={() => setSelectedOption(option.duration)}
            className={`px-4 sm:px-8 py-2 sm:py-3 text elastomer-sm sm:text-base font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
              selectedOption === option.duration
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {option.duration}
          </button>
        ))}
      </div>

      {/* Rewards Calculator */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="p-4 sm:p-6 lg:p-8 border border-gray-700 shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <h3 className="flex items-center text-xl sm:text-2xl font-bold mb-4 sm:mb-0">
              <span className="mr-2 text-blue-400">✨</span>
              Rewards Calculator
            </h3>
            <div className="px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base font-semibold text-blue-300 bg-blue-500 rounded-lg bg-opacity-20">
              {selectedOption} • {selectedOptionData.apr}% APR
            </div>
          </div>

          <div className="space-y-8">
            {/* Stake Amount Input */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between mb-2">
                <label className={`font-medium text-gray-300 ${getFontSize()}`}>
                  Stake Amount (HPT)
                </label>
                <div className="flex items-center mt-2 sm:mt-0">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={handleInputChange}
                    className="w-24 sm:w-32 px-3 py-1 text-right text-white bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  onMouseUp={handleSliderRelease}
                  onTouchEnd={handleSliderRelease}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div
                  className={`flex justify-between mt-2 text-xs sm:text-sm text-gray-400`}
                >
                  <span>100 HPT</span>
                  <span>5,000 HPT</span>
                  <span>10,000 HPT</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 transition-transform duration-300 bg-gray-800 border border-gray-700 rounded-xl hover:scale-103">
                <p className={`mb-1 text-gray-400 ${getFontSize()}`}>
                  Initial Stake
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {stakeAmount.toLocaleString()} HPT
                </p>
              </div>

              <div className="p-4 transition-transform duration-300 bg-gray-800 border border-gray-700 rounded-xl hover:scale-103">
                <p className={`mb-1 text-gray-400 ${getFontSize()}`}>
                  Potential Rewards
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
                  +
                  {totalRewards.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  HPT
                </p>
              </div>

              <div className="p-4 transition-transform duration-300 bg-gray-800 border border-blue-500 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:scale-103">
                <p className={`mb-1 text-gray-400 ${getFontSize()}`}>
                  Total Return
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">
                  {totalReturn.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  HPT
                </p>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="mt-8">
              <h4
                className={`mb-4 text-base sm:text-lg font-medium text-gray-300`}
              >
                Projected Growth
              </h4>
              <div className="w-full h-48 sm:h-64 lg:h-80 -mx-4 sm:-mx-6 lg:-mx-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis
                      dataKey="month"
                      stroke="#aaa"
                      tickFormatter={(tick) => `${tick}M`}
                      tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                    />
                    <YAxis
                      stroke="#aaa"
                      tickFormatter={(tick) => `${(tick / 1000).toFixed(1)}K`}
                      tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${parseFloat(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })} HPT`,
                        "Value",
                      ]}
                      labelFormatter={(label) => `Month ${label}`}
                      contentStyle={{
                        backgroundColor: "#222",
                        borderRadius: "10px",
                        border: "1px solid #444",
                        fontSize:
                          window.innerWidth < 640 ? "0.75rem" : "0.875rem",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-6xl mx-auto mb-12 overflow-x-auto">
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-800 border border-gray-700 shadow-2xl rounded-xl min-w-[300px]">
          <h3 className={`mb-4 text-lg sm:text-xl font-bold text-center`}>
            APR Comparison
          </h3>
          <table className="w-full text-left text-white">
            <thead>
              <tr className="bg-gray-700 rounded-lg">
                <th className="p-3 sm:p-5 rounded-l-lg text-xs sm:text-sm">
                  Duration
                </th>
                <th className="p-3 sm:p-5 text-xs sm:text-sm">APR</th>
                <th className="p-3 sm:p-5 rounded-r-lg text-xs sm:text-sm">
                  Rewards (HPT 1000)
                </th>
              </tr>
            </thead>
            <tbody>
              {STAKING_OPTIONS.map((option) => {
                const optionRewards = calculateRewards(
                  option.initialStake,
                  option.apr,
                  option.durationSeconds
                );

                return (
                  <tr
                    key={option.duration}
                    className={`border-t border-gray-600 ${
                      selectedOption === option.duration
                        ? "bg-gray-700 bg-opacity-40"
                        : ""
                    }`}
                  >
                    <td className="p-3 sm:p-5 text-xs sm:text-sm">
                      {option.duration}
                    </td>
                    <td className="p-3 sm:p-5 font-semibold text-blue-300 text-xs sm:text-sm">
                      {option.apr}%
                    </td>
                    <td className="p-3 sm:p-5 text-xs sm:text-sm">
                      <span className="font-semibold">
                        HPT{" "}
                        {(option.initialStake + optionRewards).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 2 }
                        )}
                      </span>
                      <span className="ml-2 text-green-400">
                        (+
                        {optionRewards.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                        )
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* APR Visualization */}
      <div className="max-w-6xl mx-auto">
        <h3 className={`mb-4 text-lg sm:text-xl font-bold text-center`}>
          APR Growth Over Time
        </h3>
        <div className="w-full h-48 sm:h-64 lg:h-80 -mx-4 sm:-mx-6 lg:-mx-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis
                dataKey="month"
                stroke="#ddd"
                tickFormatter={(tick) => `${tick}M`}
                tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
              />
              <YAxis
                stroke="#ddd"
                tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  borderRadius: "10px",
                  border: "1px solid #444",
                  fontSize: window.innerWidth < 640 ? "0.75rem" : "0.875rem",
                }}
                formatter={(value) => [
                  `${parseInt(value).toLocaleString()} HPT`,
                  "Value",
                ]}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={selectedOption === "6 Months" ? "#06b6d4" : "#3b82f6"}
                strokeWidth={window.innerWidth < 640 ? 2 : 4}
                dot={{
                  fill: selectedOption === "6 Months" ? "#06b6d4" : "#3b82f6",
                  r: window.innerWidth < 640 ? 4 : 6,
                }}
                activeDot={{ r: window.innerWidth < 640 ? 6 : 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default StakingBenefits;

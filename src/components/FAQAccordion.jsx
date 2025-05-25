import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaQuestionCircle } from "react-icons/fa";

const faqs = [
  {
    question: "How do I participate in staking?",
    answer:
      "You can participate by locking your tokens in our staking pool through the official dashboard.",
  },
  {
    question: "What is the vesting period?",
    answer:
      "The vesting period varies depending on the staking plan chosen. Some plans have shorter durations with higher rewards, while others have longer lock-in periods.",
  },
  {
    question: "How are rewards calculated?",
    answer:
      "Rewards are calculated based on the amount of tokens staked and the duration of the staking period.",
  },
  {
    question: "Can I withdraw my tokens early?",
    answer:
      "Some staking plans allow early withdrawal with a penalty, while others require full completion of the staking term.",
  },
];

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-20 px-6 lg:px-24 bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 z-0">
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-blue-500 blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-cyan-500 blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block p-4 rounded-full bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 mb-6">
            <FaQuestionCircle size={40} className="text-cyan-400" />
          </div>

          <h2 className="text-4xl font-bold">
            <span
              className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
              style={{
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Frequently Asked Questions
            </span>
          </h2>

          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Answers to common questions about participation, vesting, and
            rewards.
          </p>
        </motion.div>
      </div>

      <motion.div
        className="mt-12 max-w-3xl mx-auto space-y-4 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            transition={{ duration: 0.4 }}
            className={`bg-gray-800/60 backdrop-blur-md p-5 rounded-xl border ${
              openIndex === index ? "border-cyan-500/50" : "border-gray-700/50"
            } shadow-lg hover:shadow-cyan-500/10 cursor-pointer transition-all duration-300`}
            onClick={() => toggleAccordion(index)}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 30px -10px rgba(6, 182, 212, 0.2)",
            }}
            role="button"
            aria-expanded={openIndex === index}
            aria-controls={`faq-answer-${index}`}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">{faq.question}</h3>
              <motion.div
                animate={{
                  rotate: openIndex === index ? 180 : 0,
                  backgroundColor:
                    openIndex === index
                      ? "rgba(6, 182, 212, 0.2)"
                      : "rgba(55, 65, 81, 0.5)",
                }}
                transition={{ duration: 0.3 }}
                className="p-2 rounded-full bg-gray-700/50 flex items-center justify-center"
              >
                <FaChevronDown
                  size={16}
                  className={`${
                    openIndex === index ? "text-cyan-400" : "text-gray-400"
                  }`}
                />
              </motion.div>
            </div>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  id={`faq-answer-${index}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-3"></div>
                    <p className="py-3 text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default FAQAccordion;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email || !password) {
      setLocalError("Email and password are required");
      return;
    }

    try {
      await login(email, password);
      setSuccessAnimation(true);

      // Wait for animation to complete
      setTimeout(() => {
        navigate("/levels");
      }, 1500);
    } catch (err) {
      setLocalError(error || "Login failed");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const errorVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 },
    },
  };

  const pulseVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0.3, 1, 0.3],
      transition: { duration: 2, repeat: Infinity },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-neon-cyan rounded-full opacity-50"
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Success animation overlay */}
      {successAnimation && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 bg-neon-cyan"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{ originY: 0.5 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="text-4xl font-bold text-gray-900 neon-glow-cyan"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              ACCESS GRANTED
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        className="relative h-full min-h-screen flex items-center justify-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="w-full max-w-md glass-card p-8 md:p-10"
          variants={itemVariants}
        >
          {/* Title */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-center mb-2 neon-glow-cyan"
            variants={itemVariants}
          >
            JAILBREAKING
          </motion.h1>

          <motion.p
            className="text-center text-neon-cyan/70 mb-8 text-sm uppercase tracking-wider"
            variants={itemVariants}
          >
            AI Prompt Engineering Challenge
          </motion.p>

          {/* Terminal-style separator */}
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent mb-8"
            variants={itemVariants}
          />

          {/* Error message */}
          {(localError || error) && (
            <motion.div
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex items-start gap-3">
                <span className="text-red-400 font-bold text-xl">⚠</span>
                <p className="text-red-300 text-sm">{localError || error}</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
            <motion.div variants={itemVariants}>
              <label className="block text-neon-cyan/80 text-sm font-mono mb-2">
                $ EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 bg-gray-900/50 border border-neon-cyan/30 rounded-lg text-neon-cyan placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all font-mono text-sm"
                disabled={isLoading}
              />
            </motion.div>

            {/* Password input */}
            <motion.div variants={itemVariants}>
              <label className="block text-neon-cyan/80 text-sm font-mono mb-2">
                $ PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-900/50 border border-neon-cyan/30 rounded-lg text-neon-cyan placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all font-mono text-sm"
                disabled={isLoading}
              />
            </motion.div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 py-3 px-6 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-bold uppercase tracking-wider rounded-lg hover:bg-neon-cyan/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm relative overflow-hidden group"
              variants={itemVariants}
              whileHover={{ boxShadow: "0 0 20px #00f0ff" }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span
                className="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/10"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <span className="relative">
                {isLoading ? "AUTHENTICATING..." : "ENTER SYSTEM"}
              </span>
            </motion.button>
          </form>

          {/* Status indicator */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-2"
            variants={itemVariants}
          >
            <motion.div
              className="w-2 h-2 bg-neon-cyan rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-neon-cyan/60 text-xs font-mono">
              {isLoading ? "CONNECTING..." : "READY"}
            </span>
          </motion.div>
        </motion.div>

        {/* Decorative corner elements */}
        <motion.div
          className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-neon-cyan/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-neon-magenta/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>
    </div>
  );
}

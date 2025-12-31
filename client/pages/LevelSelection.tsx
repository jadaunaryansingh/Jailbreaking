import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useGame, type Level } from "@/context/GameContext";
import { motion } from "framer-motion";

const LEVELS = [
  {
    id: "easy",
    title: "EASY",
    difficulty: 1,
    description: "5 simple objects to identify",
    color: "neon-green",
    accentColor: "rgb(0, 255, 65)",
    icon: "⚡",
  },
  {
    id: "medium",
    title: "MEDIUM",
    difficulty: 2,
    description: "5 intermediate concepts",
    color: "neon-cyan",
    accentColor: "rgb(0, 240, 255)",
    icon: "⚙",
  },
  {
    id: "hard",
    title: "HARD",
    difficulty: 3,
    description: "5 advanced abstractions",
    color: "neon-magenta",
    accentColor: "rgb(255, 0, 255)",
    icon: "💎",
  },
];

export default function LevelSelection() {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const { startLevel } = useGame();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLevelSelect = async (level: Level) => {
    setSelectedLevel(level);
    setLoading(true);

    // Start the game session
    if (userProfile?.id) {
      startLevel(userProfile.id, level);
      
      // Simulate loading animation
      setTimeout(() => {
        navigate("/gameplay", { state: { level } });
      }, 800);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-neon-cyan rounded-full opacity-30"
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 10 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Main content */}
      <motion.div
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <h1 className="text-4xl md:text-5xl font-bold neon-glow-cyan mb-2">
            SELECT YOUR CHALLENGE
          </h1>
          <p className="text-neon-cyan/70 text-sm uppercase tracking-wider">
            Choose a difficulty level to begin
          </p>
        </motion.div>

        {/* User welcome */}
        {userProfile && (
          <motion.div
            className="absolute top-8 right-8 flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass-card px-6 py-3 text-neon-cyan/80 text-sm font-mono">
              Welcome, {userProfile.name}
            </div>
            <motion.button
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="px-4 py-2 bg-neon-magenta/10 border border-neon-magenta text-neon-magenta text-xs font-mono rounded-lg hover:bg-neon-magenta/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LOGOUT
            </motion.button>
          </motion.div>
        )}

        {/* Level cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-8">
          {LEVELS.map((level, index) => (
            <motion.button
              key={level.id}
              onClick={() => handleLevelSelect(level.id as Level)}
              disabled={loading && selectedLevel !== level.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={!loading ? "hover" : "visible"}
              transition={{ delay: index * 0.1 }}
              className="relative group text-left focus:outline-none disabled:opacity-50"
            >
              {/* Card background with glow */}
              <motion.div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 blur-xl transition-opacity"
                style={{
                  background: `radial-gradient(circle, ${level.accentColor}40 0%, transparent 70%)`,
                }}
              />

              {/* Card content */}
              <div
                className="relative glass-card p-8 h-64 flex flex-col justify-between overflow-hidden"
                style={{
                  borderColor: level.accentColor,
                }}
              >
                {/* Unlock effect background */}
                {selectedLevel === level.id && loading && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 1 }}
                    style={{ backgroundColor: level.accentColor }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  className="text-5xl mb-4"
                  animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                >
                  {level.icon}
                </motion.div>

                {/* Title and description */}
                <div className="flex-1">
                  <h3
                    className="text-2xl font-bold mb-2 uppercase tracking-wider"
                    style={{ color: level.accentColor }}
                  >
                    {level.title}
                  </h3>
                  <p className="text-neon-cyan/60 text-sm">{level.description}</p>
                </div>

                {/* Progress indicator */}
                <motion.div
                  className="flex items-center justify-between pt-4 border-t"
                  style={{ borderColor: `${level.accentColor}40` }}
                >
                  <span
                    className="text-xs font-mono"
                    style={{ color: level.accentColor }}
                  >
                    5 QUESTIONS
                  </span>

                  {/* Loading indicator */}
                  {selectedLevel === level.id && loading && (
                    <motion.div
                      className="w-4 h-4 border-2 border-transparent rounded-full"
                      style={{
                        borderTopColor: level.accentColor,
                        borderRightColor: level.accentColor,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}

                  {/* Arrow indicator */}
                  {selectedLevel !== level.id && !loading && (
                    <motion.span
                      className="text-lg"
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      →
                    </motion.span>
                  )}
                </motion.div>

                {/* Pulse border on hover */}
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    border: `2px solid ${level.accentColor}`,
                    boxShadow: `0 0 20px ${level.accentColor}80`,
                  }}
                />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Footer info */}
        <motion.div
          className="mt-12 text-center"
          variants={itemVariants}
        >
          <p className="text-neon-cyan/50 text-xs font-mono uppercase tracking-wider">
            ⚡ Each level has 5 questions with a max of 5 prompts per question
          </p>
          <p className="text-neon-cyan/50 text-xs font-mono uppercase tracking-wider mt-2">
            💰 Higher scores for fewer prompts and faster completion
          </p>
        </motion.div>

        {/* Leaderboard link */}
        <motion.button
          onClick={() => navigate("/admin")}
          className="absolute bottom-8 right-8 glass-card px-4 py-2 text-neon-cyan/70 hover:text-neon-cyan text-xs font-mono uppercase transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View Leaderboard
        </motion.button>
      </motion.div>
    </div>
  );
}

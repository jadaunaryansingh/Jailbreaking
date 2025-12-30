import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "@/services/firebase";
import { ref, onValue, query, orderByChild, limitToFirst } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
  id: string;
  name: string;
  totalScore: number;
  questionsCompleted: number;
  levelCompleted: string;
  completionTime?: number;
  rank?: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    avgScore: 0,
    avgQuestionsCompleted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Real-time leaderboard subscription
  useEffect(() => {
    const usersRef = ref(database, "users");
    
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const entries: LeaderboardEntry[] = Object.entries(data).map(
            ([id, userdata]: [string, any]) => ({
              id,
              name: userdata.name || "Unknown",
              totalScore: userdata.totalScore || 0,
              questionsCompleted: userdata.questionsCompleted || 0,
              levelCompleted: userdata.levelCompleted || "none",
              completionTime: userdata.completionTime || 0,
            })
          );

          // Sort by total score descending
          entries.sort((a, b) => b.totalScore - a.totalScore);

          // Add ranks
          entries.forEach((entry, index) => {
            entry.rank = index + 1;
          });

          setLeaderboard(entries);

          // Calculate stats
          const totalParticipants = entries.length;
          const avgScore =
            totalParticipants > 0
              ? Math.round(
                  entries.reduce((sum, e) => sum + e.totalScore, 0) / totalParticipants
                )
              : 0;
          const avgQuestionsCompleted =
            totalParticipants > 0
              ? Math.round(
                  entries.reduce((sum, e) => sum + e.questionsCompleted, 0) /
                    totalParticipants
                )
              : 0;

          setStats({
            totalParticipants,
            avgScore,
            avgQuestionsCompleted,
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching leaderboard:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case "easy":
        return "#00ff41";
      case "medium":
        return "#00f0ff";
      case "hard":
        return "#ff00ff";
      default:
        return "#6b7280";
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 border-yellow-500";
    if (rank === 2) return "bg-gray-400/20 border-gray-400";
    if (rank === 3) return "bg-orange-600/20 border-orange-600";
    return "bg-neon-cyan/10 border-neon-cyan/50";
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4 md:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="flex items-center justify-between mb-12" variants={itemVariants}>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold neon-glow-cyan mb-2">
              ADMIN DASHBOARD
            </h1>
            <p className="text-neon-cyan/70 text-sm uppercase tracking-wider">
              Real-time Event Analytics
            </p>
          </div>

          <motion.button
            onClick={() => navigate("/levels")}
            className="glass-card px-6 py-3 text-neon-cyan/70 hover:text-neon-cyan text-xs font-mono uppercase transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Game
          </motion.button>
        </motion.div>

        {/* Stats cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" variants={itemVariants}>
          {[
            {
              title: "Total Participants",
              value: stats.totalParticipants,
              icon: "👥",
              color: "#00f0ff",
              colorName: "CYAN",
            },
            {
              title: "Avg Score",
              value: stats.avgScore,
              icon: "⭐",
              color: "#ff00ff",
              colorName: "MAGENTA",
            },
            {
              title: "Avg Questions",
              value: stats.avgQuestionsCompleted,
              icon: "📊",
              color: "#00ff41",
              colorName: "GREEN",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="glass-card p-6 border border-neon-cyan/30"
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,240,255,0.2)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs text-neon-cyan/60 font-mono">
                  {stat.colorName}
                </span>
              </div>
              <p className="text-neon-cyan/70 text-sm mb-2">{stat.title}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Leaderboard */}
        <motion.div className="glass-card p-8" variants={itemVariants}>
          {/* Leaderboard header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neon-cyan/20">
            <div className="w-3 h-3 rounded-full bg-neon-green"></div>
            <h2 className="text-2xl font-bold text-neon-cyan">LEADERBOARD</h2>
            <motion.div
              className="ml-auto text-xs text-neon-cyan/60 font-mono"
              animate={{ opacity: [0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              LIVE UPDATES ENABLED
            </motion.div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-8 h-8 border-3 border-neon-cyan border-t-transparent rounded-full"></div>
              </motion.div>
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-neon-cyan/60 text-center py-8 font-mono">
              No participants yet...
            </p>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 mb-4 px-4 text-xs text-neon-cyan/70 font-mono uppercase">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Score</div>
                <div className="col-span-2">Questions</div>
                <div className="col-span-3">Level</div>
              </div>

              {/* Table rows */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {leaderboard.map((entry) => (
                    <motion.div
                      key={entry.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg border transition-all ${getRankBadgeColor(
                        entry.rank || 0
                      )}`}
                      whileHover={{
                        backgroundColor: "rgba(0, 240, 255, 0.1)",
                        boxShadow: "0 0 10px rgba(0, 240, 255, 0.2)",
                      }}
                    >
                      {/* Rank */}
                      <div className="col-span-1 flex items-center">
                        <motion.span
                          className="text-lg font-bold text-neon-cyan"
                          animate={{
                            scale: entry.rank === 1 ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          #{entry.rank}
                        </motion.span>
                      </div>

                      {/* Name */}
                      <div className="col-span-4 flex items-center">
                        <span className="text-neon-cyan truncate font-mono">
                          {entry.name}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="col-span-2 flex items-center">
                        <motion.span
                          className="text-neon-magenta font-bold text-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          {entry.totalScore}
                        </motion.span>
                      </div>

                      {/* Questions */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-neon-green font-mono">
                          {entry.questionsCompleted}/15
                        </span>
                      </div>

                      {/* Level */}
                      <div className="col-span-3 flex items-center">
                        <span
                          className="uppercase font-mono text-xs font-bold"
                          style={{ color: getLevelColor(entry.levelCompleted) }}
                        >
                          {entry.levelCompleted || "Not Started"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Footer info */}
              <div className="mt-6 pt-4 border-t border-neon-cyan/20 text-neon-cyan/60 text-xs font-mono text-center">
                Showing {leaderboard.length} participant{leaderboard.length !== 1 ? "s" : ""}
              </div>
            </>
          )}
        </motion.div>

        {/* Decorative corner elements */}
        <motion.div
          className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-neon-cyan/20 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-neon-magenta/20 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

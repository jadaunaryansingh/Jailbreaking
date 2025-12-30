import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/levels");
    }
  }, [isAuthenticated, navigate]);

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

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
      </div>

      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
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

      {/* Main content */}
      <motion.div
        className="relative h-full min-h-screen flex flex-col items-center justify-center px-4 py-12"
        variants={containerVariants}
      >
        {/* Hero section */}
        <motion.div className="text-center mb-16 max-w-4xl" variants={itemVariants}>
          <motion.h1
            className="text-5xl md:text-7xl font-black mb-4 leading-tight"
            animate={{
              backgroundImage: [
                "linear-gradient(90deg, #00f0ff, #ff00ff, #00f0ff)",
                "linear-gradient(90deg, #ff00ff, #00f0ff, #ff00ff)",
                "linear-gradient(90deg, #00f0ff, #ff00ff, #00f0ff)",
              ],
              backgroundSize: ["200% auto"],
            }}
            transition={{ duration: 6, repeat: Infinity }}
            style={{
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            JAILBREAKING
          </motion.h1>

          <motion.p
            className="text-2xl md:text-3xl text-neon-cyan/80 mb-6 font-mono"
            variants={itemVariants}
          >
            {"{"} AI Prompt Engineering Challenge {"}"}
          </motion.p>

          <motion.p
            className="text-neon-cyan/60 text-lg mb-8 max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Master the art of indirect prompting. Challenge an AI to reveal hidden words
            through clever questioning, strategic hints, and advanced reasoning techniques.
            It's not about asking directly – it's about making the AI understand through
            context and implication.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            onClick={() => navigate("/login")}
            className="px-12 py-4 bg-neon-cyan/10 border-2 border-neon-cyan text-neon-cyan font-bold uppercase tracking-wider rounded-lg hover:bg-neon-cyan/20 transition-all text-lg relative overflow-hidden group"
            variants={itemVariants}
            whileHover={{
              boxShadow: "0 0 30px #00f0ff",
              scale: 1.05,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative">ENTER THE CHALLENGE</span>
          </motion.button>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl my-16 w-full"
          variants={itemVariants}
        >
          {[
            {
              icon: "🎯",
              title: "3 Difficulty Levels",
              desc: "Easy, Medium, and Hard challenges",
              color: "#00ff41",
              colorName: "green",
            },
            {
              icon: "⚡",
              title: "5 Questions Per Level",
              desc: "15 total prompts to master",
              color: "#00f0ff",
              colorName: "cyan",
            },
            {
              icon: "💎",
              title: "Competitive Scoring",
              desc: "Fewer prompts = Higher score",
              color: "#ff00ff",
              colorName: "magenta",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="glass-card p-6 text-center border border-neon-cyan/30"
              style={{ borderColor: `${feature.color}40` }}
              variants={featureVariants}
              whileHover={{
                scale: 1.05,
              }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: feature.color }}>
                {feature.title}
              </h3>
              <p className="text-neon-cyan/60 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Game mechanics */}
        <motion.div className="glass-card p-8 max-w-4xl w-full my-8" variants={itemVariants}>
          <h2 className="text-2xl font-bold neon-glow-cyan mb-6">How It Works</h2>

          <div className="space-y-6">
            {[
              {
                num: "1",
                title: "Choose Your Level",
                desc: "Select Easy, Medium, or Hard difficulty and prepare your strategies.",
              },
              {
                num: "2",
                title: "Encounter Hidden Words",
                desc: "Face 5 mysterious concepts. The AI will never directly reveal them.",
              },
              {
                num: "3",
                title: "Ask Smart Questions",
                desc: "Use hints, properties, and indirect reasoning. You have 5 prompts per question.",
              },
              {
                num: "4",
                title: "Jailbreak & Reveal",
                desc: "Successfully reason through the concept to force the AI to reveal the answer.",
              },
              {
                num: "5",
                title: "Earn Your Rank",
                desc: "Score is based on prompts used and time taken. Compete on the leaderboard.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center font-bold text-neon-cyan text-sm"
                >
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-neon-cyan mb-1">{step.title}</h3>
                  <p className="text-neon-cyan/60 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rules section */}
        <motion.div className="glass-card p-8 max-w-4xl w-full my-8" variants={itemVariants}>
          <h2 className="text-2xl font-bold neon-glow-magenta mb-6">Key Rules</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "🚫", rule: "No skipping levels or questions" },
              { icon: "🔒", rule: "AI refuses direct word requests" },
              { icon: "📝", rule: "Max 5 prompts per question" },
              { icon: "⏱️", rule: "Time affects final score" },
              { icon: "🎯", rule: "Fewer prompts = Higher score" },
              { icon: "🏆", rule: "Single session per user" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg"
                whileHover={{ borderColor: "#00f0ff", backgroundColor: "rgba(0,240,255,0.1)" }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-neon-cyan/80 font-mono text-sm">
                  {item.rule}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div className="text-center mt-12" variants={itemVariants}>
          <p className="text-neon-cyan/60 mb-6 font-mono">
            Ready to challenge yourself?
          </p>
          <motion.button
            onClick={() => navigate("/login")}
            className="px-10 py-3 bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border-2 border-neon-cyan text-neon-cyan font-bold uppercase tracking-wider rounded-lg hover:border-neon-magenta transition-all"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px #ff00ff" }}
            whileTap={{ scale: 0.95 }}
          >
            START NOW
          </motion.button>
        </motion.div>

        {/* Decorative corners */}
        <motion.div
          className="absolute top-8 left-8 w-20 h-20 border-t-2 border-l-2 border-neon-cyan/20 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-8 right-8 w-20 h-20 border-b-2 border-r-2 border-neon-magenta/20 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>
    </motion.div>
  );
}

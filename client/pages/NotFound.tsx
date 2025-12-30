import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
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

      {/* Content */}
      <motion.div className="relative z-10 text-center max-w-md" variants={containerVariants}>
        {/* 404 animation */}
        <motion.div
          className="text-8xl md:text-9xl font-black mb-6"
          animate={{
            backgroundImage: [
              "linear-gradient(90deg, #00f0ff, #ff00ff)",
              "linear-gradient(90deg, #ff00ff, #00f0ff)",
            ],
            backgroundSize: ["200% auto"],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          404
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold neon-glow-cyan mb-4"
          variants={itemVariants}
        >
          PAGE NOT FOUND
        </motion.h1>

        <motion.p
          className="text-neon-cyan/70 mb-8 text-sm font-mono"
          variants={itemVariants}
        >
          The resource you're looking for doesn't exist in our system.
          <br />
          Perhaps it was jailbroken out of existence?
        </motion.p>

        {/* Status indicators */}
        <motion.div
          className="mb-8 p-4 glass-card border border-neon-cyan/30"
          variants={itemVariants}
        >
          <div className="text-left space-y-2 text-xs font-mono">
            <p>
              <span className="text-neon-magenta">{">"}</span>
              <span className="text-neon-cyan"> Error: Page Not Found</span>
            </p>
            <p>
              <span className="text-neon-magenta">{">"}</span>
              <span className="text-neon-cyan"> Status: 404</span>
            </p>
            <p>
              <span className="text-neon-magenta">{">"}</span>
              <motion.span
                className="text-neon-cyan"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {" "}Attempting recovery...
              </motion.span>
            </p>
          </div>
        </motion.div>

        {/* Navigation buttons */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:justify-center" variants={itemVariants}>
          <motion.button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-bold uppercase tracking-wider rounded-lg hover:bg-neon-cyan/20 transition-all text-sm"
            whileHover={{ boxShadow: "0 0 20px #00f0ff", scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Home
          </motion.button>

          <motion.button
            onClick={() => navigate("/levels")}
            className="px-6 py-3 bg-neon-magenta/10 border border-neon-magenta text-neon-magenta font-bold uppercase tracking-wider rounded-lg hover:bg-neon-magenta/20 transition-all text-sm"
            whileHover={{ boxShadow: "0 0 20px #ff00ff", scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Levels
          </motion.button>
        </motion.div>

        {/* Footer message */}
        <motion.p
          className="mt-8 text-neon-cyan/50 text-xs font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ⚠ If you believe this is an error, please try again.
        </motion.p>
      </motion.div>

      {/* Decorative elements */}
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
  );
}

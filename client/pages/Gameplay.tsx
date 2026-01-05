import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestion, sendMessage, type Level } from "@/services/aiService";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export default function Gameplay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const { gameSession, startQuestion, updatePromptCount, completeQuestion, skipQuestion, saveGameProgress, finishLevel } = useGame();

  const level: Level = "easy";
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "ai"; content: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCompleted, setQuestionCompleted] = useState(false);
  const [jailbroken, setJailbroken] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [indirectCount, setIndirectCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  useEffect(() => {
    if (cooldownUntil > 0) {
      const remaining = Math.max(0, cooldownUntil - Date.now());
      const t = setTimeout(() => setCooldownUntil(0), remaining);
      return () => clearTimeout(t);
    }
  }, [cooldownUntil]);
  const newMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const currentQuestion = getQuestion(level, currentQuestionNumber);

  useEffect(() => {
    if (gameSession) {
      const q = gameSession.currentQuestion || 1;
      setCurrentQuestionNumber(q);
      const locked = !!gameSession.questions[q]?.isCompleted;
      setQuestionCompleted(locked);
      setPromptsUsed(gameSession.questions[q]?.promptsUsed ?? 0);
    }
  }, [gameSession?.currentQuestion, gameSession?.questions]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || isLoading || questionCompleted || Date.now() < cooldownUntil) {
      return;
    }

    const userMessage = userInput.trim();
    setUserInput("");
    setMessages((prev) => [...prev, { id: newMessageId(), role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendMessage(
        userMessage,
        currentQuestion.hiddenWord,
        messages
          .filter((m) => m.role === "ai" || m.role === "user")
          .map((m) =>
            m.role === "user"
              ? new HumanMessage({ content: m.content })
              : new AIMessage({ content: m.content })
          ),
        promptsUsed,
        currentQuestion.hints
      );

      const newPromptsUsed = promptsUsed + 1;
      setPromptsUsed(newPromptsUsed);
      updatePromptCount(newPromptsUsed);

      setMessages((prev) => [...prev, { id: newMessageId(), role: "ai", content: response.response }]);

      const lower = userMessage.toLowerCase();
      const directGuess =
        lower.includes(currentQuestion.hiddenWord.toLowerCase()) ||
        lower.includes("what is the word") ||
        lower.includes("tell me the word") ||
        lower.includes("what is the answer") ||
        lower.includes("reveal the answer") ||
        lower.startsWith("is it ") ||
        lower.startsWith("is this ") ||
        lower.startsWith("is that ");
      const indirectCue =
        lower.includes("made of") ||
        lower.includes("consists of") ||
        lower.includes("used for") ||
        lower.includes("usage") ||
        lower.includes("properties") ||
        lower.includes("material") ||
        lower.includes("function") ||
        lower.includes("shape") ||
        lower.includes("color") ||
        lower.includes("size") ||
        lower.includes("where") ||
        lower.includes("found in") ||
        lower.endsWith("?");

      if (!directGuess && indirectCue) {
        setIndirectCount((prev) => prev + 1);
      }

      const nextIndirect = (!directGuess && indirectCue) ? indirectCount + 1 : indirectCount;
      if (nextIndirect >= 3 && !questionCompleted) {
        const reveal = `Access granted. The word is: ${currentQuestion.hiddenWord}`;
        setMessages((prev) => [...prev, { id: newMessageId(), role: "ai", content: reveal }]);
        setJailbroken(true);
        setQuestionCompleted(true);
        setTimeout(async () => {
          await completeQuestion(true);
          moveToNextQuestion();
        }, 1200);
      }
      setCooldownUntil(Date.now() + 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { id: newMessageId(), role: "ai", content: "System error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const moveToNextQuestion = () => {
    if (!gameSession) return;
    const current = currentQuestionNumber;
    let next = -1;
    for (let i = current + 1; i <= 5; i++) {
      if (!gameSession.questions[i]?.isCompleted) { next = i; break; }
    }
    if (next === -1) {
      for (let i = 1; i < current; i++) {
        if (!gameSession.questions[i]?.isCompleted) { next = i; break; }
      }
    }
    if (next === -1) {
      finishLevel();
      navigate("/levels");
      return;
    }
    startQuestion(next);
    setCurrentQuestionNumber(next);
    setPromptsUsed(0);
    setMessages([]);
    setQuestionCompleted(false);
    setJailbroken(false);
    setIndirectCount(0);
    saveGameProgress();
  };

  const handleSkipQuestion = async () => {
    await skipQuestion();
    moveToNextQuestion();
  };

  const progressPercentage = 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const warningVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3 },
    },
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, repeat: Infinity },
    },
  };

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,240,255,.05)_25%,rgba(0,240,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,240,255,.05)_75%,rgba(0,240,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
      </div>

      {/* Header with level and progress info */}
      <motion.div
        className="relative z-10 glass-card m-4 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-neon-cyan text-xs font-mono uppercase mb-2">
              Conversational Mode
            </div>
            <h1 className="text-2xl font-bold neon-glow-cyan">
              Chat with the AI Assistant
            </h1>
          </div>

          

          {/* Exit button */}
          <motion.button
            onClick={() => navigate("/levels")}
            className="glass-card px-4 py-2 text-neon-cyan/70 hover:text-neon-cyan text-xs font-mono uppercase transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back
          </motion.button>
        </div>
      </motion.div>

      {/* Main gameplay area */}
      <div className="relative z-10 flex-1 flex flex-col gap-4 m-4 overflow-hidden">
        {/* Chat area */}
        <motion.div
          className="flex-1 glass-card p-6 flex flex-col overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neon-cyan/20">
            <div className="w-3 h-3 rounded-full bg-neon-green"></div>
            <span className="text-neon-cyan/70 text-xs font-mono">
              AI_SANDBOX_TERMINAL
            </span>
          </div>

          {/* Questions navbar */}
          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map((q) => {
              const locked = !!gameSession?.questions[q]?.isCompleted;
              const isCurrent = q === currentQuestionNumber;
              return (
                <button
                  key={q}
                  onClick={() => {
                    if (locked) return;
                    startQuestion(q);
                    setCurrentQuestionNumber(q);
                    setPromptsUsed(gameSession?.questions[q]?.promptsUsed ?? 0);
                    setMessages([]);
                    setQuestionCompleted(false);
                    setJailbroken(false);
                    setIndirectCount(0);
                    saveGameProgress();
                  }}
                  className={`px-3 py-1 rounded-md font-mono text-xs border ${
                    locked
                      ? "bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed"
                      : isCurrent
                      ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan"
                      : "bg-gray-900/50 text-neon-cyan/70 border-neon-cyan/30"
                  }`}
                >
                  Q{q}{locked ? " 🔒" : ""}
                </button>
              );
            })}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            <AnimatePresence>
              {messages.length === 0 && !isLoading && (
                <motion.div
                  className="h-full flex items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div>
                    <p className="text-neon-cyan/60 text-sm mb-2">
                      {">"} System ready. Begin your inquiry...
                    </p>
                  </div>
                </motion.div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg font-mono text-sm ${
                      message.role === "user"
                        ? "bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan"
                        : "bg-neon-magenta/10 border border-neon-magenta/50 text-neon-magenta/90"
                    }`}
                  >
                    <div className="text-xs font-bold mb-1 opacity-70">
                      {message.role === "user" ? "$ USER" : "> AI_SYSTEM"}
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  key="loading"
                  className="flex justify-start"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="bg-neon-magenta/10 border border-neon-magenta/50 px-4 py-3 rounded-lg">
                    <motion.span
                      className="text-neon-magenta/90 font-mono text-sm"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {"▌"} Processing...
                    </motion.span>
                  </div>
                </motion.div>
              )}

              {jailbroken && (
                <motion.div
                  className="text-center py-4"
                  variants={successVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    className="inline-block px-6 py-3 bg-neon-green/20 border-2 border-neon-green rounded-lg"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <p className="text-neon-green font-bold">
                      ✓ JAILBREAK SUCCESSFUL
                    </p>
                    <p className="text-neon-green/70 text-xs mt-1">
                      Question completed with {promptsUsed} prompts
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {questionCompleted && !jailbroken && (
                <motion.div
                  className="text-center py-4"
                  variants={warningVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    className="inline-block px-6 py-3 bg-neon-magenta/20 border-2 border-neon-magenta rounded-lg"
                    animate="animate"
                  >
                    <p className="text-neon-magenta font-bold">
                      ✗ MAX PROMPTS REACHED
                    </p>
                    <p className="text-neon-magenta/70 text-xs mt-1">
                      Moving to next question...
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </motion.div>

        {/* Input area */}
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading || questionCompleted || cooldownUntil > Date.now()}
              placeholder={
                questionCompleted
                  ? "Question completed. Next in progress..."
                  : "Ask a question about the hidden concept..."
              }
              className="flex-1 px-4 py-3 bg-gray-900/50 border border-neon-cyan/30 rounded-lg text-neon-cyan placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all font-mono text-sm disabled:opacity-50"
            />

            <motion.button
              type="submit"
              disabled={isLoading || questionCompleted || cooldownUntil > Date.now()}
              className="px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-bold rounded-lg hover:bg-neon-cyan/20 transition-all disabled:opacity-50 font-mono text-sm"
              whileHover={{ boxShadow: "0 0 15px #00f0ff" }}
              whileTap={{ scale: 0.95 }}
            >
              {cooldownUntil > Date.now() ? "COOLDOWN…" : "SEND"}
            </motion.button>

            {!questionCompleted && (
              <motion.button
                type="button"
                onClick={handleSkipQuestion}
                className="px-4 py-3 bg-neon-magenta/10 border border-neon-magenta text-neon-magenta text-xs font-mono rounded-lg hover:bg-neon-magenta/20 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                SKIP
              </motion.button>
            )}
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}

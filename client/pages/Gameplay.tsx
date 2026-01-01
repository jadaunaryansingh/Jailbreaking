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
  const { userProfile, logout } = useAuth();
  const { gameSession, startQuestion, updatePromptCount, completeQuestion, skipQuestion, saveGameProgress, useHint } = useGame();

  const level = (location.state?.level || "easy") as Level;
  
  // Initialize from gameSession if available, otherwise default values
  const initialQuestionNumber = gameSession?.currentQuestion || 1;
  const savedQuestionState = gameSession?.questions[initialQuestionNumber];
  
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(initialQuestionNumber);
  const [promptsUsed, setPromptsUsed] = useState(savedQuestionState?.promptsUsed || 0);
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; content: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCompleted, setQuestionCompleted] = useState(savedQuestionState?.isCompleted || false);
  const [jailbroken, setJailbroken] = useState(savedQuestionState?.jailbroken || false);
  const [hintIndex, setHintIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastLoadedQuestionRef = useRef<number | null>(null);

  const currentQuestion = getQuestion(level, currentQuestionNumber);
  const maxPrompts = 5;
  const promptsRemaining = maxPrompts - promptsUsed;
  const isLastPrompt = promptsRemaining === 1;

  const containsWordGuess = (text: string, word: string) => {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const tokens = normalize(text).split(" ");
    const w = normalize(word);
    const variants = new Set<string>([w, `${w}s`, `${w}es`]);
    return tokens.some((t) => variants.has(t));
  };

  // Start question tracking in context
  useEffect(() => {
    if (gameSession) {
      startQuestion(currentQuestionNumber);
    }
  }, [currentQuestionNumber, startQuestion, gameSession?.userId]);

  // Load saved question state if available (separate effect to avoid infinite loop)
  useEffect(() => {
    if (!gameSession) return;
    
    // Only load state when question number changes, not on every gameSession update
    if (lastLoadedQuestionRef.current === currentQuestionNumber) {
      return;
    }
    
    lastLoadedQuestionRef.current = currentQuestionNumber;
    setHintIndex(0);
    
    const savedState = gameSession.questions[currentQuestionNumber];
    if (savedState) {
      setPromptsUsed(savedState.promptsUsed || 0);
      setQuestionCompleted(savedState.isCompleted || false);
      setJailbroken(savedState.jailbroken || false);
      
      // Restore messages if available (convert BaseMessage to display format)
      if (savedState.messages && savedState.messages.length > 0) {
        const restoredMessages = savedState.messages.map((msg: any) => {
          const content = typeof msg.content === 'string' ? msg.content : msg.content?.content || '';
          return {
            role: (msg.constructor.name === 'HumanMessage' ? 'user' : 'ai') as "user" | "ai",
            content: content as string
          };
        });
        setMessages(restoredMessages);
      } else {
        setMessages([]);
      }
    } else {
      // Reset for new question
      setPromptsUsed(0);
      setQuestionCompleted(false);
      setJailbroken(false);
      setMessages([]);
    }
  }, [currentQuestionNumber, gameSession]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if question is already completed
    const isQuestionAlreadyCompleted = gameSession?.questions[currentQuestionNumber]?.isCompleted;
    if (isQuestionAlreadyCompleted) {
      console.warn("Question already completed, cannot answer again");
      return;
    }
    
    if (!userInput.trim() || isLoading || promptsUsed >= maxPrompts || questionCompleted) {
      return;
    }

    const userMessage = userInput.trim();
    setUserInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Immediate local success check to ensure completion even if API is rate-limited
    if (containsWordGuess(userMessage, currentQuestion.hiddenWord)) {
      try {
        setJailbroken(true);
        setQuestionCompleted(true);
        await completeQuestion(true);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await sendMessage(
        userMessage,
        currentQuestion.hiddenWord,
        messages.filter((m) => m.role === "ai" || m.role === "user").map(
          (m) =>
            m.role === "user"
              ? new HumanMessage({ content: m.content })
              : new AIMessage({
                  content: m.content,
                })
        ),
        promptsUsed
      );

      const newPromptsUsed = promptsUsed + 1;
      setPromptsUsed(newPromptsUsed);
      updatePromptCount(newPromptsUsed);

      setMessages((prev) => [...prev, { role: "ai", content: response.response }]);

      // Use explicit detection signal from AI service
      if (response.isJailbroken) {
        setJailbroken(true);
        setQuestionCompleted(true);

        // Mark complete immediately to prevent re-answer and enable leaderboard update
        await completeQuestion(true);
      }

      // Check if prompts exhausted
      if (newPromptsUsed >= maxPrompts) {
        setQuestionCompleted(true);
        setJailbroken(false);

        // Auto-move to next question
        setTimeout(() => {
          completeQuestion(false);
          moveToNextQuestion();
        }, 2000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "System error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const moveToNextQuestion = () => {
    if (currentQuestionNumber < 5) {
      setCurrentQuestionNumber(currentQuestionNumber + 1);
      setPromptsUsed(0);
      setMessages([]);
      setQuestionCompleted(false);
      setJailbroken(false);
    } else {
      // Level completed - go back to level selection
      navigate("/levels");
    }
  };

  const handleSkipQuestion = async () => {
    await skipQuestion();
    // Find next incomplete question
    let nextQ = currentQuestionNumber + 1;
    if (nextQ > 5) nextQ = 1;
    // Simple cycle for now, or just go next
    if (currentQuestionNumber < 5) {
        setCurrentQuestionNumber(currentQuestionNumber + 1);
    } else {
        // Wrap around to 1? Or stay?
        // User said "go to next question or level"
        // Let's just go to next ID if < 5
    }
  };

  const handleUseHint = () => {
    if (!gameSession || gameSession.hintsRemaining <= 0) return;
    
    // Check if we have hints available for this question
    if (hintIndex < currentQuestion.hints.length) {
      useHint();
      const hint = currentQuestion.hints[hintIndex];
      setMessages(prev => [...prev, {
        role: "ai",
        content: `💡 HINT (${gameSession.hintsRemaining - 1} remaining): ${hint}`
      }]);
      setHintIndex(prev => prev + 1);
    } else {
      setMessages(prev => [...prev, {
        role: "ai",
        content: `⚠️ No more hints available for this question.`
      }]);
    }
  };

  const progressPercentage = (currentQuestionNumber / 5) * 100;

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
      transition: { duration: 0.6, type: "spring" as const },
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
          {/* Level info */}
          <div>
            <div className="text-neon-cyan text-xs font-mono uppercase mb-2">
              Level: {level.toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold neon-glow-cyan">
              {currentQuestion.title}
            </h1>
          </div>

          {/* Progress & Navigation */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(qNum => {
                  const qState = gameSession?.questions[qNum];
                  const isCurrent = currentQuestionNumber === qNum;
                  const isDone = qState?.isCompleted;
                  return (
                    <button
                      key={qNum}
                      onClick={() => {
                        if (isDone) return;
                        setCurrentQuestionNumber(qNum);
                      }}
                      disabled={isDone}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs transition-all
                        ${isCurrent 
                          ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan scale-110 shadow-[0_0_10px_rgba(0,240,255,0.5)]' 
                          : isDone 
                            ? 'border-neon-green bg-neon-green/10 text-neon-green' 
                            : 'border-gray-600 text-gray-400 hover:border-neon-cyan/50 hover:text-neon-cyan/70'
                        }
                      `}
                    >
                      {isDone ? '✓' : qNum}
                    </button>
                  );
                })}
            </div>
            <div className="text-neon-magenta/80 text-xs font-mono">
              LEVEL HINTS: {gameSession?.hintsRemaining ?? 5}/5
            </div>
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
          <motion.button
            onClick={async () => {
              // Save progress before logging out
              await saveGameProgress();
              await logout();
              navigate("/login");
            }}
            className="glass-card px-4 py-2 text-neon-magenta/70 hover:text-neon-magenta text-xs font-mono uppercase transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            <AnimatePresence>
              {messages.length === 0 && !isLoading && (
                <motion.div
                  key="empty-state"
                  className="h-full flex items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div>
                    <p className="text-neon-cyan/60 text-sm mb-2">
                      {">"} System ready. Begin your inquiry...
                    </p>
                    <p className="text-neon-cyan/40 text-xs font-mono">
                      Goal: {currentQuestion.title}
                    </p>
                    <p className="text-neon-cyan/30 text-xs font-mono mt-2">
                      Ask indirect questions to discover the hidden word
                    </p>
                  </div>
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={`message-${index}-${message.content.substring(0, 20)}`}
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
                  key="jailbreak-success"
                  className="text-center py-4"
                  variants={successVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    className="inline-block px-6 py-3 bg-neon-green/20 border-2 border-neon-green rounded-lg mb-4"
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
                  {currentQuestionNumber < 5 ? (
                    <motion.button
                      onClick={async () => {
                        // Ensure question is marked as completed
                        if (!gameSession?.questions[currentQuestionNumber]?.isCompleted) {
                          await completeQuestion(true);
                        }
                        moveToNextQuestion();
                      }}
                      className="px-6 py-3 bg-neon-green/20 border-2 border-neon-green text-neon-green font-bold rounded-lg hover:bg-neon-green/30 transition-all font-mono text-sm"
                      whileHover={{ scale: 1.05, boxShadow: "0 0 15px #00ff41" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      NEXT QUESTION →
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={async () => {
                        // Ensure question is marked as completed
                        if (!gameSession?.questions[currentQuestionNumber]?.isCompleted) {
                          await completeQuestion(true);
                        }
                        navigate("/levels");
                      }}
                      className="px-6 py-3 bg-neon-green/20 border-2 border-neon-green text-neon-green font-bold rounded-lg hover:bg-neon-green/30 transition-all font-mono text-sm"
                      whileHover={{ scale: 1.05, boxShadow: "0 0 15px #00ff41" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      BACK TO LEVELS →
                    </motion.button>
                  )}
                </motion.div>
              )}

              {questionCompleted && !jailbroken && (
                <motion.div
                  key="max-prompts-reached"
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

        {/* Prompt counter and input area */}
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Prompt counter */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-neon-cyan/20">
            <div className="flex items-center gap-2">
              <span className="text-neon-cyan/70 text-xs font-mono">
                PROMPTS REMAINING:
              </span>
              <div className="flex gap-1">
                {[...Array(maxPrompts)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < promptsUsed
                        ? "bg-neon-magenta/50"
                        : isLastPrompt && i === promptsUsed
                          ? "bg-red-500"
                          : "bg-neon-cyan/50"
                    }`}
                    animate={
                      isLastPrompt && i === promptsUsed
                        ? { scale: [1, 1.3, 1] }
                        : {}
                    }
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                ))}
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  isLastPrompt ? "text-red-500 animate-pulse" : "text-neon-cyan"
                }`}
              >
                {promptsRemaining}/{maxPrompts}
              </span>
            </div>

            {/* Status */}
            <motion.div
              className="text-xs font-mono text-neon-cyan/60"
              animate={isLastPrompt ? { opacity: [0.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {isLastPrompt && "⚠ FINAL PROMPT"}
              {questionCompleted && "✓ COMPLETE"}
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-4">
               <button 
                  type="button"
                  onClick={handleUseHint}
                  disabled={!gameSession || gameSession.hintsRemaining <= 0 || questionCompleted || gameSession?.questions[currentQuestionNumber]?.isCompleted}
                  className="px-2 py-1 text-xs border border-neon-magenta text-neon-magenta rounded hover:bg-neon-magenta/10 disabled:opacity-50 font-mono transition-colors"
               >
                 💡 HINT
               </button>
               <button 
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={questionCompleted || gameSession?.questions[currentQuestionNumber]?.isCompleted}
                  className="px-2 py-1 text-xs border border-gray-500 text-gray-400 rounded hover:border-neon-cyan hover:text-neon-cyan disabled:opacity-50 font-mono transition-colors"
               >
                 ⏭ SKIP
               </button>
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading || questionCompleted || promptsUsed >= maxPrompts || gameSession?.questions[currentQuestionNumber]?.isCompleted}
              placeholder={
                gameSession?.questions[currentQuestionNumber]?.isCompleted
                  ? "Question already completed. Move to next question."
                  : questionCompleted
                  ? "Question completed. Next in progress..."
                  : "Ask a question about the hidden concept..."
              }
              className="flex-1 px-4 py-3 bg-gray-900/50 border border-neon-cyan/30 rounded-lg text-neon-cyan placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all font-mono text-sm disabled:opacity-50"
            />

            <motion.button
              type="submit"
              disabled={isLoading || questionCompleted || promptsUsed >= maxPrompts || gameSession?.questions[currentQuestionNumber]?.isCompleted}
              className="px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-bold rounded-lg hover:bg-neon-cyan/20 transition-all disabled:opacity-50 font-mono text-sm"
              whileHover={{ boxShadow: "0 0 15px #00f0ff" }}
              whileTap={{ scale: 0.95 }}
            >
              SEND
            </motion.button>

            {/* Hint button */}
            {hintIndex < currentQuestion.hints.length && !questionCompleted && (
              <motion.button
                type="button"
                onClick={() => setHintIndex((i) => Math.min(i + 1, currentQuestion.hints.length))}
                className="px-4 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan text-xs font-mono rounded-lg hover:bg-neon-cyan/20 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                HINT
              </motion.button>
            )}

            {currentQuestionNumber < 5 && !questionCompleted && (
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

        {/* Hints panel */}
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <div className="text-neon-cyan/70 text-xs font-mono mb-2">HINTS</div>
          <ul className="list-disc list-inside text-neon-cyan/80 text-sm">
            {currentQuestion.hints.slice(0, hintIndex).map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
            {hintIndex === 0 && <li className="text-neon-cyan/40">Press HINT to reveal</li>}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}

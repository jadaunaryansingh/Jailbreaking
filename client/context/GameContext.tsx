import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { BaseMessage } from "@langchain/core/messages";
import { database } from "@/services/firebase";
import { ref, update, get, runTransaction } from "firebase/database";

export type Level = "easy" | "medium" | "hard";

export interface QuestionState {
  questionId: number;
  promptsUsed: number;
  isCompleted: boolean;
  isFailed: boolean;
  timeSpent: number;
  messages: BaseMessage[];
  jailbroken: boolean;
}

export interface GameSessionState {
  userId: string;
  currentLevel: Level;
  currentQuestion: number;
  questions: {
    [key: number]: QuestionState;
  };
  totalScore: number;
  questionsCompleted: number;
  hintsRemaining: number;
  startTime: number;
  levelStartTime: number;
  questionStartTime: number;
}

interface GameContextType {
  gameSession: GameSessionState | null;
  startLevel: (userId: string, level: Level) => void;
  startQuestion: (questionId: number) => void;
  updatePromptCount: (count: number) => void;
  useHint: () => void;
  addMessage: (message: BaseMessage) => void;
  completeQuestion: (jailbroken: boolean) => Promise<void>;
  skipQuestion: () => Promise<void>;
  finishLevel: () => Promise<void>;
  saveGameProgress: (session?: GameSessionState) => Promise<void>;
  getProgressPercentage: () => number;
  getQuestionsCompleted: () => number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameSession, setGameSession] = useState<GameSessionState | null>(
    null
  );
  const gameSessionRef = useRef<GameSessionState | null>(null);

  useEffect(() => {
    gameSessionRef.current = gameSession;
  }, [gameSession]);

  const startLevel = useCallback(
    async (userId: string, level: Level) => {
      try {
        // Try to load saved progress
        const progressRef = ref(
          database,
          `users/${userId}/progress/${level}`
        );
        const progressSnapshot = await get(progressRef);
        
        let newSession: GameSessionState;
        
        if (progressSnapshot.exists()) {
          // Load saved progress
          const savedProgress = progressSnapshot.val();
          const savedQuestions = savedProgress.questions || {};
          
          newSession = {
            userId,
            currentLevel: level,
            currentQuestion: savedProgress.currentQuestion || 1,
            questions: {},
            totalScore: savedProgress.totalScore || 0,
            questionsCompleted: savedProgress.questionsCompleted || 0,
            hintsRemaining: savedProgress.hintsRemaining !== undefined ? savedProgress.hintsRemaining : 5,
            startTime: savedProgress.startTime || Date.now(),
            levelStartTime: savedProgress.levelStartTime || Date.now(),
            questionStartTime: Date.now(),
          };
          
          // Ensure all 5 question slots exist and merge
          for (let i = 1; i <= 5; i++) {
            if (savedQuestions[i]) {
                newSession.questions[i] = savedQuestions[i];
            } else {
              newSession.questions[i] = {
                questionId: i,
                promptsUsed: 0,
                isCompleted: false,
                isFailed: false,
                timeSpent: 0,
                messages: [],
                jailbroken: false,
              };
            }
          }
        } else {
          // Create new session
          newSession = {
            userId,
            currentLevel: level,
            currentQuestion: 1,
            questions: {},
            totalScore: 0,
            questionsCompleted: 0,
            hintsRemaining: 5,
            startTime: Date.now(),
            levelStartTime: Date.now(),
            questionStartTime: Date.now(),
          };

          // Initialize 5 question slots
          for (let i = 1; i <= 5; i++) {
            newSession.questions[i] = {
              questionId: i,
              promptsUsed: 0,
              isCompleted: false,
              isFailed: false,
              timeSpent: 0,
              messages: [],
              jailbroken: false,
            };
          }
        }

        setGameSession(newSession);
      } catch (error) {
        console.error("Error loading game progress:", error);
        // Fallback to new session on error
        const newSession: GameSessionState = {
          userId,
          currentLevel: level,
          currentQuestion: 1,
          questions: {},
          totalScore: 0,
          questionsCompleted: 0,
          hintsRemaining: 5,
          startTime: Date.now(),
          levelStartTime: Date.now(),
          questionStartTime: Date.now(),
        };

        for (let i = 1; i <= 5; i++) {
          newSession.questions[i] = {
            questionId: i,
            promptsUsed: 0,
            isCompleted: false,
            isFailed: false,
            timeSpent: 0,
            messages: [],
            jailbroken: false,
          };
        }

        setGameSession(newSession);
      }
    },
    []
  );

  const saveGameProgress = useCallback(async (sessionToSave?: GameSessionState) => {
    const session = sessionToSave || gameSessionRef.current;
    if (!session) return;

    try {
      const userRef = ref(
        database,
        `users/${session.userId}/progress/${session.currentLevel}`
      );
      await update(userRef, {
        currentQuestion: session.currentQuestion,
        totalScore: session.totalScore,
        questionsCompleted: session.questionsCompleted,
        hintsRemaining: session.hintsRemaining,
        lastUpdated: Date.now(),
        questions: session.questions,
        startTime: session.startTime,
        levelStartTime: session.levelStartTime,
      });
    } catch (error) {
      console.error("Error saving game progress:", error);
    }
  }, []);

  const startQuestion = useCallback((questionId: number) => {
    const prev = gameSessionRef.current;
    if (!prev) return;
    // Prevent navigating back to an already completed question
    const target = prev.questions[questionId];
    if (target && target.isCompleted) {
      console.warn("Attempt to start a completed question blocked");
      return;
    }
    
    const updated = {
        ...prev,
        currentQuestion: questionId,
        questionStartTime: Date.now(),
    };
    
    setGameSession(updated);
    saveGameProgress(updated);
  }, [saveGameProgress]);

  const updatePromptCount = useCallback((count: number) => {
    setGameSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.questions[prev.currentQuestion].promptsUsed = count;
      return updated;
    });
  }, []);

  const useHint = useCallback(() => {
    setGameSession((prev) => {
      if (!prev) return prev;
      if (prev.hintsRemaining <= 0) return prev;
      const updated = { ...prev };
      updated.hintsRemaining = prev.hintsRemaining - 1;
      return updated;
    });
  }, []);

  const addMessage = useCallback((message: BaseMessage) => {
    setGameSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.questions[prev.currentQuestion].messages.push(message);
      return updated;
    });
  }, []);

  const completeQuestion = useCallback(async (jailbroken: boolean) => {
    if (!gameSession) return;

    const currentQ = gameSession.questions[gameSession.currentQuestion];
    
    // Check if question is already completed - prevent duplicate scoring
    if (currentQ.isCompleted) {
      console.warn("Question already completed, skipping duplicate score");
      return;
    }

    const timeSpent = Math.floor(
      (Date.now() - gameSession.questionStartTime) / 1000
    );

    // Calculate score: 100 base points, minus 10 per prompt used, bonus for speed
    const baseScore = 100;
    const promptPenalty = currentQ.promptsUsed * 10;
    const speedBonus = Math.max(0, 30 - Math.floor(timeSpent / 10));
    const questionScore = Math.max(0, baseScore - promptPenalty + speedBonus);

    // Create updated session object locally first
    const updatedSession: GameSessionState = {
      ...gameSession,
      questions: {
        ...gameSession.questions,
        [gameSession.currentQuestion]: {
          ...currentQ,
          isCompleted: true,
          jailbroken,
          timeSpent,
        }
      },
      questionsCompleted: gameSession.questionsCompleted + 1,
      totalScore: gameSession.totalScore + questionScore,
      lastUpdated: Date.now() // Ensure this is part of the state we want to save
    } as GameSessionState; // Cast to ensure type compatibility if I added fields

    setGameSession(updatedSession);

    // Use a single atomic transaction to update BOTH global stats AND level progress
    try {
      const userRef = ref(database, `users/${updatedSession.userId}`);
      
      await runTransaction(userRef, (user) => {
        if (!user) {
          // Initialize user if completely missing (shouldn't happen usually)
          user = {
             name: "Unknown",
             email: "",
             totalScore: 0,
             questionsCompleted: 0,
             levelCompleted: "none",
             progress: {}
          };
        }

        // Initialize progress object if missing
        if (!user.progress) user.progress = {};
        if (!user.progress[updatedSession.currentLevel]) user.progress[updatedSession.currentLevel] = {};

        // Get the specific level progress
        const levelProgress = user.progress[updatedSession.currentLevel];
        const savedQuestions = levelProgress.questions || {};
         const savedQ = savedQuestions[updatedSession.currentQuestion];

         // Double check completion in DB within transaction to prevent race conditions
         if (savedQ && savedQ.isCompleted) {
           // Already completed in DB, do not increment global stats
           // But we should still ensure the local progress is synced? 
           // Actually, if it's done, we just return.
           return user; // Return user unchanged to avoid aborting transaction
         }

         // Update global stats
         user.totalScore = (user.totalScore || 0) + questionScore;
         user.questionsCompleted = (user.questionsCompleted || 0) + 1;
        user.levelCompleted = updatedSession.currentLevel;

        // Update level progress
        user.progress[updatedSession.currentLevel] = {
          ...levelProgress,
          currentQuestion: updatedSession.currentQuestion,
          totalScore: updatedSession.totalScore, // Level-specific score
          questionsCompleted: updatedSession.questionsCompleted,
          hintsRemaining: updatedSession.hintsRemaining,
          lastUpdated: Date.now(),
          startTime: updatedSession.startTime,
          levelStartTime: updatedSession.levelStartTime,
          questions: {
            ...savedQuestions,
            [updatedSession.currentQuestion]: updatedSession.questions[updatedSession.currentQuestion]
          }
        };

        return user;
      });

    } catch (error) {
      console.error("Error updating user profile and progress:", error);
    }
    
    // Persist level progress to the dedicated path used by startLevel loader
    try {
      await saveGameProgress(updatedSession);
    } catch (err) {
      console.error("Error saving progress after completion:", err);
    }
  }, [gameSession]);

  const skipQuestion = useCallback(async () => {
    if (!gameSession) return;

    const updatedSession: GameSessionState = {
      ...gameSession,
      questions: {
        ...gameSession.questions,
        [gameSession.currentQuestion]: {
          ...gameSession.questions[gameSession.currentQuestion],
          isFailed: true,
        }
      }
    };

    setGameSession(updatedSession);

    await saveGameProgress(updatedSession);
  }, [gameSession, saveGameProgress]);

  const finishLevel = useCallback(async () => {
    if (!gameSession) return;

    const levelTime = Math.floor((Date.now() - gameSession.levelStartTime) / 1000);

    try {
      const userRef = ref(database, `users/${gameSession.userId}`);
      await update(userRef, {
        totalScore: gameSession.totalScore,
        questionsCompleted: gameSession.questionsCompleted,
        levelCompleted: gameSession.currentLevel,
        completionTime: levelTime,
      });
    } catch (error) {
      console.error("Error finishing level:", error);
    }
  }, [gameSession]);

  const getProgressPercentage = useCallback(() => {
    if (!gameSession) return 0;
    return (gameSession.questionsCompleted / 5) * 100;
  }, [gameSession]);

  const getQuestionsCompleted = useCallback(() => {
    if (!gameSession) return 0;
    return gameSession.questionsCompleted;
  }, [gameSession]);

  const value: GameContextType = {
    gameSession,
    startLevel,
    startQuestion,
    updatePromptCount,
    useHint,
    addMessage,
    completeQuestion,
    skipQuestion,
    finishLevel,
    saveGameProgress,
    getProgressPercentage,
    getQuestionsCompleted,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

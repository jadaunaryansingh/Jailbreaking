import React, { createContext, useContext, useState, useCallback } from "react";
import { BaseMessage } from "@langchain/core/messages";
import { database } from "@/services/firebase";
import { ref, update, get } from "firebase/database";

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
  startTime: number;
  levelStartTime: number;
  questionStartTime: number;
}

interface GameContextType {
  gameSession: GameSessionState | null;
  startLevel: (userId: string, level: Level) => void;
  startQuestion: (questionId: number) => void;
  updatePromptCount: (count: number) => void;
  addMessage: (message: BaseMessage) => void;
  completeQuestion: (jailbroken: boolean) => Promise<void>;
  skipQuestion: () => Promise<void>;
  finishLevel: () => Promise<void>;
  saveGameProgress: () => Promise<void>;
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

  const startLevel = useCallback(
    (userId: string, level: Level) => {
      const newSession: GameSessionState = {
        userId,
        currentLevel: level,
        currentQuestion: 1,
        questions: {},
        totalScore: 0,
        questionsCompleted: 0,
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

      setGameSession(newSession);
    },
    []
  );

  const startQuestion = useCallback((questionId: number) => {
    setGameSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentQuestion: questionId,
        questionStartTime: Date.now(),
      };
    });
  }, []);

  const updatePromptCount = useCallback((count: number) => {
    setGameSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.questions[prev.currentQuestion].promptsUsed = count;
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
    let updatedSession: GameSessionState | null = null;
    
    setGameSession((prev) => {
      if (!prev) return prev;

      const currentQ = prev.questions[prev.currentQuestion];
      const timeSpent = Math.floor(
        (Date.now() - prev.questionStartTime) / 1000
      );

      const updated = { ...prev };
      updated.questions[prev.currentQuestion] = {
        ...currentQ,
        isCompleted: true,
        jailbroken,
        timeSpent,
      };
      updated.questionsCompleted += 1;

      // Calculate score: 100 base points, minus 10 per prompt used, bonus for speed
      const baseScore = 100;
      const promptPenalty = currentQ.promptsUsed * 10;
      const speedBonus = Math.max(0, 30 - Math.floor(timeSpent / 10));
      const questionScore = Math.max(0, baseScore - promptPenalty + speedBonus);

      updated.totalScore += questionScore;
      updatedSession = updated;

      return updated;
    });

    // Update main user profile for admin dashboard and save progress
    if (updatedSession) {
      try {
        // Get current user data to calculate cumulative totals
        const userRef = ref(database, `users/${updatedSession.userId}`);
        const userSnapshot = await get(userRef);
        const currentUserData = userSnapshot.exists() ? userSnapshot.val() : {};
        
        // Calculate cumulative totals (add to existing totals, not replace)
        const existingTotalScore = currentUserData.totalScore || 0;
        const existingQuestionsCompleted = currentUserData.questionsCompleted || 0;
        
        // Calculate this question's score
        const currentQ = updatedSession.questions[updatedSession.currentQuestion];
        const baseScore = 100;
        const promptPenalty = currentQ.promptsUsed * 10;
        const timeSpent = Math.floor(
          (Date.now() - updatedSession.questionStartTime) / 1000
        );
        const speedBonus = Math.max(0, 30 - Math.floor(timeSpent / 10));
        const questionScore = Math.max(0, baseScore - promptPenalty + speedBonus);
        
        // Update main user profile with cumulative totals (for admin dashboard)
        await update(userRef, {
          totalScore: existingTotalScore + questionScore,
          questionsCompleted: existingQuestionsCompleted + 1,
          levelCompleted: updatedSession.currentLevel,
        });
        
        // Also save progress to nested path (per-level data)
        const progressRef = ref(
          database,
          `users/${updatedSession.userId}/progress/${updatedSession.currentLevel}`
        );
        await update(progressRef, {
          currentQuestion: updatedSession.currentQuestion,
          totalScore: updatedSession.totalScore,
          questionsCompleted: updatedSession.questionsCompleted,
          lastUpdated: Date.now(),
          questions: updatedSession.questions,
        });
      } catch (error) {
        console.error("Error updating user profile:", error);
      }
    }
  }, []);

  const skipQuestion = useCallback(async () => {
    setGameSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.questions[prev.currentQuestion].isFailed = true;
      return updated;
    });

    await saveGameProgress();
  }, []);

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

  const saveGameProgress = useCallback(async () => {
    if (!gameSession) return;

    try {
      const userRef = ref(
        database,
        `users/${gameSession.userId}/progress/${gameSession.currentLevel}`
      );
      await update(userRef, {
        currentQuestion: gameSession.currentQuestion,
        totalScore: gameSession.totalScore,
        questionsCompleted: gameSession.questionsCompleted,
        lastUpdated: Date.now(),
        questions: gameSession.questions,
      });
    } catch (error) {
      console.error("Error saving game progress:", error);
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

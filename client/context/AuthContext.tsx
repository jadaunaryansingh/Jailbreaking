import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, database } from "@/services/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  User,
  AuthError,
} from "firebase/auth";
import { ref, get } from "firebase/database";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  currentLevel: number;
  currentQuestion: number;
  promptsUsed: number;
  totalScore: number;
  questionsCompleted: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user profile from database
        try {
          const userRef = ref(database, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setUserProfile({
              ...snapshot.val(),
              id: currentUser.uid,
            });
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const currentUser = userCredential.user;
      setUser(currentUser);

      // Initialize or fetch user profile
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setUserProfile({
          ...snapshot.val(),
          id: currentUser.uid,
        });
      } else {
        // Create new user profile
        const newProfile: UserProfile = {
          id: currentUser.uid,
          email: currentUser.email || email,
          name: email.split("@")[0],
          currentLevel: 1,
          currentQuestion: 1,
          promptsUsed: 0,
          totalScore: 0,
          questionsCompleted: 0,
        };
        setUserProfile(newProfile);
      }
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = "Login failed";

      if (authError.code === "auth/user-not-found") {
        errorMessage = "User not found";
      } else if (authError.code === "auth/wrong-password") {
        errorMessage = "Invalid password";
      } else if (authError.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (authError.code === "auth/user-disabled") {
        errorMessage = "User account is disabled";
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError("Logout failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

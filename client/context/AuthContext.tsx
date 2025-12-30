import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, database } from "@/services/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  User,
  AuthError,
} from "firebase/auth";
import { ref, get, set } from "firebase/database";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  currentLevel: number;
  currentQuestion: number;
  promptsUsed: number;
  totalScore: number;
  questionsCompleted: number;
  levelCompleted?: string;
  completionTime?: number;
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
          } else {
            const bootstrapProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email || "",
              name: (currentUser.email || "").split("@")[0] || "user",
              currentLevel: 1,
              currentQuestion: 1,
              promptsUsed: 0,
              totalScore: 0,
              questionsCompleted: 0,
              levelCompleted: "none",
              completionTime: 0,
            };
            try {
              await set(userRef, bootstrapProfile);
            } catch {}
            setUserProfile(bootstrapProfile);
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
          levelCompleted: "none",
          completionTime: 0,
        };
        try {
          await set(userRef, newProfile);
        } catch {}
        setUserProfile(newProfile);
      }
    } catch (err) {
      const authError = err as AuthError;
      console.error("Auth login error:", authError.code, authError.message);
      let errorMessage =
        authError.code === "auth/user-not-found"
          ? "User not found"
          : authError.code === "auth/wrong-password"
          ? "Invalid password"
          : authError.code === "auth/invalid-email"
          ? "Invalid email format"
          : authError.code === "auth/missing-email"
          ? "Email is required"
          : authError.code === "auth/missing-password"
          ? "Password is required"
          : authError.code === "auth/user-disabled"
          ? "User account is disabled"
          : authError.code === "auth/operation-not-allowed"
          ? "Email/password sign-in is disabled in Firebase"
          : authError.code === "auth/network-request-failed"
          ? "Network error. Check your connection"
          : authError.code === "auth/too-many-requests"
          ? "Too many attempts. Try again later"
          : authError.code === "auth/unauthorized-domain"
          ? "Unauthorized domain. Add localhost and your deploy domain in Firebase Auth settings"
          : authError.code === "auth/invalid-api-key"
          ? "Invalid API key. Check your Firebase env variables"
          : authError.code === "auth/app-not-authorized"
          ? "App not authorized for this project. Verify project IDs and domains"
          : authError.code === "auth/missing-recaptcha-token"
          ? "Verification required. Complete the security check and try again"
          : authError.code === "auth/invalid-recaptcha-token" ||
            authError.code === "auth/expired-recaptcha-token"
          ? "Security check failed. Refresh and try again"
          : authError.code === "auth/invalid-credential" ||
            authError.code === "auth/invalid-login-credentials"
          ? "Invalid email or password"
          : "Login failed"

      setError(errorMessage);
      throw new Error(errorMessage);
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

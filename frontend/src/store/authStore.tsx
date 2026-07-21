import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Profile } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserAndProfile = async () => {
    try {
      const userRes = await api.get("/auth/me");
      setUser(userRes.data);
      
      const profileRes = await api.get("/auth/me/profile");
      setProfile(profileRes.data);
    } catch (err) {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUserAndProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password, remember_me: rememberMe });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("refreshToken", refresh_token);
      await fetchUserAndProfile();
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const signup = async (email: string, fullName: string, password: string) => {
    setIsLoading(true);
    try {
      await api.post("/auth/signup", {
        email,
        full_name: fullName,
        password,
        role: "user",
        is_active: true,
        is_superuser: false
      });
      // Automatically login after signup
      await login(email, password);
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      const res = await api.put("/auth/me/profile", profileData);
      setProfile(res.data);
    } catch (err) {
      throw err;
    }
  };

  const reloadUser = async () => {
    await fetchUserAndProfile();
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        reloadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id?: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    full_name: string,
    company_name?: string,
    role?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper to set cookie client-side for middleware compatibility
function setCookie(name: string, value: string, days: number = 7) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem("access_token");
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        setAccessToken(storedToken);
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token invalid or expired
          localStorage.removeItem("access_token");
          deleteCookie("auth_token");
          setAccessToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Invalid email or password");
      }

      const data = await res.json();
      setAccessToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setCookie("auth_token", data.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    full_name: string,
    company_name?: string,
    role: string = "recruiter"
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name,
          company_name: company_name || undefined,
          role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      const data = await res.json();
      setAccessToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setCookie("auth_token", data.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("refresh_token");
      deleteCookie("auth_token");
      setAccessToken(null);
      setUser(null);
      router.push("/admin/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

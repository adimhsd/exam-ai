"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface UserProfile {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie Helpers for Vanilla JS Cookie Management
const setCookie = (name: string, value: string, days: number = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load credentials on startup
    const storedToken = getCookie("auth_token");
    const storedUserRaw = getCookie("user_profile");

    if (storedToken && storedUserRaw) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUserRaw));
      } catch (err) {
        console.error("Gagal memuat profil sesi:", err);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Gagal masuk. Periksa kembali email dan password.");
        return false;
      }

      const data = await res.json();
      const userProfile: UserProfile = {
        name: data.user_name,
        email: data.user_email,
        role: data.user_role,
      };

      // Simpan di Cookies agar bisa diakses oleh Middleware di Server Side
      setCookie("auth_token", data.access_token, 1);
      setCookie("user_profile", JSON.stringify(userProfile), 1);
      setCookie("user_role", data.user_role, 1); // Mempermudah middleware membaca role

      setToken(data.access_token);
      setUser(userProfile);

      // Redirect ke dasbor admin jika user adalah admin/dosen
      if (userProfile.role === "admin" || userProfile.role === "dosen") {
        router.push("/");
      } else {
        router.push("/submit");
      }
      return true;
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
      return false;
    }
  };

  const logout = () => {
    deleteCookie("auth_token");
    deleteCookie("user_profile");
    deleteCookie("user_role");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken = token || getCookie("auth_token");
    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }
    const res = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized globally
    if (res.status === 401) {
      logout();
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};

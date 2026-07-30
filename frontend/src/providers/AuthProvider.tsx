"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { authService } from "@/features/auth/auth.service";
import { listingService } from "@/services/listing.service";

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  user: AuthUser | null;
  hasListing: boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasListing, setHasListing] = useState(false);

  async function refreshAuth() {
    const token = localStorage.getItem("token");

    setIsAuthReady(false);
    setHasListing(false);
    setUser(null);
    setIsAuthenticated(false);

    if (!token) {
      setIsAuthReady(true);
      return;
    }

    try {
      const response = await authService.me();

      setUser(response.user);
      setIsAuthenticated(true);

      try {
        const listing = await listingService.getMyListing();

        setHasListing(Boolean(listing?.id));
      } catch {
        setHasListing(false);
      }
    } catch {
      localStorage.removeItem("token");

      setIsAuthenticated(false);
      setUser(null);
      setHasListing(false);
    } finally {
      setIsAuthReady(true);
    }
  }

  useEffect(() => {
    refreshAuth();
  }, []);

  function logout() {
    authService.logout();

    setIsAuthenticated(false);
    setUser(null);
    setHasListing(false);
    setIsAuthReady(true);

    window.location.href = "/";
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthReady,
        user,
        hasListing,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }

  return context;
}


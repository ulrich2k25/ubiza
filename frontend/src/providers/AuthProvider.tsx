"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  isAdmin: boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasListing, setHasListing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function refreshAuth(): Promise<void> {
    const token = localStorage.getItem("token");

    setIsAuthReady(false);
    setIsAuthenticated(false);
    setUser(null);
    setHasListing(false);
    setIsAdmin(false);

    if (!token) {
      setIsAuthReady(true);
      return;
    }

    try {
      const authenticatedUser = await authService.me();

      setUser(authenticatedUser);
      setIsAuthenticated(true);
      setIsAdmin(authenticatedUser.role === "ADMIN");

      try {
        const listing = await listingService.getMyListing();
        setHasListing(Boolean(listing));
      } catch {
        setHasListing(false);
      }
    } catch {
      localStorage.removeItem("token");

      setUser(null);
      setIsAuthenticated(false);
      setHasListing(false);
      setIsAdmin(false);
    } finally {
      setIsAuthReady(true);
    }
  }

  function logout(): void {
    localStorage.removeItem("token");

    setUser(null);
    setIsAuthenticated(false);
    setHasListing(false);
    setIsAdmin(false);
    setIsAuthReady(true);
  }

  useEffect(() => {
    void refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthReady,
        user,
        hasListing,
        isAdmin,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  }

  return context;
}

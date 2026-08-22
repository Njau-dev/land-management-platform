"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  refreshAccessToken,
  registerAuthLifecycle,
  setApiAccessToken,
} from "@/lib/api-client";

import {
  adminLoginRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  signupRequest,
} from "./auth.api";
import { AuthContext } from "./auth-context";
import type {
  AuthContextValue,
  LoginInput,
  SignupInput,
  User,
} from "./auth.types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitialized = useRef(false);

  const clearSession = useCallback(() => {
    setApiAccessToken(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((nextUser: User, token: string) => {
    setApiAccessToken(token);
    setAccessToken(token);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const unregister = registerAuthLifecycle({
      onAccessToken: setAccessToken,
      onSessionExpired: clearSession,
    });

    if (!hasInitialized.current) {
      hasInitialized.current = true;

      void (async () => {
        try {
          const restoredToken = await refreshAccessToken();

          if (restoredToken) {
            const response = await meRequest(false);
            setUser(response.user);
          }
        } catch {
          clearSession();
        } finally {
          setIsInitializing(false);
        }
      })();
    }

    return unregister;
  }, [clearSession]);

  const signup = useCallback(
    async (input: SignupInput) => {
      const response = await signupRequest(input);
      applySession(response.user, response.accessToken);
      return response.user;
    },
    [applySession],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      applySession(response.user, response.accessToken);
      return response.user;
    },
    [applySession],
  );

  const adminLogin = useCallback(
    async (input: LoginInput) => {
      const response = await adminLoginRequest(input);
      applySession(response.user, response.accessToken);
      return response.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const destination = user?.role === "ADMIN" ? "/admin/login" : "/login";

    try {
      await logoutRequest();
    } catch {
      // Local state must still be cleared if the API is temporarily unavailable.
    } finally {
      clearSession();
      router.replace(destination);
    }
  }, [clearSession, router, user?.role]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await meRequest();
      setUser(response.user);
      return response.user;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isInitializing,
      signup,
      login,
      adminLogin,
      logout,
      refreshUser,
    }),
    [
      accessToken,
      adminLogin,
      isInitializing,
      login,
      logout,
      refreshUser,
      signup,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

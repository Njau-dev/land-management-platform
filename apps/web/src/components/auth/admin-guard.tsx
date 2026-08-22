"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/use-auth";

import { AuthLoading } from "./auth-loading";

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, user } = useAuth();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/admin/login");
      return;
    }

    if (user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isInitializing, router, user?.role]);

  if (isInitializing) {
    return <AuthLoading />;
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return <AuthLoading label="Checking administrator access…" />;
  }

  return children;
}

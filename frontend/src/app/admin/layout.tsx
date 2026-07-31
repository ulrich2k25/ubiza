"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/providers/AuthProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login?returnUrl=/admin");
      return;
    }

    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isAuthReady, isAdmin, router]);

  if (!isAuthReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-5 text-white">
        <p className="text-sm text-zinc-400">
          Vérification de l’accès administrateur...
        </p>
      </main>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-5 text-white">
        <p className="text-sm text-zinc-400">Redirection...</p>
      </main>
    );
  }

  function handleLogout(): void {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-black tracking-tight">
              <span className="text-white">Ubi</span>
              <span className="text-fuchsia-500">za</span>
              <span className="ml-2 text-sm font-semibold text-zinc-400">
                Admin
              </span>
            </Link>

            <nav className="hidden items-center gap-2 sm:flex">
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                Accueil
              </Link>

              <Link
                href="/admin/ambassadors"
                className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                Ambassadeurs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            >
              Dashboard
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-5 py-3 sm:hidden">
          <Link
            href="/admin"
            className="whitespace-nowrap rounded-lg bg-white/5 px-3 py-2 text-sm"
          >
            Accueil
          </Link>

          <Link
            href="/admin/ambassadors"
            className="whitespace-nowrap rounded-lg bg-white/5 px-3 py-2 text-sm"
          >
            Ambassadeurs
          </Link>
        </nav>
      </header>

      {children}
    </div>
  );
}

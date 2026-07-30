"use client";

import Link from "next/link";

import { useAuth } from "@/providers/AuthProvider";

export default function HomeNavbar() {
  const { isAuthenticated, hasListing, logout } = useAuth();

  const publishHref =
    isAuthenticated && hasListing ? "/dashboard" : "/dashboard/listing";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-white">Ubi</span>
          <span className="text-fuchsia-500">za</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          <a href="#creators" className="transition hover:text-white">
            Découvrir
          </a>

          <a href="#cities" className="transition hover:text-white">
            Villes
          </a>

          <Link href={publishHref} className="transition hover:text-white">
            Publier une annonce
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <>
              <Link
                href="/login"
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-white/10
                "
              >
                Connexion
              </Link>

              <Link
                href="/register"
                className="
                  rounded-xl
                  bg-fuchsia-600
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-fuchsia-500
                "
              >
                Créer un compte
              </Link>
            </>
          )}

          {isAuthenticated && !hasListing && (
            <button
              type="button"
              onClick={logout}
              className="
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-4
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-white/10
              "
            >
              Déconnexion
            </button>
          )}

          {isAuthenticated && hasListing && (
            <>
              <Link
                href="/dashboard"
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-white/10
                "
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={logout}
                className="
                  rounded-xl
                  bg-fuchsia-600
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-fuchsia-500
                "
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


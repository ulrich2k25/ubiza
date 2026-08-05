"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/providers/AuthProvider";

export default function HomeNavbar() {
  const { isAuthenticated, hasListing, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publishHref =
    isAuthenticated && hasListing ? "/dashboard" : "/dashboard/listing";

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight">
          <span className="text-white">Ubi</span>
          <span className="text-fuchsia-500">za</span>
        </Link>

        {/* Navigation ordinateur */}
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

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated && (
            <>
              <Link
                href="/login"
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-white/10
                  sm:px-4
                "
              >
                Connexion
              </Link>

              <Link
                href="/register"
                className="
                  rounded-xl
                  bg-fuchsia-600
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-fuchsia-500
                  sm:px-4
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
                px-3
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-white/10
                sm:px-4
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
                  hidden
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
                  sm:inline-flex
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
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-fuchsia-500
                  sm:px-4
                "
              >
                Déconnexion
              </button>
            </>
          )}

          {/* Bouton menu téléphone uniquement */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-label="Ouvrir le menu"
            aria-expanded={isMobileMenuOpen}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/5
              text-xl
              text-white
              transition
              hover:bg-white/10
              md:hidden
            "
          >
            {isMobileMenuOpen ? "×" : "☰"}
          </button>
        </div>

        {/* Menu déroulant téléphone */}
        {isMobileMenuOpen && (
          <nav
            className="
              absolute
              left-5
              right-5
              top-[calc(100%+0.75rem)]
              overflow-hidden
              rounded-2xl
              border
              border-white/10
              bg-zinc-950/95
              p-2
              text-sm
              text-white
              shadow-2xl
              backdrop-blur-xl
              md:hidden
            "
          >
            <a
              href="#creators"
              onClick={closeMobileMenu}
              className="block rounded-xl px-4 py-3 transition hover:bg-white/10"
            >
              Découvrir
            </a>

            <a
              href="#cities"
              onClick={closeMobileMenu}
              className="block rounded-xl px-4 py-3 transition hover:bg-white/10"
            >
              Villes
            </a>

            <Link
              href={publishHref}
              onClick={closeMobileMenu}
              className="block rounded-xl px-4 py-3 transition hover:bg-white/10"
            >
              Publier une annonce
            </Link>

            {isAuthenticated && hasListing && (
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="block rounded-xl px-4 py-3 transition hover:bg-white/10 sm:hidden"
              >
                Dashboard
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

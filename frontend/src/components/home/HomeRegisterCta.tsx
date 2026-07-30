"use client";

import Link from "next/link";

import { useAuth } from "@/providers/AuthProvider";

export default function HomeRegisterCta() {
  const { isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady || isAuthenticated) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-zinc-950 to-black p-8 text-center sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-400">
          Rejoignez la communautÃ©
        </p>

        <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
          Rejoins Ubiza aujourd&apos;hui
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-zinc-400">
          DÃ©couvre des profils, crÃ©e ton compte et profite d&apos;une expÃ©rience
          simple et sÃ©curisÃ©e.
        </p>

        <Link
          href="/register"
          className="mt-8 inline-flex rounded-2xl bg-fuchsia-600 px-8 py-4 font-bold text-white transition hover:bg-fuchsia-500"
        >
          CrÃ©er un compte gratuitement
        </Link>
      </div>
    </section>
  );
}


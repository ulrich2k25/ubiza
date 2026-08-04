"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const [message, setMessage] = useState("Vérification en cours...");
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      const timer = window.setTimeout(() => {
        setError(true);
        setMessage("Lien de vérification invalide.");
      }, 0);

      return () => window.clearTimeout(timer);
    }

    authService
      .verifyEmail(token)
      .then((response) => {
        setMessage(response.message);
      })
      .catch(() => {
        setError(true);
        setMessage("Le lien est invalide ou a expiré.");
      });
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
      <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">
          Vérification de votre adresse e-mail
        </h1>

        <p className={`mt-6 ${error ? "text-red-400" : "text-emerald-400"}`}>
          {message}
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-white">
          Vérification...
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

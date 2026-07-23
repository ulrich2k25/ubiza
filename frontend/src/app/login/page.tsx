"use client";

import { useState } from "react";
import { authService } from "@/features/auth/auth.service";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");

      await authService.login({
        email,
        password,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 p-6 border rounded-lg"
      >
        <h1 className="text-2xl font-bold">Connexion Ubiza</h1>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded"
        >
          Se connecter
        </button>
      </form>
    </main>
  );
}

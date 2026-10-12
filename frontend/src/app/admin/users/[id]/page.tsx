"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminUserService, type AdminUser } from "@/services/admin-user.service";

function dateLabel(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUser(await adminUserService.get(id));
    } catch (cause) {
      setUser(null);
      setError(cause instanceof Error ? cause.message : "Impossible de charger le compte.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function changeStatus(action: "suspend" | "reactivate") {
    if (!user || user.role !== "USER" || user.deletedAt) return;
    const verb = action === "suspend" ? "Suspendre" : "Réactiver";
    if (!window.confirm(`${verb} le compte de ${user.profile?.displayName || user.email} ?`)) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const updated = action === "suspend"
        ? await adminUserService.suspend(id)
        : await adminUserService.reactivate(id);
      setUser(updated);
      setSuccess(action === "suspend" ? "Compte suspendu." : "Compte réactivé.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <Link href="/admin/users" className="text-sm font-semibold text-fuchsia-400 hover:text-fuchsia-300">← Retour aux utilisateurs</Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400">Administration · Utilisateur</p>
          <h1 className="mt-2 text-3xl font-black">Détails du compte</h1>
        </div>
        <button type="button" disabled={loading || busy} onClick={() => void load()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold disabled:opacity-40">Actualiser</button>
      </div>
      {error ? <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
      {success ? <p role="status" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{success}</p> : null}
      {loading ? <p className="mt-8 text-zinc-400">Chargement...</p> : user ? (
        <>
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold">{user.profile?.displayName || user.profile?.username || user.email}</h2>
                {user.profile?.username ? <p className="mt-1 text-sm text-zinc-400">@{user.profile.username}</p> : null}
                <p className="mt-1 break-all text-sm text-zinc-400">{user.email}</p></div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold">{user.status}</span>
            </div>
            <dl className="mt-7 grid gap-5 sm:grid-cols-2">
              {([
                ["Identifiant", user.id],
                ["Rôle", user.role === "ADMIN" ? "Administrateur" : "Utilisateur"],
                ["Email vérifié", dateLabel(user.emailVerifiedAt)],
                ["Téléphone vérifié", dateLabel(user.phoneVerifiedAt)],
                ["Dernière connexion", dateLabel(user.lastLoginAt)],
                ["Inscription", dateLabel(user.createdAt)],
                ["Premium jusqu'au", dateLabel(user.premiumActiveUntil)],
                ["Score de confiance", String(user.trustScore ?? "—")],
                ["Niveau de confiance", user.trustLevel ?? "—"],
                ["Ambassadeur", user.ambassador ? user.ambassador.status : "Non"],
                ["Suppression", dateLabel(user.deletedAt)],
              ] as Array<[string, string]>).map(([label, value]) => (
                <div key={label} className="min-w-0 border-b border-white/10 pb-3">
                  <dt className="text-xs font-semibold text-zinc-500">{label}</dt>
                  <dd className="mt-1 break-all text-sm text-white">{value}</dd>
                </div>
              ))}
            </dl>
            {user.role === "USER" && !user.deletedAt ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {user.status === "ACTIVE" ? (
                  <button type="button" disabled={busy} onClick={() => void changeStatus("suspend")}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 disabled:opacity-40">{busy ? "Traitement..." : "Suspendre le compte"}</button>
                ) : null}
                {user.status === "SUSPENDED" ? (
                  <button type="button" disabled={busy} onClick={() => void changeStatus("reactivate")}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 disabled:opacity-40">{busy ? "Traitement..." : "Réactiver le compte"}</button>
                ) : null}
              </div>
            ) : null}
          </section>
        </>
      ) : !error ? <p className="mt-8 text-zinc-400">Utilisateur introuvable.</p> : null}
    </main>
  );
}

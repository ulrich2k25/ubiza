"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  adminUserService,
  type AdminUser,
  type AdminUserRole,
  type AdminUserStatistics,
  type AdminUserStatus,
} from "@/services/admin-user.service";

type StatusFilter = "ALL" | AdminUserStatus;
type RoleFilter = "ALL" | AdminUserRole;
const PAGE_SIZE = 20;
const statusLabels: Record<AdminUserStatus, string> = {
  ACTIVE: "Actif",
  PENDING_VERIFICATION: "À vérifier",
  SUSPENDED: "Suspendu",
  DELETED: "Supprimé",
};
const statusColors: Record<AdminUserStatus, string> = {
  ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  PENDING_VERIFICATION: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  SUSPENDED: "border-red-500/30 bg-red-500/10 text-red-300",
  DELETED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

function displayName(user: AdminUser): string {
  return user.profile?.displayName || user.profile?.username || user.email;
}
function dateLabel(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}
function isPremium(user: AdminUser): boolean {
  return Boolean(user.premiumActiveUntil && new Date(user.premiumActiveUntil).getTime() > Date.now());
}
function StatusBadge({ status }: { status: AdminUserStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function UserActions({
  user, busyId, onChange,
}: {
  user: AdminUser;
  busyId: string | null;
  onChange: (user: AdminUser, action: "suspend" | "reactivate") => Promise<void>;
}) {
  if (user.role !== "USER" || user.deletedAt) return null;
  const action = user.status === "ACTIVE" ? "suspend" : user.status === "SUSPENDED" ? "reactivate" : null;
  if (!action) return null;
  return (
    <button
      type="button"
      disabled={busyId !== null}
      onClick={() => void onChange(user, action)}
      className={`rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        action === "suspend"
          ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      }`}
    >
      {busyId === user.id ? "Traitement..." : action === "suspend" ? "Suspendre" : "Réactiver"}
    </button>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminUserStatistics | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const requestIdRef = useRef(0);

  const loadUsers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await adminUserService.list({
        page,
        limit: PAGE_SIZE,
        search,
        status: status === "ALL" ? undefined : status,
        role: role === "ALL" ? undefined : role,
      });
      if (requestId !== requestIdRef.current) return;
      setUsers(response.value);
      setTotal(response.Count);
      setTotalPages(Math.max(1, response.totalPages));
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : "Impossible de charger les utilisateurs.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, search, status, role]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminUserService.statistics());
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 300);
    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStats(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStats]);

  async function changeStatus(user: AdminUser, action: "suspend" | "reactivate") {
    const verb = action === "suspend" ? "Suspendre" : "Réactiver";
    if (!window.confirm(`${verb} le compte de ${displayName(user)} ?`)) return;
    setBusyId(user.id);
    setError("");
    setSuccess("");
    try {
      if (action === "suspend") await adminUserService.suspend(user.id);
      else await adminUserService.reactivate(user.id);
      await Promise.all([loadUsers(), loadStats()]);
      setSuccess(`Compte ${action === "suspend" ? "suspendu" : "réactivé"} avec succès.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-400">Administration</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Gestion des utilisateurs</h1>
          <p className="mt-3 text-sm text-zinc-400">Comptes, statuts et modération de la plateforme.</p>
        </div>
        <button
          type="button" onClick={() => { void loadUsers(); void loadStats(); }}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-40"
        >Actualiser</button>
      </div>

      <section aria-label="Statistiques des utilisateurs" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {([
          ["Total", stats?.total], ["Actifs", stats?.active],
          ["Suspendus", stats?.suspended], ["À vérifier", stats?.pendingVerification],
          ["Supprimés", stats?.deleted], ["Premium actifs", stats?.premiumActive],
          ["Ambassadeurs", stats?.ambassadors],
        ] as Array<[string, number | undefined]>).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">{label}</p>
            <p className="mt-2 text-2xl font-black">{value ?? "—"}</p>
          </div>
        ))}
      </section>

      <section className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-3">
        <label className="text-xs font-semibold text-zinc-400">
          Rechercher
          <input
            type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Email, pseudo ou nom"
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500"
          />
        </label>
        <label className="text-xs font-semibold text-zinc-400">
          Statut
          <select value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500">
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="PENDING_VERIFICATION">En attente de vérification</option>
            <option value="SUSPENDED">Suspendus</option>
            <option value="DELETED">Supprimés</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-zinc-400">
          Rôle
          <select value={role} onChange={(event) => { setRole(event.target.value as RoleFilter); setPage(1); }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500">
            <option value="ALL">Tous les rôles</option>
            <option value="USER">Utilisateurs</option>
            <option value="ADMIN">Administrateurs</option>
          </select>
        </label>
      </section>

      {error ? <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}
      {success ? <p role="status" className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{success}</p> : null}

      <section className="mt-7">
        {loading ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center text-zinc-400">Chargement des utilisateurs...</div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center text-zinc-400">Aucun utilisateur trouvé.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-white/10 lg:block">
              <table className="w-full min-w-[860px] text-left">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-zinc-400">
                  <tr><th className="px-5 py-4">Utilisateur</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Rôle</th><th className="px-5 py-4">Premium</th><th className="px-5 py-4">Inscription</th><th className="px-5 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.035]">
                      <td className="max-w-[260px] px-5 py-4">
                        <p className="truncate font-bold">{displayName(user)}</p>
                        {user.profile?.username ? <p className="truncate text-xs text-zinc-400">@{user.profile.username}</p> : null}
                        <p className="truncate text-xs text-zinc-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                      <td className="px-5 py-4 text-sm text-zinc-300">{user.role === "ADMIN" ? "Admin" : "Utilisateur"}</td>
                      <td className="px-5 py-4 text-sm text-zinc-300">{isPremium(user) ? "Actif" : "—"}</td>
                      <td className="px-5 py-4 text-sm text-zinc-400">{dateLabel(user.createdAt)}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2">
                        <Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10">Voir</Link>
                        <UserActions user={user} busyId={busyId} onChange={changeStatus} />
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 lg:hidden">
              {users.map((user) => (
                <article key={user.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0"><p className="break-words font-bold">{displayName(user)}</p>
                      {user.profile?.username ? <p className="text-xs text-zinc-400">@{user.profile.username}</p> : null}
                      <p className="break-all text-xs text-zinc-500">{user.email}</p></div>
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-400">
                    <p>Rôle : <span className="text-white">{user.role === "ADMIN" ? "Admin" : "Utilisateur"}</span></p>
                    <p>Premium : <span className="text-white">{isPremium(user) ? "Actif" : "Non"}</span></p>
                    <p>Inscription : <span className="text-white">{dateLabel(user.createdAt)}</span></p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold">Voir les détails</Link>
                    <UserActions user={user} busyId={busyId} onChange={changeStatus} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
        <p>{total} utilisateur{total > 1 ? "s" : ""} · Page {page} sur {totalPages}</p>
        <div className="flex gap-2">
          <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white disabled:opacity-40">Précédent</button>
          <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white disabled:opacity-40">Suivant</button>
        </div>
      </footer>
    </main>
  );
}

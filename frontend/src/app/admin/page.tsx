import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white">
          Tableau de bord Admin
        </h1>

        <p className="mt-3 text-zinc-400">
          Gérez les utilisateurs, les ambassadeurs et la plateforme Ubiza.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/admin/ambassadors"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-fuchsia-500 hover:bg-white/10"
        >
          <div className="text-5xl">🤝</div>

          <h2 className="mt-5 text-xl font-bold">Ambassadeurs</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Valider, refuser, suspendre ou réactiver les ambassadeurs.
          </p>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="text-5xl">👥</div>

          <h2 className="mt-5 text-xl font-bold">Utilisateurs</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Disponible prochainement.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="text-5xl">📢</div>

          <h2 className="mt-5 text-xl font-bold">Signalements</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Disponible prochainement.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="text-5xl">💎</div>

          <h2 className="mt-5 text-xl font-bold">Premium</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Disponible prochainement.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="text-5xl">📊</div>

          <h2 className="mt-5 text-xl font-bold">Statistiques</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Disponible prochainement.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="text-5xl">⚙️</div>

          <h2 className="mt-5 text-xl font-bold">Paramètres</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Disponible prochainement.
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

export default function PublicProfileTrust() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-xl font-semibold text-white">
        Pourquoi faire confiance à ce profil ?
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-2xl">✓</div>
          <p className="mt-2 font-medium text-white">Profil vérifié</p>
          <p className="mt-1 text-sm text-zinc-400">
            Les informations du profil ont été contrôlées.
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-2xl">🛡️</div>
          <p className="mt-2 font-medium text-white">Sécurité Ubiza</p>
          <p className="mt-1 text-sm text-zinc-400">
            Les contacts sont protégés pour la sécurité des créatrices.
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-2xl">📸</div>
          <p className="mt-2 font-medium text-white">Photos publiques</p>
          <p className="mt-1 text-sm text-zinc-400">
            Les photos visibles respectent les règles Ubiza.
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-2xl">⭐</div>
          <p className="mt-2 font-medium text-white">Réputation</p>
          <p className="mt-1 text-sm text-zinc-400">
            Les interactions futures amélioreront la confiance.
          </p>
        </div>
      </div>
    </section>
  );
}

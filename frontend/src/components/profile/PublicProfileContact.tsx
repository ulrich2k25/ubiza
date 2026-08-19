"use client";

import { useState } from "react";

import {
  getProfileContact,
  type ProfileContact,
} from "@/services/profile.service";

interface PublicProfileContactProps {
  username: string;
  displayName?: string | null;
}

export default function PublicProfileContact({
  username,
  displayName,
}: PublicProfileContactProps) {
  const [contact, setContact] = useState<ProfileContact | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileName = displayName || username;

  async function handleContact() {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getProfileContact(username);

      setContact(data);
      setShowContact(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les coordonnées.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!showContact) {
    return (
      <section className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-zinc-950 to-black p-6 sm:p-8">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleContact}
            disabled={isLoading}
            className="w-full rounded-xl bg-fuchsia-600 px-8 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isLoading ? "Chargement..." : "Contacter"}
          </button>

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </div>
      </section>
    );
  }

  const phone = contact?.phone ?? null;
  const whatsapp = contact?.whatsapp ?? null;
  const telegram = contact?.telegram ?? null;

  const hasContact = Boolean(phone || whatsapp || telegram);

  return (
    <section className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-zinc-950 to-black p-6 sm:p-8">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Contacter {profileName}
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Choisissez un moyen de contact
        </p>
      </div>

      {hasContact ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 transition hover:bg-emerald-500/20"
            >
              <p className="font-semibold text-white">🟢 WhatsApp</p>

              <p className="mt-1 text-sm text-zinc-400">
                Discuter sur WhatsApp
              </p>
            </a>
          ) : null}

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <p className="font-semibold text-white">📞 Téléphone</p>

              <p className="mt-1 text-sm text-zinc-400">{phone}</p>
            </a>
          ) : null}

          {telegram ? (
            <a
              href={`https://t.me/${telegram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 transition hover:bg-sky-500/20"
            >
              <p className="font-semibold text-white">✈️ Telegram</p>

              <p className="mt-1 text-sm text-zinc-400">
                {telegram.startsWith("@") ? telegram : `@${telegram}`}
              </p>
            </a>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-400">
          Aucun moyen de contact n’a encore été renseigné.
        </p>
      )}
    </section>
  );
}

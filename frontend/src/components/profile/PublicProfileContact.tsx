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

  const contactMessage = `Salut ${profileName} 👋 J’ai vu ton annonce sur Ubiza et j’aimerais te rencontrer. Quand serais-tu disponible ?`;

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
        <div className="flex flex-col items-center justify-center">
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

  const cleanPhone = phone?.replace(/\s/g, "") ?? "";
  const cleanWhatsapp = whatsapp?.replace(/\D/g, "") ?? "";
  const cleanTelegram = telegram?.replace(/^@/, "") ?? "";

  const encodedMessage = encodeURIComponent(contactMessage);

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
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {whatsapp ? (
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodedMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 transition hover:bg-emerald-500/20"
            >
              <p className="font-semibold text-white">🟢 WhatsApp</p>

              <p className="mt-1 text-sm text-zinc-400">Envoyer un message</p>
            </a>
          ) : null}

          {phone ? (
            <a
              href={`tel:${cleanPhone}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <p className="font-semibold text-white">📞 Téléphone</p>

              <p className="mt-1 text-sm text-zinc-400">{phone}</p>
            </a>
          ) : null}

          {phone ? (
            <a
              href={`sms:${cleanPhone}?body=${encodedMessage}`}
              className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5 transition hover:bg-violet-500/20"
            >
              <p className="font-semibold text-white">💬 SMS</p>

              <p className="mt-1 text-sm text-zinc-400">Envoyer un message</p>
            </a>
          ) : null}

          {telegram ? (
            <a
              href={`https://t.me/${cleanTelegram}?text=${encodedMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 transition hover:bg-sky-500/20"
            >
              <p className="font-semibold text-white">✈️ Telegram</p>

              <p className="mt-1 text-sm text-zinc-400">Envoyer un message</p>
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

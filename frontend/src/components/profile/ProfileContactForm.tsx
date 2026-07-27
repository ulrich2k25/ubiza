"use client";

import { FormEvent, useState } from "react";

import {
  type ProfileContact,
  profileService,
} from "@/services/profile.service";

interface ProfileContactFormProps {
  initialContact: ProfileContact;
  onCancel: () => void;
  onSaved: (contact: ProfileContact) => void;
}

export default function ProfileContactForm({
  initialContact,
  onCancel,
  onSaved,
}: ProfileContactFormProps) {
  const [phone, setPhone] = useState(initialContact.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initialContact.whatsapp ?? "");
  const [telegram, setTelegram] = useState(initialContact.telegram ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const updatedContact = await profileService.updateMyContact({
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        telegram: telegram.trim() || null,
      });

      onSaved(updatedContact);
      setSuccess("Coordonnées enregistrées avec succès.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer les coordonnées.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-5 border-t border-white/10 pt-6"
    >
      <div>
        <h3 className="text-lg font-semibold">Mes coordonnées</h3>

        <p className="mt-1 text-sm leading-6 text-zinc-400">
          Ces informations permettent aux visiteurs connectés de vous contacter.
        </p>
      </div>

      <ContactInput
        id="phone"
        label="Téléphone"
        type="tel"
        placeholder="+237 6 00 00 00 00"
        value={phone}
        onChange={setPhone}
      />

      <ContactInput
        id="whatsapp"
        label="WhatsApp"
        type="tel"
        placeholder="+237 6 00 00 00 00"
        value={whatsapp}
        onChange={setWhatsapp}
      />

      <ContactInput
        id="telegram"
        label="Telegram"
        type="text"
        placeholder="@votre_pseudo"
        value={telegram}
        onChange={setTelegram}
      />

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

interface ContactInputProps {
  id: string;
  label: string;
  type: "text" | "tel";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function ContactInput({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
}: ContactInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/10"
      />
    </div>
  );
}

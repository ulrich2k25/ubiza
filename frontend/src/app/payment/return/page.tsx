"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { paymentsService, type Payment } from "@/services/payments.service";

const PENDING_PAYMENT_STORAGE_KEY = "ubiza_pending_payment_id";
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 45;

type ReturnState = "checking" | "success" | "failed" | "pending" | "missing";

export default function PaymentReturnPage() {
  const [state, setState] = useState<ReturnState>("checking");
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    async function checkPayment() {
      const paymentId = window.localStorage.getItem(
        PENDING_PAYMENT_STORAGE_KEY,
      );

      if (!paymentId) {
        if (!cancelled) {
          setState("missing");
        }
        return;
      }

      try {
        const currentPayment = await paymentsService.getOne(paymentId);

        if (cancelled) {
          return;
        }

        setPayment(currentPayment);

        if (currentPayment.status === "SUCCESS") {
          window.localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
          setState("success");
          return;
        }

        if (
          currentPayment.status === "FAILED" ||
          currentPayment.status === "CANCELLED" ||
          currentPayment.status === "EXPIRED"
        ) {
          window.localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
          setState("failed");
          return;
        }
      } catch {
        // Le webhook reste la source de vérité. Une erreur temporaire de lecture
        // ne doit pas transformer un paiement en échec.
      }

      attempts += 1;

      if (attempts >= MAX_POLL_ATTEMPTS) {
        setState("pending");
        return;
      }

      timer = window.setTimeout(() => {
        void checkPayment();
      }, POLL_INTERVAL_MS);
    }

    timer = window.setTimeout(() => {
      void checkPayment();
    }, 0);

    return () => {
      cancelled = true;

      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          {state === "checking" && <CheckingState />}

          {state === "success" && <SuccessState payment={payment} />}

          {state === "failed" && <FailedState payment={payment} />}

          {state === "pending" && <PendingState />}

          {state === "missing" && <MissingState />}
        </section>
      </div>
    </main>
  );
}

function CheckingState() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-300">
        <LoaderCircle className="animate-spin" size={26} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Confirmation du paiement</h1>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Nous vérifions la confirmation sécurisée de votre paiement. Cette étape
        peut prendre quelques secondes.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
        <Clock3 size={14} />
        Ne fermez pas cette page pendant la vérification.
      </div>
    </div>
  );
}

function SuccessState({ payment }: { payment: Payment | null }) {
  const product = payment?.purpose === "BOOST" ? "Boost" : "Premium";

  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
        <CheckCircle2 size={28} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Paiement confirmé</h1>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Votre paiement a bien été confirmé. Votre {product} est maintenant actif
        sur Ubiza.
      </p>

      <Link
        href="/dashboard"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Retour au tableau de bord
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function FailedState({ payment }: { payment: Payment | null }) {
  const message =
    payment?.failureReason?.trim() ||
    "Le paiement n’a pas pu être confirmé. Aucun avantage payant n’a été activé.";

  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300">
        <CircleAlert size={28} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Paiement non confirmé</h1>

      <p className="mt-3 text-sm leading-6 text-zinc-400">{message}</p>

      <Link
        href="/dashboard"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
      >
        Retour au tableau de bord
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function PendingState() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/20 bg-amber-500/10 text-amber-300">
        <Clock3 size={27} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Confirmation en cours</h1>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Nous n’avons pas encore reçu la confirmation finale. Votre paiement
        continue d’être traité automatiquement ; vous n’avez pas besoin de payer
        une seconde fois.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white transition hover:opacity-90"
      >
        <RefreshCw size={16} />
        Vérifier à nouveau
      </button>

      <Link
        href="/dashboard"
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}

function MissingState() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300">
        <CircleAlert size={26} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">
        Paiement en cours de traitement
      </h1>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Nous ne pouvons pas identifier automatiquement la transaction dans ce
        navigateur. Si vous avez effectué le paiement, sa confirmation reste
        traitée automatiquement par Ubiza.
      </p>

      <Link
        href="/dashboard"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Retour au tableau de bord
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

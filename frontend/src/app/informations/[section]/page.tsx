import Link from "next/link";
import { notFound } from "next/navigation";

const sections = {
  "a-propos": {
    title: "À propos",
    content: (
      <>
        <p>
          Ubiza est une plateforme moderne permettant aux créatrices de publier
          leurs annonces et aux visiteurs de découvrir des profils dans
          différentes villes du Cameroun.
        </p>

        <p>
          Notre objectif est de proposer une expérience simple, discrète et
          accessible, tout en donnant aux créatrices des outils pour améliorer
          leur visibilité.
        </p>

        <p>
          Ubiza ne propose pas de messagerie interne. Les contacts se font
          directement à partir des coordonnées renseignées sur les profils.
        </p>
      </>
    ),
  },

  contact: {
    title: "Nous contacter",
    content: (
      <>
        <p>
          Une question, un problème ou une suggestion ? Notre équipe est
          disponible pour vous accompagner. Choisissez le moyen de contact qui
          vous convient le mieux.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <ContactCard
            icon="💬"
            title="Telegram"
            description="Le moyen le plus rapide pour joindre l’équipe Ubiza."
            detail="@MSR_prono"
            href="https://t.me/MSR_prono"
            actionLabel="Ouvrir Telegram"
          />

          <ContactCard
            icon="🟢"
            title="WhatsApp"
            description="Discutez directement avec notre support."
            detail="+1 360 925 0217"
            href="https://wa.me/13609250217"
            actionLabel="Ouvrir WhatsApp"
          />

          <ContactCard
            icon="✉️"
            title="E-mail"
            description="Pour les demandes détaillées ou les signalements."
            detail="notification.service.ttiktok@gmail.com"
            href="mailto:notification.service.ttiktok@gmail.com"
            actionLabel="Envoyer un e-mail"
          />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-xl">
              🕘
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">
              Horaires du support
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Lundi – Vendredi
            </p>

            <p className="mt-1 font-semibold text-zinc-200">
              09h00 – 18h00 (UTC+1)
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Nous répondons généralement dans un délai de 24 heures.
            </p>
          </div>
        </div>
      </>
    ),
  },

  faq: {
    title: "FAQ",
    content: (
      <div className="space-y-4">
        <FaqItem
          question="Comment publier une annonce ?"
          answer="Créez un compte, complétez votre profil, ajoutez vos photos puis publiez votre annonce depuis votre tableau de bord."
        />

        <FaqItem
          question="La publication est-elle gratuite ?"
          answer="Oui. La publication de base est gratuite. Les options Premium et Boost permettent d’améliorer la visibilité."
        />

        <FaqItem
          question="Comment obtenir le badge vérifié ?"
          answer="Le badge est attribué automatiquement lorsque l’adresse e-mail est vérifiée, qu’un contact est ajouté et qu’une annonce est publiée."
        />

        <FaqItem
          question="Comment fonctionne un Boost ?"
          answer="Un Boost met temporairement votre annonce davantage en avant."
        />

        <FaqItem
          question="Comment fonctionne Premium ?"
          answer="Premium améliore la visibilité du profil et lui donne une priorité supplémentaire."
        />
      </div>
    ),
  },

  conditions: {
    title: "Conditions d’utilisation",
    content: (
      <>
        <h2 className="font-semibold text-white">
          Utilisation de la plateforme
        </h2>

        <p>
          Les utilisateurs doivent fournir des informations exactes et protéger
          l’accès à leur compte.
        </p>

        <h2 className="pt-4 font-semibold text-white">Contenus publiés</h2>

        <p>
          Chaque utilisateur reste responsable des textes, informations et
          photos publiés sur son profil.
        </p>

        <h2 className="pt-4 font-semibold text-white">Modération</h2>

        <p>
          Ubiza peut suspendre ou supprimer une annonce ou un compte en cas de
          non-respect des règles de la plateforme.
        </p>

        <h2 className="pt-4 font-semibold text-white">Paiements</h2>

        <p>
          Les options payantes sont activées après confirmation du paiement.
        </p>
      </>
    ),
  },

  confidentialite: {
    title: "Politique de confidentialité",
    content: (
      <>
        <p>
          Ubiza collecte uniquement les données nécessaires au fonctionnement de
          la plateforme et à la sécurité des comptes.
        </p>

        <h2 className="pt-4 font-semibold text-white">Données collectées</h2>

        <p>
          Cela peut inclure le nom, l’adresse e-mail, les coordonnées de
          contact, les photos publiées et les informations liées au compte.
        </p>

        <h2 className="pt-4 font-semibold text-white">
          Utilisation des données
        </h2>

        <p>
          Les données sont utilisées pour gérer les comptes, les annonces, les
          paiements et les demandes d’assistance.
        </p>

        <h2 className="pt-4 font-semibold text-white">Vos droits</h2>

        <p>
          Vous pouvez demander l’accès, la correction ou la suppression de vos
          informations.
        </p>
      </>
    ),
  },

  mentions: {
    title: "Mentions légales",
    content: (
      <div className="grid gap-4 sm:grid-cols-2">
        <LegalCard label="Plateforme" value="Ubiza" />
        <LegalCard label="Responsable de publication" value="À compléter" />
        <LegalCard label="Adresse e-mail" value="contact@ubiza.com" />
        <LegalCard label="Hébergement" value="À compléter" />
      </div>
    ),
  },
};

type SectionKey = keyof typeof sections;

interface InformationPageProps {
  params: Promise<{
    section: string;
  }>;
}

export default async function InformationPage({
  params,
}: InformationPageProps) {
  const { section } = await params;

  if (!(section in sections)) {
    notFound();
  }

  const currentSection = sections[section as SectionKey];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-400 transition hover:text-white"
        >
          ← Retour à l’accueil
        </Link>

        <article className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            Informations Ubiza
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            {currentSection.title}
          </h1>

          <div className="mt-8 space-y-4 leading-7 text-zinc-400">
            {currentSection.content}
          </div>
        </article>
      </div>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <summary className="cursor-pointer font-semibold text-white">
        {question}
      </summary>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{answer}</p>
    </details>
  );
}
function LegalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 font-semibold text-zinc-200">{value}</p>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  description,
  detail,
  href,
  actionLabel,
}: {
  icon: string;
  title: string;
  description: string;
  detail: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-xl">
        {icon}
      </div>

      <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>

      <p className="mt-3 break-all text-sm font-medium text-zinc-300">
        {detail}
      </p>

      <a
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
        className="mt-5 inline-flex w-fit rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-500/20"
      >
        {actionLabel} →
      </a>
    </div>
  );
}

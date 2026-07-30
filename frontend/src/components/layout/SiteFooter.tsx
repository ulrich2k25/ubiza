import Link from "next/link";

const footerLinkClass =
  "text-sm text-zinc-400 transition hover:text-fuchsia-400";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-fuchsia-500/20 bg-black">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            href="/"
            className="inline-flex text-2xl font-black tracking-tight"
          >
            <span className="text-white">Ubi</span>
            <span className="text-fuchsia-500">za</span>
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            La plateforme de référence pour découvrir des profils partout au
            Cameroun.
          </p>
        </div>

        <div>
          <h3 className="mb-5 text-base font-bold text-white">Navigation</h3>

          <ul className="space-y-3">
            <li>
              <Link href="/" className={footerLinkClass}>
                Accueil
              </Link>
            </li>

            <li>
              <Link href="/search" className={footerLinkClass}>
                Découvrir
              </Link>
            </li>

            <li>
              <Link href="/search" className={footerLinkClass}>
                Villes
              </Link>
            </li>

            <li>
              <Link href="/dashboard/listing" className={footerLinkClass}>
                Publier une annonce
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-base font-bold text-white">Informations</h3>

          <ul className="space-y-3">
            <li>
              <Link href="/about" className={footerLinkClass}>
                À propos
              </Link>
            </li>

            <li>
              <Link href="/contact" className={footerLinkClass}>
                Contact
              </Link>
            </li>

            <li>
              <Link href="/faq" className={footerLinkClass}>
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-base font-bold text-white">Légal</h3>

          <ul className="space-y-3">
            <li>
              <Link href="/terms" className={footerLinkClass}>
                Conditions d&apos;utilisation
              </Link>
            </li>

            <li>
              <Link href="/privacy" className={footerLinkClass}>
                Politique de confidentialité
              </Link>
            </li>

            <li>
              <Link href="/legal" className={footerLinkClass}>
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-center text-sm text-zinc-500 sm:flex-row sm:text-left">
          <p>© 2026 Ubiza. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}


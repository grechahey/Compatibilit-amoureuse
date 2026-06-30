import Link from "next/link";
import { Diamond } from "lucide-react";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-ink text-sand-100">
      <div className="container-luxe grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Diamond className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <span className="font-serif text-2xl font-semibold text-sand-50">
              {BRAND.name}
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand-200/80">
            {BRAND.baseline} Une sélection confidentielle de propriétés
            d&apos;exception, pour une clientèle qui sait reconnaître le rare.
          </p>
        </div>

        <div>
          <h4 className="font-serif text-lg text-sand-50">Explorer</h4>
          <ul className="mt-4 space-y-2 text-sm text-sand-200/80">
            <li>
              <Link href="/properties" className="transition hover:text-gold-light">
                Tous les biens
              </Link>
            </li>
            <li>
              <Link href="/#concept" className="transition hover:text-gold-light">
                Notre concept
              </Link>
            </li>
            <li>
              <Link href="/host/new" className="transition hover:text-gold-light">
                Proposer un bien
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg text-sand-50">Conciergerie</h4>
          <ul className="mt-4 space-y-2 text-sm text-sand-200/80">
            <li>concierge@eclat.com</li>
            <li>+33 (0)1 86 00 00 00</li>
            <li>Disponible 24h/24, 7j/7</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-2 py-6 text-xs text-sand-200/60 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {BRAND.name}. Tous droits réservés.
          </span>
          <span>Conçu pour le séjour d&apos;exception.</span>
        </div>
      </div>
    </footer>
  );
}

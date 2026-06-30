import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth";
import { BRAND } from "@/lib/constants";
import { Diamond } from "lucide-react";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-sand-50/90 backdrop-blur-md">
      <nav className="container-luxe flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Diamond className="h-6 w-6 text-gold" strokeWidth={1.5} />
          <span className="font-serif text-2xl font-semibold tracking-tight">
            {BRAND.name}
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/properties"
            className="text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            Nos biens
          </Link>
          <Link
            href="/#concept"
            className="text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            Le concept
          </Link>
          <Link
            href="/host/new"
            className="text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            Devenir hôte
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href={session.role === "HOST" ? "/host" : "/dashboard"}
                className="hidden text-sm font-medium text-ink-soft transition hover:text-ink sm:block"
              >
                {session.name.split(" ")[0]}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn-outline px-5 py-2 text-xs">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-ink-soft transition hover:text-ink sm:block"
              >
                Connexion
              </Link>
              <Link href="/register" className="btn-primary px-5 py-2 text-xs">
                Rejoindre Éclat
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

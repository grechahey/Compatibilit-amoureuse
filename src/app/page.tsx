import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Gem, Headset, KeyRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PropertyCard } from "@/components/property-card";
import { SearchBar } from "@/components/search-bar";
import { BRAND, MIN_PRICE_PER_NIGHT } from "@/lib/constants";

export default async function HomePage() {
  const featured = await prisma.property.findMany({
    where: { featured: true, published: true },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2000&q=80"
            alt="Villa d'exception"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/30 to-ink/70" />
        </div>

        <div className="container-luxe relative flex min-h-[88vh] flex-col justify-center py-24">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-gold-light">
            {BRAND.tagline}
          </p>
          <h1 className="max-w-3xl font-serif text-5xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            L&apos;art de séjourner dans des lieux rares.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-100/90">
            Une sélection confidentielle de villas, penthouses et domaines
            d&apos;exception. À partir de {MIN_PRICE_PER_NIGHT} € la nuit,
            réservés à une clientèle qui sait reconnaître le raffinement.
          </p>

          <div className="mt-10 max-w-4xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* CONCEPT */}
      <section id="concept" className="container-luxe py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold">
            Le concept
          </p>
          <h2 className="mt-3 font-serif text-4xl text-ink">
            Le luxe, sans la moindre fausse note
          </h2>
          <p className="mt-4 text-ink-soft">
            Éclat ne référence que des biens d&apos;exception pour une clientèle
            sélectionnée. Des hôtes et des voyageurs vérifiés, des standards
            élevés — et donc, naturellement, très peu de litiges.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Gem,
              title: "Biens d'exception",
              text: `Chaque propriété est sélectionnée à la main. Tarif minimum de ${MIN_PRICE_PER_NIGHT} € la nuit, sans compromis sur la qualité.`,
            },
            {
              icon: ShieldCheck,
              title: "Membres vérifiés",
              text: "Hôtes et voyageurs sont des membres vérifiés. Une communauté de confiance qui réduit les besoins de garanties.",
            },
            {
              icon: Headset,
              title: "Conciergerie 24/7",
              text: "Une équipe dédiée orchestre chaque séjour. Discrète, disponible, jamais sollicitée pour des litiges.",
            },
            {
              icon: KeyRound,
              title: "Réservation directe",
              text: "Un parcours fluide, sans friction. Vous réservez en quelques clics et profitez, l'esprit libre.",
            },
          ].map((f) => (
            <div key={f.title} className="card-luxe p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-100">
                <f.icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 font-serif text-xl text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SÉLECTION */}
      <section className="bg-sand-100 py-24">
        <div className="container-luxe">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold">
                La sélection
              </p>
              <h2 className="mt-3 font-serif text-4xl text-ink">
                Nos adresses d&apos;exception
              </h2>
            </div>
            <Link
              href="/properties"
              className="hidden text-sm font-medium text-ink transition hover:text-gold sm:block"
            >
              Voir tous les biens →
            </Link>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          <div className="mt-12 text-center sm:hidden">
            <Link href="/properties" className="btn-primary">
              Voir tous les biens
            </Link>
          </div>
        </div>
      </section>

      {/* CTA HÔTE */}
      <section className="container-luxe py-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center sm:px-16">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-serif text-4xl text-sand-50">
              Vous possédez un bien d&apos;exception ?
            </h2>
            <p className="mt-4 text-sand-200/80">
              Rejoignez un cercle restreint d&apos;hôtes. Confiez votre propriété
              à une plateforme qui partage vos exigences et votre sens du détail.
            </p>
            <Link href="/host/new" className="btn-gold mt-8">
              Proposer mon bien
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

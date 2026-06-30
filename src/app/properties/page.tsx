import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PropertyCard } from "@/components/property-card";
import { SearchBar } from "@/components/search-bar";
import { MIN_PRICE_PER_NIGHT, PROPERTY_TYPES } from "@/lib/constants";
import Link from "next/link";

type SearchParams = {
  q?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
  type?: string;
  sort?: string;
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, guests, minPrice, maxPrice, type, sort } = searchParams;

  // Le plancher métier s'applique toujours, même si l'utilisateur saisit moins.
  const min = Math.max(
    MIN_PRICE_PER_NIGHT,
    minPrice ? parseInt(minPrice, 10) || MIN_PRICE_PER_NIGHT : MIN_PRICE_PER_NIGHT
  );

  const where: Prisma.PropertyWhereInput = {
    published: true,
    pricePerNight: {
      gte: min,
      ...(maxPrice ? { lte: parseInt(maxPrice, 10) } : {}),
    },
  };

  if (q) {
    where.OR = [
      { city: { contains: q } },
      { country: { contains: q } },
      { title: { contains: q } },
    ];
  }
  if (guests) {
    where.maxGuests = { gte: parseInt(guests, 10) || 1 };
  }
  if (type) {
    where.propertyType = type;
  }

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sort === "price_asc"
      ? { pricePerNight: "asc" }
      : sort === "price_desc"
        ? { pricePerNight: "desc" }
        : { featured: "desc" };

  const properties = await prisma.property.findMany({ where, orderBy });

  return (
    <div className="bg-sand-50">
      <div className="container-luxe py-12">
        <h1 className="font-serif text-4xl text-ink">Nos biens d&apos;exception</h1>
        <p className="mt-2 text-ink-soft">
          {properties.length} propriété{properties.length > 1 ? "s" : ""} à partir
          de {MIN_PRICE_PER_NIGHT} € la nuit.
        </p>

        <div className="mt-8">
          <SearchBar compact />
        </div>

        {/* Filtres par type */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <FilterChip
            label="Tous"
            href={buildHref(searchParams, { type: undefined })}
            active={!type}
          />
          {PROPERTY_TYPES.map((t) => (
            <FilterChip
              key={t}
              label={t}
              href={buildHref(searchParams, { type: t })}
              active={type === t}
            />
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-ink-soft">
            <span>Trier :</span>
            <SortLink label="Sélection" value={undefined} current={sort} params={searchParams} />
            <SortLink label="Prix ↑" value="price_asc" current={sort} params={searchParams} />
            <SortLink label="Prix ↓" value="price_desc" current={sort} params={searchParams} />
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-sand-300 py-20 text-center">
            <p className="font-serif text-2xl text-ink">Aucun bien ne correspond</p>
            <p className="mt-2 text-ink-soft">
              Élargissez votre recherche pour découvrir d&apos;autres adresses.
            </p>
            <Link href="/properties" className="btn-outline mt-6">
              Réinitialiser les filtres
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildHref(params: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...params, ...overrides };
  const sp = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const qs = sp.toString();
  return `/properties${qs ? `?${qs}` : ""}`;
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-ink text-sand-50"
          : "border border-sand-300 bg-white text-ink-soft hover:border-ink/30"
      }`}
    >
      {label}
    </Link>
  );
}

function SortLink({
  label,
  value,
  current,
  params,
}: {
  label: string;
  value?: string;
  current?: string;
  params: SearchParams;
}) {
  const active = current === value || (!current && !value);
  return (
    <Link
      href={buildHref(params, { sort: value })}
      className={`rounded-full px-3 py-1 transition ${
        active ? "bg-gold text-white" : "hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

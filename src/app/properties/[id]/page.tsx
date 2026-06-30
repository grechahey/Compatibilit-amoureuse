import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Users,
  BedDouble,
  Bath,
  Star,
  ShieldCheck,
  Check,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BookingWidget } from "@/components/booking-widget";
import { parseImages, parseAmenities } from "@/lib/utils";

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [property, session] = await Promise.all([
    prisma.property.findUnique({
      where: { id: params.id },
      include: {
        host: true,
        reviews: { include: { author: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    getSession(),
  ]);

  if (!property) notFound();

  const images = parseImages(property.images);
  const amenities = parseAmenities(property.amenities);
  const avgRating =
    property.reviews.length > 0
      ? property.reviews.reduce((s, r) => s + r.rating, 0) /
        property.reviews.length
      : null;

  return (
    <div className="bg-sand-50 pb-24">
      <div className="container-luxe pt-10">
        <Link
          href="/properties"
          className="text-sm text-ink-soft transition hover:text-ink"
        >
          ← Retour aux biens
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-ink-soft">
              <MapPin className="h-4 w-4 text-gold" />
              {property.address} · {property.city}, {property.country}
            </div>
            <h1 className="mt-2 max-w-3xl font-serif text-4xl text-ink lg:text-5xl">
              {property.title}
            </h1>
          </div>
          {avgRating && (
            <div className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm shadow-sm">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-ink-soft">
                ({property.reviews.length} avis)
              </span>
            </div>
          )}
        </div>

        {/* Galerie */}
        <div className="mt-8 grid grid-cols-1 gap-3 overflow-hidden rounded-3xl md:grid-cols-4 md:grid-rows-2">
          <div className="relative aspect-[16/10] md:col-span-2 md:row-span-2 md:aspect-auto">
            <Image
              src={images[0]}
              alt={property.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {images.slice(1, 5).map((src, i) => (
            <div key={i} className="relative hidden aspect-[4/3] md:block">
              <Image
                src={src}
                alt={`${property.title} ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]">
          {/* Colonne principale */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand-200 pb-8">
              <div>
                <h2 className="font-serif text-2xl text-ink">
                  {property.propertyType} d&apos;exception à {property.city}
                </h2>
                <div className="mt-3 flex flex-wrap gap-5 text-sm text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {property.maxGuests} voyageurs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4" /> {property.bedrooms} chambres
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4" /> {property.bathrooms} salles de bain
                  </span>
                </div>
              </div>
            </div>

            {/* Hôte */}
            <div className="flex items-center gap-4 border-b border-sand-200 py-8">
              {property.host.avatarUrl && (
                <Image
                  src={property.host.avatarUrl}
                  alt={property.host.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover"
                />
              )}
              <div>
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  Proposé par {property.host.name}
                  {property.host.verified && (
                    <ShieldCheck className="h-4 w-4 text-gold" />
                  )}
                </p>
                {property.host.bio && (
                  <p className="text-sm text-ink-soft">{property.host.bio}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-sand-200 py-8">
              <p className="whitespace-pre-line leading-relaxed text-ink-soft">
                {property.description}
              </p>
            </div>

            {/* Équipements */}
            <div className="py-8">
              <h3 className="font-serif text-2xl text-ink">Les prestations</h3>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {amenities.map((a) => (
                  <div key={a} className="flex items-center gap-3 text-ink-soft">
                    <Check className="h-4 w-4 text-gold" />
                    {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Avis */}
            {property.reviews.length > 0 && (
              <div className="border-t border-sand-200 py-8">
                <h3 className="font-serif text-2xl text-ink">
                  Ce que disent nos voyageurs
                </h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {property.reviews.map((r) => (
                    <div key={r.id} className="card-luxe p-5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                        “{r.comment}”
                      </p>
                      <p className="mt-3 text-xs font-medium text-ink">
                        {r.author.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Widget réservation */}
          <div>
            <BookingWidget
              propertyId={property.id}
              pricePerNight={property.pricePerNight}
              maxGuests={property.maxGuests}
              loggedIn={!!session}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

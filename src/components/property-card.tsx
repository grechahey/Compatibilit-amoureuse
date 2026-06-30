import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, BedDouble } from "lucide-react";
import type { Property } from "@prisma/client";
import { formatPrice, parseImages } from "@/lib/utils";

export function PropertyCard({ property }: { property: Property }) {
  const images = parseImages(property.images);
  const cover = images[0] ?? "";

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <article className="card-luxe overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand-200">
          {cover && (
            <Image
              src={cover}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium tracking-wide text-ink backdrop-blur">
            {property.propertyType}
          </div>
          {property.featured && (
            <div className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-medium tracking-wide text-white">
              Sélection Éclat
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            {property.city}, {property.country}
          </div>
          <h3 className="mt-2 line-clamp-1 font-serif text-xl text-ink">
            {property.title}
          </h3>

          <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} ch.
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {property.maxGuests} voyageurs
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t border-sand-200 pt-4">
            <span>
              <span className="font-serif text-2xl text-ink">
                {formatPrice(property.pricePerNight)}
              </span>
              <span className="text-sm text-ink-soft"> / nuit</span>
            </span>
            <span className="text-xs font-medium text-gold transition group-hover:translate-x-0.5">
              Découvrir →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

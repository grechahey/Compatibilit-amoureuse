import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck, MapPin, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cancelBookingAction } from "@/app/actions/bookings";
import { formatPrice, parseImages } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { booked?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { guestId: session.userId },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-luxe py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold">
            Espace voyageur
          </p>
          <h1 className="mt-2 font-serif text-4xl text-ink">
            Bonjour {session.name.split(" ")[0]}
          </h1>
        </div>
        <Link href="/properties" className="btn-outline">
          Explorer de nouveaux biens
        </Link>
      </div>

      {searchParams.booked && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-ink">
          <CheckCircle2 className="h-5 w-5 text-gold" />
          Votre réservation est confirmée. Notre conciergerie vous contactera
          sous peu pour préparer votre séjour.
        </div>
      )}

      <h2 className="mt-12 font-serif text-2xl text-ink">Mes réservations</h2>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-sand-300 py-20 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-sand-300" />
          <p className="mt-4 font-serif text-xl text-ink">
            Aucune réservation pour le moment
          </p>
          <p className="mt-2 text-ink-soft">
            Vos prochains séjours d&apos;exception apparaîtront ici.
          </p>
          <Link href="/properties" className="btn-primary mt-6">
            Découvrir nos biens
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => {
            const cover = parseImages(b.property.images)[0];
            const cancelled = b.status === "CANCELLED";
            return (
              <div
                key={b.id}
                className={`card-luxe flex flex-col gap-5 p-5 sm:flex-row sm:items-center ${
                  cancelled ? "opacity-60" : ""
                }`}
              >
                <Link
                  href={`/properties/${b.propertyId}`}
                  className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-sand-200 sm:w-48"
                >
                  {cover && (
                    <Image
                      src={cover}
                      alt={b.property.title}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <MapPin className="h-3.5 w-3.5 text-gold" />
                    {b.property.city}, {b.property.country}
                  </div>
                  <Link
                    href={`/properties/${b.propertyId}`}
                    className="mt-1 block font-serif text-xl text-ink hover:text-gold"
                  >
                    {b.property.title}
                  </Link>
                  <p className="mt-2 text-sm text-ink-soft">
                    {format(b.checkIn, "d MMM yyyy", { locale: fr })} →{" "}
                    {format(b.checkOut, "d MMM yyyy", { locale: fr })} ·{" "}
                    {b.nights} nuit{b.nights > 1 ? "s" : ""} · {b.guests}{" "}
                    voyageur{b.guests > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="font-serif text-2xl text-ink">
                    {formatPrice(b.totalPrice)}
                  </span>
                  {cancelled ? (
                    <span className="rounded-full bg-sand-200 px-3 py-1 text-xs font-medium text-ink-soft">
                      Annulée
                    </span>
                  ) : (
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-dark">
                      Confirmée
                    </span>
                  )}
                  {!cancelled && (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <button
                        type="submit"
                        className="text-xs text-ink-soft underline-offset-2 hover:text-red-600 hover:underline"
                      >
                        Annuler
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

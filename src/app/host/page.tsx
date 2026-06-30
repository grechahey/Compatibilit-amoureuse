import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, Home, Users, CalendarRange } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deletePropertyAction } from "@/app/actions/properties";
import { formatPrice, parseImages } from "@/lib/utils";

export default async function HostDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "GUEST") redirect("/dashboard");

  const properties = await prisma.property.findMany({
    where: { hostId: session.userId },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalBookings = properties.reduce((s, p) => s + p._count.bookings, 0);

  return (
    <div className="container-luxe py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold">
            Espace hôte
          </p>
          <h1 className="mt-2 font-serif text-4xl text-ink">
            Vos biens d&apos;exception
          </h1>
        </div>
        <Link href="/host/new" className="btn-gold">
          <Plus className="h-4 w-4" /> Publier un bien
        </Link>
      </div>

      {/* Statistiques */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <StatCard icon={Home} label="Biens publiés" value={properties.length} />
        <StatCard icon={CalendarRange} label="Réservations" value={totalBookings} />
        <StatCard
          icon={Users}
          label="Statut"
          value={session.role === "ADMIN" ? "Admin" : "Hôte vérifié"}
        />
      </div>

      {properties.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-sand-300 py-20 text-center">
          <Home className="mx-auto h-10 w-10 text-sand-300" />
          <p className="mt-4 font-serif text-xl text-ink">
            Vous n&apos;avez pas encore publié de bien
          </p>
          <p className="mt-2 text-ink-soft">
            Présentez votre propriété à une clientèle d&apos;exception.
          </p>
          <Link href="/host/new" className="btn-primary mt-6">
            Publier mon premier bien
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-4">
          {properties.map((p) => {
            const cover = parseImages(p.images)[0];
            return (
              <div
                key={p.id}
                className="card-luxe flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/properties/${p.id}`}
                  className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-sand-200 sm:w-44"
                >
                  {cover && (
                    <Image
                      src={cover}
                      alt={p.title}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-ink">{p.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {p.city}, {p.country} · {formatPrice(p.pricePerNight)} / nuit
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {p._count.bookings} réservation
                    {p._count.bookings > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/properties/${p.id}`}
                    className="btn-outline px-4 py-2 text-xs"
                  >
                    Voir
                  </Link>
                  <form action={deletePropertyAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="text-xs text-ink-soft underline-offset-2 hover:text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="card-luxe flex items-center gap-4 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-100">
        <Icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-ink-soft">{label}</p>
        <p className="font-serif text-2xl text-ink">{value}</p>
      </div>
    </div>
  );
}

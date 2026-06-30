import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PropertyForm } from "@/components/property-form";

export default async function NewPropertyPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Un voyageur doit d'abord devenir hôte : on l'oriente vers l'inscription hôte.
  if (session.role === "GUEST") {
    return (
      <div className="container-luxe flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="font-serif text-4xl text-ink">Devenez hôte Éclat</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Votre compte actuel est un compte voyageur. Créez un compte hôte pour
          proposer votre bien d&apos;exception à notre clientèle.
        </p>
        <Link href="/register" className="btn-gold mt-8">
          Créer un compte hôte
        </Link>
      </div>
    );
  }

  return (
    <div className="container-luxe py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold">
          Espace hôte
        </p>
        <h1 className="mt-2 font-serif text-4xl text-ink">
          Publier un bien d&apos;exception
        </h1>
        <p className="mt-2 text-ink-soft">
          Présentez votre propriété avec le soin qu&apos;elle mérite.
        </p>
        <PropertyForm />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type AuthState } from "@/app/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<AuthState, FormData>(
    loginAction,
    undefined
  );

  return (
    <div className="container-luxe flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-ink">Bon retour parmi nous</h1>
          <p className="mt-2 text-ink-soft">
            Accédez à votre espace Éclat.
          </p>
        </div>

        <form action={formAction} className="card-luxe mt-8 space-y-4 p-8">
          <div>
            <label className="label-luxe" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.com"
              className="input-luxe"
            />
          </div>
          <div>
            <label className="label-luxe" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="input-luxe"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <Submit />

          <div className="rounded-lg bg-sand-100 px-3 py-2 text-center text-xs text-ink-soft">
            Démo : <strong>client@eclat.com</strong> / <strong>eclat1234</strong>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Pas encore membre ?{" "}
          <Link href="/register" className="font-medium text-gold hover:underline">
            Rejoindre Éclat
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { registerAction, type AuthState } from "@/app/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Création…" : "Créer mon compte"}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState<AuthState, FormData>(
    registerAction,
    undefined
  );
  const [role, setRole] = useState<"GUEST" | "HOST">("GUEST");

  return (
    <div className="container-luxe flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-ink">Rejoindre Éclat</h1>
          <p className="mt-2 text-ink-soft">
            Un cercle confidentiel de voyageurs et d&apos;hôtes vérifiés.
          </p>
        </div>

        <form action={formAction} className="card-luxe mt-8 space-y-4 p-8">
          {/* Choix du rôle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-sand-100 p-1">
            <button
              type="button"
              onClick={() => setRole("GUEST")}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                role === "GUEST" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              Voyageur
            </button>
            <button
              type="button"
              onClick={() => setRole("HOST")}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                role === "HOST" ? "bg-white text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              Hôte
            </button>
          </div>
          <input type="hidden" name="role" value={role} />

          <div>
            <label className="label-luxe" htmlFor="name">
              Nom complet
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Camille Moreau"
              className="input-luxe"
            />
          </div>
          <div>
            <label className="label-luxe" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
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
              minLength={8}
              placeholder="8 caractères minimum"
              className="input-luxe"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <Submit />
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Déjà membre ?{" "}
          <Link href="/login" className="font-medium text-gold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

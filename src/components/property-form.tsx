"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createPropertyAction,
  type PropertyState,
} from "@/app/actions/properties";
import {
  AMENITIES,
  PROPERTY_TYPES,
  MIN_PRICE_PER_NIGHT,
} from "@/lib/constants";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full sm:w-auto">
      {pending ? "Publication…" : "Publier ce bien"}
    </button>
  );
}

export function PropertyForm() {
  const [state, formAction] = useFormState<PropertyState, FormData>(
    createPropertyAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-10 space-y-8">
      <section className="card-luxe p-7">
        <h2 className="font-serif text-xl text-ink">Présentation</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label-luxe" htmlFor="title">
              Titre de l&apos;annonce
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Villa Sérénité — vue panoramique sur la baie"
              className="input-luxe"
            />
          </div>
          <div>
            <label className="label-luxe" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="Décrivez l'atmosphère, les espaces, les vues, les prestations exclusives…"
              className="input-luxe resize-none"
            />
          </div>
          <div>
            <label className="label-luxe" htmlFor="propertyType">
              Type de bien
            </label>
            <select id="propertyType" name="propertyType" className="input-luxe">
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card-luxe p-7">
        <h2 className="font-serif text-xl text-ink">Localisation & capacité</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-luxe" htmlFor="city">
              Ville
            </label>
            <input id="city" name="city" required placeholder="Saint-Tropez" className="input-luxe" />
          </div>
          <div>
            <label className="label-luxe" htmlFor="country">
              Pays
            </label>
            <input id="country" name="country" required placeholder="France" className="input-luxe" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-luxe" htmlFor="address">
              Adresse
            </label>
            <input
              id="address"
              name="address"
              required
              placeholder="Chemin des Salins"
              className="input-luxe"
            />
          </div>
          <div>
            <label className="label-luxe" htmlFor="bedrooms">
              Chambres
            </label>
            <input id="bedrooms" name="bedrooms" type="number" min={1} defaultValue={1} className="input-luxe" />
          </div>
          <div>
            <label className="label-luxe" htmlFor="bathrooms">
              Salles de bain
            </label>
            <input id="bathrooms" name="bathrooms" type="number" min={1} defaultValue={1} className="input-luxe" />
          </div>
          <div>
            <label className="label-luxe" htmlFor="maxGuests">
              Voyageurs max
            </label>
            <input id="maxGuests" name="maxGuests" type="number" min={1} defaultValue={2} className="input-luxe" />
          </div>
          <div>
            <label className="label-luxe" htmlFor="pricePerNight">
              Prix / nuit (€)
            </label>
            <input
              id="pricePerNight"
              name="pricePerNight"
              type="number"
              min={MIN_PRICE_PER_NIGHT}
              defaultValue={MIN_PRICE_PER_NIGHT}
              className="input-luxe"
            />
            <p className="mt-1.5 text-xs text-ink-soft">
              Minimum {MIN_PRICE_PER_NIGHT} € — Éclat ne référence que des biens
              d&apos;exception.
            </p>
          </div>
        </div>
      </section>

      <section className="card-luxe p-7">
        <h2 className="font-serif text-xl text-ink">Photographies</h2>
        <label className="label-luxe mt-5" htmlFor="images">
          URLs des images (une par ligne ou séparées par des virgules)
        </label>
        <textarea
          id="images"
          name="images"
          required
          rows={3}
          placeholder="https://images.unsplash.com/photo-...&#10;https://images.unsplash.com/photo-..."
          className="input-luxe resize-none font-mono text-xs"
        />
      </section>

      <section className="card-luxe p-7">
        <h2 className="font-serif text-xl text-ink">Prestations</h2>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AMENITIES.map((a) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-sand-200 px-3 py-2.5 text-sm text-ink-soft transition hover:border-gold/40 has-[:checked]:border-gold has-[:checked]:bg-gold/5 has-[:checked]:text-ink"
            >
              <input
                type="checkbox"
                name="amenities"
                value={a}
                className="h-4 w-4 accent-gold"
              />
              {a}
            </label>
          ))}
        </div>
      </section>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}

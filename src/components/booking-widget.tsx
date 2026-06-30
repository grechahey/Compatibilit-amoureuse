"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createBookingAction, type BookingState } from "@/app/actions/bookings";
import { formatPrice, toDateInputValue } from "@/lib/utils";
import { SERVICE_FEE_RATE } from "@/lib/constants";

function SubmitButton({ loggedIn }: { loggedIn: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? "Traitement…" : loggedIn ? "Réserver" : "Se connecter pour réserver"}
    </button>
  );
}

export function BookingWidget({
  propertyId,
  pricePerNight,
  maxGuests,
  loggedIn,
}: {
  propertyId: string;
  pricePerNight: number;
  maxGuests: number;
  loggedIn: boolean;
}) {
  const [state, formAction] = useFormState<BookingState, FormData>(
    createBookingAction,
    undefined
  );

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const inThreeDays = new Date();
  inThreeDays.setDate(today.getDate() + 4);

  const [checkIn, setCheckIn] = useState(toDateInputValue(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateInputValue(inThreeDays));
  const [guests, setGuests] = useState(2);

  const nights = Math.max(
    0,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const subtotal = nights * pricePerNight;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  return (
    <div className="card-luxe sticky top-28 p-6">
      <div className="flex items-baseline justify-between">
        <span>
          <span className="font-serif text-3xl text-ink">
            {formatPrice(pricePerNight)}
          </span>
          <span className="text-ink-soft"> / nuit</span>
        </span>
      </div>

      <form action={formAction} className="mt-6 space-y-3">
        <input type="hidden" name="propertyId" value={propertyId} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-luxe" htmlFor="checkIn">
              Arrivée
            </label>
            <input
              id="checkIn"
              name="checkIn"
              type="date"
              required
              min={toDateInputValue(today)}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="input-luxe"
            />
          </div>
          <div>
            <label className="label-luxe" htmlFor="checkOut">
              Départ
            </label>
            <input
              id="checkOut"
              name="checkOut"
              type="date"
              required
              min={checkIn}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="input-luxe"
            />
          </div>
        </div>

        <div>
          <label className="label-luxe" htmlFor="guests">
            Voyageurs
          </label>
          <select
            id="guests"
            name="guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="input-luxe"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} voyageur{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        {nights > 0 && (
          <div className="space-y-2 border-t border-sand-200 pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>
                {formatPrice(pricePerNight)} × {nights} nuit{nights > 1 ? "s" : ""}
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Frais de service Éclat</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
            <div className="flex justify-between border-t border-sand-200 pt-2 font-medium text-ink">
              <span>Total</span>
              <span className="font-serif text-lg">{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <SubmitButton loggedIn={loggedIn} />
        <p className="text-center text-xs text-ink-soft">
          Aucun montant ne vous sera débité immédiatement.
        </p>
      </form>
    </div>
  );
}

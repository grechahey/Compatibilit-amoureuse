"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { nightsBetween } from "@/lib/utils";
import { SERVICE_FEE_RATE } from "@/lib/constants";

const bookingSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().min(1, "Date d'arrivée requise."),
  checkOut: z.string().min(1, "Date de départ requise."),
  guests: z.coerce.number().int().min(1),
});

export type BookingState = { error?: string } | undefined;

export async function createBookingAction(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const session = await getSession();
  if (!session) {
    const propertyId = formData.get("propertyId") as string;
    redirect(`/login?redirect=/properties/${propertyId}`);
  }

  const parsed = bookingSchema.safeParse({
    propertyId: formData.get("propertyId"),
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
    guests: formData.get("guests"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }

  const { propertyId, checkIn, checkOut, guests } = parsed.data;
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: "Bien introuvable." };

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = nightsBetween(checkInDate, checkOutDate);

  if (nights < 1) {
    return { error: "La date de départ doit être postérieure à la date d'arrivée." };
  }
  if (guests > property.maxGuests) {
    return { error: `Ce bien accueille au maximum ${property.maxGuests} voyageurs.` };
  }

  // Vérifie qu'aucune réservation confirmée ne chevauche la période demandée.
  const overlap = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { not: "CANCELLED" },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
  });
  if (overlap) {
    return { error: "Ces dates ne sont plus disponibles pour ce bien." };
  }

  const subtotal = nights * property.pricePerNight;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const totalPrice = subtotal + serviceFee;

  await prisma.booking.create({
    data: {
      propertyId,
      guestId: session.userId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      nights,
      totalPrice,
      status: "CONFIRMED",
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard?booked=1");
}

export async function cancelBookingAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = formData.get("id") as string;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.guestId !== session.userId) return;

  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/dashboard");
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MIN_PRICE_PER_NIGHT } from "@/lib/constants";

const propertySchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(30, "La description doit contenir au moins 30 caractères."),
  pricePerNight: z.coerce
    .number()
    .int()
    .min(
      MIN_PRICE_PER_NIGHT,
      `Éclat ne référence que des biens d'exception : tarif minimum ${MIN_PRICE_PER_NIGHT} € / nuit.`
    ),
  city: z.string().min(2, "Ville requise."),
  country: z.string().min(2, "Pays requis."),
  address: z.string().min(4, "Adresse requise."),
  bedrooms: z.coerce.number().int().min(1),
  bathrooms: z.coerce.number().int().min(1),
  maxGuests: z.coerce.number().int().min(1),
  propertyType: z.string().min(2),
  images: z.string().min(4, "Indiquez au moins une URL d'image."),
  amenities: z.string().default(""),
});

export type PropertyState = { error?: string } | undefined;

export async function createPropertyAction(
  _prev: PropertyState,
  formData: FormData
): Promise<PropertyState> {
  const session = await getSession();
  if (!session) {
    return { error: "Vous devez être connecté pour publier un bien." };
  }
  if (session.role !== "HOST" && session.role !== "ADMIN") {
    return { error: "Seuls les hôtes peuvent publier un bien." };
  }

  const amenities = formData.getAll("amenities").join(",");

  const parsed = propertySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    pricePerNight: formData.get("pricePerNight"),
    city: formData.get("city"),
    country: formData.get("country"),
    address: formData.get("address"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    maxGuests: formData.get("maxGuests"),
    propertyType: formData.get("propertyType"),
    images: formData.get("images"),
    amenities,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }

  const data = parsed.data;
  await prisma.property.create({
    data: {
      ...data,
      images: data.images
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join(","),
      hostId: session.userId,
    },
  });

  revalidatePath("/host");
  revalidatePath("/properties");
  redirect("/host");
}

export async function deletePropertyAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = formData.get("id") as string;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return;
  if (property.hostId !== session.userId && session.role !== "ADMIN") return;

  await prisma.property.delete({ where: { id } });
  revalidatePath("/host");
  revalidatePath("/properties");
}

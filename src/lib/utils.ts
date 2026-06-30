import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function parseImages(images: string): string[] {
  return images
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseAmenities(amenities: string): string[] {
  return amenities
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

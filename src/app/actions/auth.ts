"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

const registerSchema = z.object({
  name: z.string().min(2, "Veuillez indiquer votre nom."),
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  role: z.enum(["GUEST", "HOST"]).default("GUEST"),
});

export type AuthState = { error?: string } | undefined;

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "GUEST",
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse e-mail." };
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      // Clientèle sélectionnée : les nouveaux membres sont marqués vérifiés
      // après leur inscription (processus de sélection simplifié pour la démo).
      verified: true,
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as "GUEST" | "HOST" | "ADMIN",
    name: user.name,
  });

  redirect(role === "HOST" ? "/host" : "/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Veuillez saisir votre mot de passe."),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as "GUEST" | "HOST" | "ADMIN",
    name: user.name,
  });

  redirect(user.role === "HOST" ? "/host" : "/dashboard");
}

export async function logoutAction() {
  destroySession();
  redirect("/");
}

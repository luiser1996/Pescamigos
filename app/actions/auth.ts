"use server";
import argon2 from "argon2";
import { redirect, RedirectType } from "next/navigation";
import { headers } from "next/headers";
import { createSession, hashPassword, logout, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

const attempts = new Map<string, { count: number; reset: number }>();
function allowed(key: string) {
  const now = Date.now();
  const value = attempts.get(key);
  if (!value || value.reset < now) {
    attempts.set(key, { count: 1, reset: now + 15 * 60_000 });
    return true;
  }
  if (value.count >= 8) return false;
  value.count++;
  return true;
}

export async function loginAction(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!allowed(ip))
    redirect("/login?error=Demasiados+intentos.+Espera+unos+minutos");
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=Revisa+los+datos");
  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (
    !user ||
    !user.active ||
    !(await argon2.verify(user.passwordHash, parsed.data.password))
  )
    redirect("/login?error=Credenciales+incorrectas");
  attempts.delete(ip);
  await createSession(user.id);
  redirect("/");
}

export async function setupAction(formData: FormData) {
  if (await prisma.user.count()) redirect("/login");
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!parsed.success || displayName.length < 2)
    redirect("/setup?error=Revisa+los+datos");
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
      displayName,
      role: "ADMIN",
    },
  });
  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
export async function createUserAction(formData: FormData) {
  const actor = await requireUser();
  if (actor.role !== "ADMIN") throw new Error("No autorizado");
  const parsed = credentialsSchema.parse(Object.fromEntries(formData));
  const displayName = String(formData.get("displayName") ?? "").trim();
  await prisma.user.create({
    data: {
      username: parsed.username,
      displayName,
      passwordHash: await hashPassword(parsed.password),
      role: "MEMBER",
    },
  });
  redirect("/admin?created=1");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  if (!(await argon2.verify(user.passwordHash, current)))
    redirect(
      `/pescadores/${user.id}?edit=1&error=La+contraseña+actual+no+es+correcta`,
      RedirectType.replace,
    );
  if (next.length < 10 || next.length > 128)
    redirect(
      `/pescadores/${user.id}?edit=1&error=La+nueva+contraseña+debe+tener+entre+10+y+128+caracteres`,
      RedirectType.replace,
    );
  const passwordHash = await hashPassword(next);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  await createSession(user.id);
  redirect(`/pescadores/${user.id}?edit=1&changed=1`, RedirectType.replace);
}

export async function updateDisplayNameAction(formData: FormData) {
  const user = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length < 2 || displayName.length > 60)
    redirect(
      `/pescadores/${user.id}?edit=1&error=El+nombre+debe+tener+entre+2+y+60+caracteres`,
      RedirectType.replace,
    );
  await prisma.user.update({ where: { id: user.id }, data: { displayName } });
  redirect(`/pescadores/${user.id}?edit=1&changed=1`, RedirectType.replace);
}

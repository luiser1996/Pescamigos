"use server";

import { redirect, RedirectType } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { decorationBySlug } from "@/lib/decorations";
import { prisma } from "@/lib/prisma";

export async function saveAdminAquariumAction(data: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  let rawFish: unknown = [];
  let rawDecorations: unknown = [];
  try {
    rawFish = JSON.parse(String(data.get("fish") ?? "[]"));
    rawDecorations = JSON.parse(String(data.get("decorations") ?? "[]"));
  } catch {
    redirect(
      "/admin/pecera?error=Datos+de+pecera+no+válidos",
      RedirectType.replace,
    );
  }
  const fish = Array.isArray(rawFish)
    ? rawFish.slice(0, 80).map((item) => ({
        speciesId: String(item.speciesId ?? ""),
        lengthCm: Math.max(1, Math.min(500, Number(item.lengthCm) || 1)),
      }))
    : [];
  const validSpecies = await prisma.species.findMany({
    where: { id: { in: fish.map((item) => item.speciesId) }, archivedAt: null },
    select: { id: true },
  });
  const validSpeciesIds = new Set(validSpecies.map((item) => item.id));
  if (fish.some((item) => !validSpeciesIds.has(item.speciesId)))
    redirect(
      "/admin/pecera?error=Algún+pez+no+es+válido",
      RedirectType.replace,
    );
  const decorations = Array.isArray(rawDecorations)
    ? rawDecorations.slice(0, 120).flatMap((item) => {
        const definition = decorationBySlug.get(String(item.slug ?? ""));
        if (!definition) return [];
        return [
          {
            slug: definition.slug,
            rarity: definition.rarity,
            xPct: Math.max(2, Math.min(92, Number(item.xPct) || 50)),
            yPct: Math.max(4, Math.min(88, Number(item.yPct) || 70)),
            scale: Math.max(0.5, Math.min(2, Number(item.scale) || 1)),
          },
        ];
      })
    : [];
  await prisma.$transaction([
    prisma.adminAquariumFish.deleteMany(),
    prisma.adminAquariumDecoration.deleteMany(),
    prisma.adminAquariumFish.createMany({ data: fish }),
    prisma.adminAquariumDecoration.createMany({ data: decorations }),
  ]);
  redirect("/admin/pecera?saved=1", RedirectType.replace);
}

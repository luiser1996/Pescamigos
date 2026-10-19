"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveAquariumAction(data: FormData) {
  const user = await requireUser();
  const requestedIds = [
    ...new Set(
      data
        .getAll("catchIds")
        .map(String)
        .filter((value) => value.length > 0),
    ),
  ];
  const owned = await prisma.catch.findMany({
    where: {
      id: { in: requestedIds },
      fisherId: user.id,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (owned.length !== requestedIds.length)
    redirect(
      `/pescadores/${user.id}/pecera?error=${encodeURIComponent("Alguna captura seleccionada no es válida")}`,
      RedirectType.replace,
    );

  let placements: { id: string; xPct: number; yPct: number; scale: number }[] =
    [];
  try {
    const raw = JSON.parse(String(data.get("decorationPlacements") ?? "[]"));
    if (Array.isArray(raw))
      placements = raw
        .slice(0, 80)
        .map((item) => ({
          id: String(item.id),
          xPct: Math.max(2, Math.min(92, Number(item.xPct))),
          yPct: Math.max(4, Math.min(88, Number(item.yPct))),
          scale: Math.max(0.5, Math.min(2, Number(item.scale) || 1)),
        }))
        .filter(
          (item) =>
            item.id && Number.isFinite(item.xPct) && Number.isFinite(item.yPct),
        );
  } catch {
    placements = [];
  }
  const ownedDecorations = await prisma.userDecoration.findMany({
    where: { userId: user.id, id: { in: placements.map((item) => item.id) } },
    select: { id: true },
  });
  const allowedDecorationIds = new Set(ownedDecorations.map((item) => item.id));
  placements = placements.filter((item) => allowedDecorationIds.has(item.id));

  await prisma.$transaction([
    prisma.aquariumFish.deleteMany({ where: { userId: user.id } }),
    prisma.aquariumFish.createMany({
      data: owned.map((item) => ({ userId: user.id, catchId: item.id })),
    }),
    prisma.userDecoration.updateMany({
      where: { userId: user.id },
      data: { xPct: null, yPct: null },
    }),
    ...placements.map((item) =>
      prisma.userDecoration.update({
        where: { id: item.id },
        data: { xPct: item.xPct, yPct: item.yPct, scale: item.scale },
      }),
    ),
  ]);
  revalidatePath(`/pescadores/${user.id}`);
  redirect(`/pescadores/${user.id}?aquarium=saved`, RedirectType.replace);
}

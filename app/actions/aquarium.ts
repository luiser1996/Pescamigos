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
      `/pescadores/${user.username}/pecera?error=${encodeURIComponent("Alguna captura seleccionada no es válida")}`,
      RedirectType.replace,
    );

  let placements: {
    id: string;
    xPct: number;
    yPct: number;
    scale: number;
    layer: number;
    coversFish: boolean;
  }[] = [];
  try {
    const raw = JSON.parse(String(data.get("decorationPlacements") ?? "[]"));
    if (Array.isArray(raw))
      placements = raw
        .slice(0, 80)
        .map((item) => ({
          id: String(item.id),
          xPct: Math.max(1, Math.min(99, Number(item.xPct))),
          yPct: Math.max(1, Math.min(97, Number(item.yPct))),
          scale: Math.max(0.5, Math.min(2, Number(item.scale) || 1)),
          layer: Math.max(
            -1000,
            Math.min(1000, Math.trunc(Number(item.layer) || 0)),
          ),
          coversFish: item.coversFish === true,
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
  placements = placements
    .filter((item) => allowedDecorationIds.has(item.id))
    .sort((a, b) => a.layer - b.layer || a.id.localeCompare(b.id))
    .map((item, layer) => ({ ...item, layer }));

  await prisma.$transaction([
    prisma.aquariumFish.deleteMany({ where: { userId: user.id } }),
    prisma.aquariumFish.createMany({
      data: owned.map((item) => ({ userId: user.id, catchId: item.id })),
    }),
    prisma.userDecoration.updateMany({
      where: { userId: user.id },
      data: { xPct: null, yPct: null, layer: 0, coversFish: false },
    }),
    ...placements.map((item) =>
      prisma.userDecoration.update({
        where: { id: item.id },
        data: {
          xPct: item.xPct,
          yPct: item.yPct,
          scale: item.scale,
          layer: item.layer,
          coversFish: item.coversFish,
        },
      }),
    ),
  ]);
  revalidatePath(`/pescadores/${user.username}`);
  redirect(`/pescadores/${user.username}?aquarium=saved`, RedirectType.replace);
}

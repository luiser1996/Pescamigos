import { prisma } from "@/lib/prisma";
import { scoreBonusesFor, scoreCatch, scoringContext } from "@/lib/ranking";
import { chestsForPoints } from "@/lib/decorations";

export async function ensureChestAwards(userId?: string) {
  const [pending, allCatches] = await Promise.all([
    prisma.catch.findMany({
      where: {
        deletedAt: null,
        chestsAwarded: null,
        ...(userId ? { fisherId: userId } : {}),
      },
      include: { species: true },
    }),
    prisma.catch.findMany({
      where: { deletedAt: null },
      include: { species: true },
    }),
  ]);
  if (!pending.length) return;
  const context = scoringContext(allCatches);
  await prisma.$transaction(
    pending.map((item) =>
      prisma.catch.update({
        where: { id: item.id },
        data: {
          chestsAwarded: chestsForPoints(
            scoreCatch(item, scoreBonusesFor(item.id, context)),
          ),
        },
      }),
    ),
  );
}

export async function availableChests(userId: string) {
  await ensureChestAwards(userId);
  const [awarded, opened] = await Promise.all([
    prisma.catch.aggregate({
      where: { fisherId: userId },
      _sum: { chestsAwarded: true },
    }),
    prisma.userDecoration.count({ where: { userId, source: "CHEST" } }),
  ]);
  return Math.max(0, (awarded._sum.chestsAwarded ?? 0) - opened);
}

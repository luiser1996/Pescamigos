import { prisma } from "@/lib/prisma";
import { scoreBonusesFor, scoreCatch, scoringContext } from "@/lib/ranking";
import { chestsForPoints, remainingChests } from "@/lib/decorations";

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
  const [awarded, user] = await Promise.all([
    prisma.catch.aggregate({
      where: { fisherId: userId },
      _sum: { chestsAwarded: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { chestsOpened: true },
    }),
  ]);
  return remainingChests(awarded._sum.chestsAwarded ?? 0, user.chestsOpened);
}

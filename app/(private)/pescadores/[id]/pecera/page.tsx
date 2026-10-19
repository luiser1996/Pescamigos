import { notFound } from "next/navigation";
import { AquariumEditor } from "@/components/aquarium-editor";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { recordIds } from "@/lib/ranking";

export default async function AquariumEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requireUser();
  const { id } = await params;
  const owner = await prisma.user.findFirst({
    where: { OR: [{ id }, { username: id }], active: true },
    select: { id: true },
  });
  if (!owner || actor.id !== owner.id) notFound();
  const userId = owner.id;
  const [catches, saved, status, allCatches, decorations] = await Promise.all([
    prisma.catch.findMany({
      where: { fisherId: userId, deletedAt: null },
      include: { species: true, place: true },
      orderBy: { caughtAt: "desc" },
    }),
    prisma.aquariumFish.findMany({
      where: { userId },
      select: { catchId: true },
    }),
    searchParams,
    prisma.catch.findMany({
      where: { deletedAt: null },
      include: { species: true },
    }),
    prisma.userDecoration.findMany({
      where: { userId },
      orderBy: { acquiredAt: "desc" },
    }),
  ]);
  const records = recordIds(allCatches);
  return (
    <>
      {status.error && (
        <p role="alert" className="form-error">
          {status.error}
        </p>
      )}
      <AquariumEditor
        catches={catches.map((item) => ({
          id: item.id,
          speciesId: item.speciesId,
          name: item.species.commonName,
          lengthCm: Number(item.lengthCm),
          catalogImageId: item.species.catalogImageId,
          behavior: item.species.aquariumBehavior,
          caughtAt: formatDate(item.caughtAt),
          caughtAtValue: item.caughtAt.getTime(),
          placeName: item.place.name,
          isRecord: records.has(item.id),
        }))}
        initialIds={saved.map((item) => item.catchId)}
        decorations={decorations.map((item) => ({
          id: item.id,
          slug: item.slug,
          rarity: item.rarity,
          xPct: item.xPct ?? 50,
          yPct: item.yPct ?? 70,
          scale: item.scale,
          acquiredAtValue: item.acquiredAt.getTime(),
          isPlaced: item.xPct != null && item.yPct != null,
        }))}
      />
    </>
  );
}

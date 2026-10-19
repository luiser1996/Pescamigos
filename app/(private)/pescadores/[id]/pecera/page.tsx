import { notFound } from "next/navigation";
import { AquariumEditor } from "@/components/aquarium-editor";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export default async function AquariumEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requireUser();
  const { id } = await params;
  if (actor.id !== id) notFound();
  const [catches, saved, status] = await Promise.all([
    prisma.catch.findMany({
      where: { fisherId: id, deletedAt: null },
      include: { species: true },
      orderBy: { caughtAt: "desc" },
    }),
    prisma.aquariumFish.findMany({
      where: { userId: id },
      select: { catchId: true },
    }),
    searchParams,
  ]);
  return (
    <>
      {status.error && <p role="alert" className="form-error">{status.error}</p>}
      <AquariumEditor
        catches={catches.map((item) => ({
          id: item.id,
          name: item.species.commonName,
          lengthCm: Number(item.lengthCm),
          catalogImageId: item.species.catalogImageId,
          caughtAt: formatDate(item.caughtAt),
        }))}
        initialIds={saved.map((item) => item.catchId)}
      />
    </>
  );
}

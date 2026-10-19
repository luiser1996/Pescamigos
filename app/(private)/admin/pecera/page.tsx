import { redirect } from "next/navigation";
import { AdminAquariumEditor } from "@/components/admin-aquarium-editor";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAquariumPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  const [species, fish, decorations, status] = await Promise.all([
    prisma.species.findMany({
      where: { archivedAt: null },
      orderBy: { commonName: "asc" },
    }),
    prisma.adminAquariumFish.findMany({
      include: { species: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.adminAquariumDecoration.findMany({ orderBy: { createdAt: "asc" } }),
    searchParams,
  ]);
  return (
    <>
      {status.saved && (
        <p className="aquarium-saved">✓ Pecera de pruebas guardada.</p>
      )}
      {status.error && <p className="form-error">{status.error}</p>}
      <AdminAquariumEditor
        species={species.map((item) => ({
          id: item.id,
          name: item.commonName,
          catalogImageId: item.catalogImageId,
          behavior: item.aquariumBehavior,
          usualSizeCm: Number(item.usualSizeCm) || 30,
        }))}
        initialFish={fish.map((item) => ({
          id: item.id,
          speciesId: item.speciesId,
          name: item.species.commonName,
          lengthCm: item.lengthCm,
          catalogImageId: item.species.catalogImageId,
          behavior: item.species.aquariumBehavior,
          flipCatalogImage:
            item.species.commonName.toLocaleLowerCase("es") === "platija",
          detailHref: null,
        }))}
        initialDecorations={decorations.map((item) => ({
          id: item.id,
          slug: item.slug,
          rarity: item.rarity,
          xPct: item.xPct,
          yPct: item.yPct,
          scale: item.scale,
          layer: item.layer,
          coversFish: item.coversFish,
        }))}
      />
    </>
  );
}

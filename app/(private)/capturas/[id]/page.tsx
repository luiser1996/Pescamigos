import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCatchAction } from "@/app/actions/catches";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditCatch } from "@/lib/validation";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { formatDateTime } from "@/lib/date";
import { captureRarity, recordIds, scoreCatch } from "@/lib/ranking";
import { RarityBadge } from "@/components/rarity-badge";

export default async function CatchDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; updated?: string }>;
}) {
  const actor = await requireUser();
  const { id } = await params;
  const item = await prisma.catch.findFirst({
    where: { id, deletedAt: null },
    include: {
      species: true,
      fisher: true,
      place: { include: { placeImage: true } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!item) notFound();
  const records = recordIds(
    await prisma.catch.findMany({
      where: { deletedAt: null },
      include: { species: true },
    }),
  );
  const isRecord = records.has(item.id);
  const { saved, updated } = await searchParams;
  const editable = canEditCatch(actor, item.fisherId);
  return (
    <>
      {(saved || updated) && (
        <p
          role="status"
          className="card"
          style={{ padding: "1rem", background: "#dff3df" }}
        >
          ✓{" "}
          {saved
            ? "Captura guardada. ¡Una página más del cuaderno!"
            : "Cambios guardados."}
        </p>
      )}
      <h1>
        {item.species.commonName}{" "}
        <RarityBadge rarity={captureRarity(item)} prefix="Captura " feminine />
      </h1>
      <section
        className="card capture-detail-card"
        style={{ padding: "1.5rem" }}
      >
        {isRecord && (
          <span
            className="record-crown detail-crown"
            title="Récord de la especie"
            aria-label="Récord de la especie"
          >
            ♛
          </span>
        )}
        {item.photos.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {item.photos.map((photo) => (
              <Image
                key={photo.id}
                unoptimized
                src={`/api/photos/${photo.id}`}
                alt={`Captura de ${item.species.commonName}`}
                width={photo.width || 800}
                height={photo.height || 600}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  borderRadius: 16,
                }}
              />
            ))}
          </div>
        )}
        <p>
          <Link
            href={`/pescadores/${item.fisher.id}`}
            style={{ fontWeight: 800 }}
          >
            {item.fisher.displayName}
          </Link>{" "}
          en{" "}
          <Link
            className="place-preview-link"
            href={`/mapa?place=${item.place.id}`}
          >
            {item.place.name}
            {item.place.placeImageId && (
              <span className="place-preview">
                <Image
                  unoptimized
                  src={`/api/assets/${item.place.placeImageId}?size=thumb`}
                  alt={item.place.name}
                  width={260}
                  height={180}
                />
              </span>
            )}
          </Link>
        </p>
        <p>
          {Number(item.lengthCm)} cm{" "}
          {item.weightG ? `· ${Number(item.weightG)} g` : ""}
        </p>
        <p>{formatDateTime(item.caughtAt)}</p>
        <p>
          <b>{scoreCatch(item, isRecord)} RP</b>
        </p>
        <p>{item.notes}</p>
      </section>
      {editable && (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Link
            replace
            className="button secondary"
            href={`/capturas/${id}/editar`}
          >
            Editar
          </Link>
          <form action={deleteCatchAction.bind(null, id)}>
            <ConfirmSubmit message="La captura se archivará y dejará de aparecer en los catálogos. ¿Continuar?">
              Eliminar captura
            </ConfirmSubmit>
          </form>
        </div>
      )}
    </>
  );
}

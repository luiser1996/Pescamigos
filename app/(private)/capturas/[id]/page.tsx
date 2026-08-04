import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCatchAction } from "@/app/actions/catches";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditCatch } from "@/lib/validation";
import { ConfirmSubmit } from "@/components/confirm-submit";

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
      <h1>{item.species.commonName}</h1>
      <section className="card" style={{ padding: "1.5rem" }}>
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
        <p>{item.caughtAt.toLocaleString("es-ES")}</p>
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

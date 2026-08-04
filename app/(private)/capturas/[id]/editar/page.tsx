import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import {
  deleteCatchPhotoAction,
  updateCatchAction,
} from "@/app/actions/catches";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditCatch } from "@/lib/validation";
import { ImageCropInput } from "@/components/image-crop-input";
import { PlacePicker } from "@/components/place-picker";
import { SubmitButton } from "@/components/submit-button";
import { ValidatedFileInput } from "@/components/validated-file-input";
import { ConfirmSubmit } from "@/components/confirm-submit";

export default async function EditCatch({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; photoDeleted?: string }>;
}) {
  const actor = await requireUser();
  const { id } = await params;
  const item = await prisma.catch.findFirst({
    where: { id, deletedAt: null },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!item) notFound();
  if (!canEditCatch(actor, item.fisherId)) redirect(`/capturas/${id}`);
  const places = await prisma.fishingPlace.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
  });
  const { error, photoDeleted } = await searchParams;
  const action = updateCatchAction.bind(null, id);
  const localDate = new Date(
    item.caughtAt.getTime() - item.caughtAt.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  return (
    <>
      <h1>Editar captura</h1>
      {error && <p role="alert">{error}</p>}
      {photoDeleted && <p role="status">✓ Fotografía eliminada.</p>}
      {item.photos.length > 0 && (
        <section className="card" style={{ padding: "1rem", marginBottom: 12 }}>
          <h2>Fotos guardadas</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 8,
            }}
          >
            {item.photos.map((photo) => (
              <div key={photo.id} className="card" style={{ padding: 6 }}>
                <Image
                  unoptimized
                  src={`/api/photos/${photo.id}`}
                  alt={photo.isPrimary ? "Foto de portada" : "Foto adicional"}
                  width={photo.width || 400}
                  height={photo.height || 300}
                  style={{ width: "100%", height: "auto", borderRadius: 12 }}
                />
                <small>{photo.isPrimary ? "Portada" : "Adicional"}</small>
                <form action={deleteCatchPhotoAction.bind(null, photo.id)}>
                  <ConfirmSubmit message="¿Eliminar esta fotografía?">
                    Eliminar
                  </ConfirmSubmit>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
      <form
        action={action}
        className="card"
        style={{ padding: "1.2rem", display: "grid", gap: 12 }}
      >
        <input type="hidden" name="speciesId" value={item.speciesId} />
        <PlacePicker places={places} selectedPlaceId={item.placeId} />
        <label className="field">
          Fecha y hora
          <input
            name="caughtAt"
            type="datetime-local"
            defaultValue={localDate}
            required
          />
        </label>
        <label className="field">
          Longitud (cm)
          <input
            name="lengthCm"
            type="number"
            step="0.1"
            min="0.1"
            max="500"
            defaultValue={Number(item.lengthCm)}
            required
          />
        </label>
        <label className="field">
          Peso (g)
          <input
            name="weightG"
            type="number"
            step="0.1"
            min="0.1"
            max="1000000"
            defaultValue={item.weightG ? Number(item.weightG) : ""}
          />
        </label>
        <label className="field">
          Entorno de pesca
          <select
            name="mode"
            defaultValue={
              item.mode === "SHORE" || item.mode === "BOAT"
                ? "OTHER"
                : item.mode
            }
          >
            <option value="RIVER">Río</option>
            <option value="RESERVOIR">Pantano</option>
            <option value="LAKE">Lago</option>
            <option value="BEACH">Playa</option>
            <option value="PORT">Puerto</option>
            <option value="OTHER">Otra</option>
          </select>
        </label>
        <label className="field">
          Resultado
          <select name="disposition" defaultValue={item.disposition}>
            <option value="RELEASED">Liberada</option>
            <option value="KEPT">Conservada</option>
          </select>
        </label>
        <label className="field">
          Notas
          <textarea
            name="notes"
            rows={5}
            maxLength={2000}
            defaultValue={item.notes ?? ""}
          />
        </label>
        <ImageCropInput
          name="primaryPhoto"
          label="Cambiar fotografía principal"
          prefix="primary"
        />
        <label className="field">
          Añadir fotografías
          <ValidatedFileInput name="photos" multiple />
        </label>
        <SubmitButton>Guardar cambios</SubmitButton>
      </form>
    </>
  );
}

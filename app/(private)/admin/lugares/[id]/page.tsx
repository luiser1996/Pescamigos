import { notFound } from "next/navigation";
import { deletePlaceAction, updatePlaceAction } from "@/app/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { prisma } from "@/lib/prisma";
import { LocationEditor } from "@/components/location-editor";
import { updatePlaceImageAction } from "@/app/actions/media";
import Image from "next/image";
export default async function EditPlace({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; image?: string; error?: string }>;
}) {
  const { id } = await params;
  const place = await prisma.fishingPlace.findUnique({ where: { id } });
  if (!place) notFound();
  const { saved, image, error } = await searchParams;
  return (
    <>
      <h1>Editar lugar</h1>
      {saved && <p role="status">✓ Lugar actualizado.</p>}
      {image && <p role="status">✓ Foto del lugar actualizada.</p>}
      {error && <p role="alert">{error}</p>}
      <section className="card" style={{ padding: "1rem", marginBottom: 12 }}>
        <h2>Foto del lugar</h2>
        {place.placeImageId && (
          <Image
            unoptimized
            src={`/api/assets/${place.placeImageId}`}
            alt={place.name}
            width={800}
            height={500}
            style={{
              width: "100%",
              maxHeight: 340,
              objectFit: "cover",
              borderRadius: 14,
            }}
          />
        )}
        <form
          action={updatePlaceImageAction.bind(null, id)}
          style={{ display: "grid", gap: 8, marginTop: 8 }}
        >
          <label className="field">
            Nueva foto
            <input
              name="placeImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <button className="button">Guardar foto</button>
        </form>
      </section>
      <form
        action={updatePlaceAction.bind(null, id)}
        className="card"
        style={{ padding: "1.2rem", display: "grid", gap: 10 }}
      >
        <label className="field">
          Nombre
          <input name="name" defaultValue={place.name} required />
        </label>
        <LocationEditor
          latitude={Number(place.latitude)}
          longitude={Number(place.longitude)}
        />
        <label className="field">
          Agua
          <select name="waterType" defaultValue={place.waterType}>
            <option value="FRESHWATER">Dulce</option>
            <option value="SALTWATER">Salada</option>
            <option value="BRACKISH">Salobre</option>
          </select>
        </label>
        <button className="button">Guardar y mover chincheta</button>
      </form>
      <form action={deletePlaceAction.bind(null, id)} style={{ marginTop: 14 }}>
        <ConfirmSubmit message="Se eliminarán definitivamente el lugar, sus capturas y fotografías. Esta acción no se puede deshacer. ¿Continuar?">
          Eliminar definitivamente
        </ConfirmSubmit>
      </form>
    </>
  );
}

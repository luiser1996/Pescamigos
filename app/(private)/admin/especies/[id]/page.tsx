import { notFound } from "next/navigation";
import { deleteSpeciesAction, updateSpeciesAction } from "@/app/actions/admin";
import { updateSpeciesImagesAction } from "@/app/actions/media";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmit } from "@/components/confirm-submit";
import Image from "next/image";
import { ImageCropInput } from "@/components/image-crop-input";
const fields = [
  ["description", "Descripción"],
  ["curiosities", "Curiosidades"],
  ["habitat", "Hábitat"],
  ["granadaDistribution", "Distribución en Granada"],
  ["usualDepth", "Profundidad habitual"],
  ["conservationStatus", "Estado de conservación"],
  ["legalStatus", "Estado legal/regulatorio"],
  ["closedSeasonNotes", "Observaciones sobre vedas"],
  ["invasiveNotes", "Especies invasoras"],
  ["biologicalSeasonNotes", "Temporada biológica"],
] as const;
export default async function EditSpecies({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; images?: string; error?: string }>;
}) {
  const { id } = await params;
  const item = await prisma.species.findUnique({ where: { id } });
  if (!item) notFound();
  const status = await searchParams;
  return (
    <>
      <h1>Editar {item.commonName}</h1>
      {(status.saved || status.images) && (
        <p role="status">✓ Cambios guardados.</p>
      )}
      {status.error && <p role="alert">{status.error}</p>}
      <section className="card" style={{ padding: "1.2rem", marginBottom: 14 }}>
        <h2>Imágenes</h2>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {item.catalogImageId && (
            <div>
              <b>Catálogo actual</b>
              <Image
                unoptimized
                src={`/api/assets/${item.catalogImageId}`}
                alt="Imagen actual de catálogo"
                width={400}
                height={260}
                style={{ width: "100%", height: 180, objectFit: "contain" }}
              />
            </div>
          )}
          {item.detailImageId && (
            <div>
              <b>Detalle actual</b>
              <Image
                unoptimized
                src={`/api/assets/${item.detailImageId}`}
                alt="Imagen actual de detalle"
                width={400}
                height={260}
                style={{ width: "100%", height: 180, objectFit: "contain" }}
              />
            </div>
          )}
        </div>
        <form
          action={updateSpeciesImagesAction.bind(null, id)}
          style={{ display: "grid", gap: 10 }}
        >
          <label className="field">
            Imagen del catálogo cuando está descubierta
            <input
              name="catalogImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </label>
          <ImageCropInput
            name="detailImage"
            label="Imagen grande de la ficha de detalle"
            prefix="detail"
          />
          <button className="button">Guardar imágenes</button>
        </form>
      </section>
      <form
        action={updateSpeciesAction.bind(null, id)}
        className="card"
        style={{ padding: "1.2rem", display: "grid", gap: 10 }}
      >
        <label className="field">
          Slug
          <input name="slug" defaultValue={item.slug} required />
        </label>
        <label className="field">
          Nombre común
          <input name="commonName" defaultValue={item.commonName} required />
        </label>
        <label className="field">
          Nombre científico
          <input
            name="scientificName"
            defaultValue={item.scientificName}
            required
          />
        </label>
        <label className="field">
          Otros nombres, separados por comas
          <input
            name="alternateNames"
            defaultValue={item.alternateNames.join(", ")}
          />
        </label>
        <label className="field">
          Tipo de agua
          <select name="waterType" defaultValue={item.waterType}>
            <option value="FRESHWATER">Dulce</option>
            <option value="SALTWATER">Salada</option>
            <option value="BRACKISH">Salobre</option>
          </select>
        </label>
        {fields.map(([name, label]) => (
          <label className="field" key={name}>
            {label}
            <textarea name={name} rows={3} defaultValue={item[name] ?? ""} />
          </label>
        ))}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 8,
          }}
        >
          <label className="field">
            Tamaño habitual (cm)
            <input
              name="usualSizeCm"
              type="number"
              step=".1"
              defaultValue={item.usualSizeCm ? Number(item.usualSizeCm) : ""}
            />
          </label>
          <label className="field">
            Máximo documentado (cm)
            <input
              name="documentedMaxSizeCm"
              type="number"
              step=".1"
              defaultValue={
                item.documentedMaxSizeCm ? Number(item.documentedMaxSizeCm) : ""
              }
            />
          </label>
          <label className="field">
            Peso habitual (g)
            <input
              name="usualWeightG"
              type="number"
              step=".1"
              defaultValue={item.usualWeightG ? Number(item.usualWeightG) : ""}
            />
          </label>
          <label className="field">
            Dificultad 1–5
            <input
              name="difficulty"
              type="number"
              min="1"
              max="5"
              defaultValue={item.difficulty ?? ""}
            />
          </label>
        </div>
        <label className="field">
          Franjas de actividad, separadas por comas
          <input
            name="activityTimes"
            defaultValue={item.activityTimes.join(", ")}
          />
        </label>
        <label className="field">
          Técnicas, separadas por comas
          <input name="techniques" defaultValue={item.techniques.join(", ")} />
        </label>
        <label className="field">
          Cebos, separados por comas
          <input name="baits" defaultValue={item.baits.join(", ")} />
        </label>
        <fieldset>
          <legend>Meses de mayor actividad</legend>
          {Array.from({ length: 12 }, (_, i) => (
            <label
              key={i}
              style={{ display: "inline-flex", padding: 8, gap: 4 }}
            >
              <input
                type="checkbox"
                name="activeMonths"
                value={i + 1}
                defaultChecked={item.activeMonths.includes(i + 1)}
              />
              {i + 1}
            </label>
          ))}
        </fieldset>
        <label className="field">
          Estado de revisión
          <select
            name="verificationStatus"
            defaultValue={item.verificationStatus}
          >
            <option value="PENDING">Pendiente</option>
            <option value="NEEDS_REVIEW">Necesita revisión</option>
            <option value="VERIFIED">Verificada</option>
          </select>
        </label>
        <button className="button">Guardar todos los detalles</button>
      </form>
      <form
        action={deleteSpeciesAction.bind(null, id)}
        style={{ marginTop: 14 }}
      >
        <ConfirmSubmit message="Se eliminarán definitivamente la especie, sus capturas y fotografías. Esta acción no se puede deshacer. ¿Continuar?">
          Eliminar definitivamente
        </ConfirmSubmit>
      </form>
    </>
  );
}

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createCatchAction } from "@/app/actions/catches";
import { PlacePicker } from "@/components/place-picker";
import { ImageCropInput } from "@/components/image-crop-input";
import { SubmitButton } from "@/components/submit-button";
import { ValidatedFileInput } from "@/components/validated-file-input";
export default async function NewCatch({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; species?: string }>;
}) {
  // El valor se calcula una sola vez al renderizar esta página de servidor.
  // eslint-disable-next-line react-hooks/purity
  const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const { error, species: selectedSpecies } = await searchParams;
  const [species, places] = await Promise.all([
    prisma.species.findMany({
      where: { archivedAt: null },
      orderBy: { commonName: "asc" },
    }),
    prisma.fishingPlace.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <>
      <h1>Añadir captura</h1>
      <p>Guarda el recuerdo en unos pocos pasos.</p>
      {error && (
        <p role="alert" style={{ color: "#9b2c2c" }}>
          {error}
        </p>
      )}
      <form
        action={createCatchAction}
        className="card"
        style={{
          padding: "1.2rem",
          display: "grid",
          gap: "1rem",
          maxWidth: 700,
        }}
      >
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <label className="field">
          1. Especie
          <select
            name="speciesId"
            required
            defaultValue={selectedSpecies ?? ""}
          >
            <option value="">Elige una especie</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.commonName}
              </option>
            ))}
          </select>
        </label>
        <PlacePicker places={places} />
        <label className="field">
          3. Fecha y hora
          <input
            type="datetime-local"
            name="caughtAt"
            defaultValue={localNow}
            required
          />
        </label>
        <label className="field">
          4. Longitud (cm)
          <input
            type="number"
            inputMode="decimal"
            name="lengthCm"
            min="0.1"
            max="500"
            step="0.1"
            required
          />
        </label>
        <label className="field">
          5. Peso opcional (g)
          <input
            type="number"
            inputMode="decimal"
            name="weightG"
            min="0.1"
            max="1000000"
            step="0.1"
          />
        </label>
        <label className="field">
          6. Entorno de pesca
          <select name="mode" defaultValue="RIVER">
            <option value="RIVER">Río</option>
            <option value="RESERVOIR">Pantano</option>
            <option value="LAKE">Lago</option>
            <option value="BEACH">Playa</option>
            <option value="PORT">Puerto</option>
            <option value="OTHER">Otra</option>
          </select>
        </label>
        <label className="field">
          7. Resultado
          <select name="disposition">
            <option value="RELEASED">Liberada</option>
            <option value="KEPT">Conservada</option>
          </select>
        </label>
        <ImageCropInput
          name="photo"
          label="8. Foto principal"
          prefix="photo"
          required
        />
        <label className="field">
          Fotografías adicionales (opcional, máximo 5)
          <ValidatedFileInput name="photos" multiple />
        </label>
        <label className="field">
          9. Notas
          <textarea name="notes" rows={4} maxLength={2000} />
        </label>
        <SubmitButton>Guardar captura</SubmitButton>
      </form>
    </>
  );
}

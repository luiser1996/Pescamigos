"use client";

import { useState } from "react";
import { saveAdminAquariumAction } from "@/app/actions/admin-aquarium";
import { DecorationSprite } from "@/components/decoration-sprite";
import { SubmitButton } from "@/components/submit-button";
import {
  type AquariumBehavior,
  type AquariumFish,
  type PlacedDecoration,
  VirtualAquarium,
} from "@/components/virtual-aquarium";
import { decorations, decorationRarityLabels } from "@/lib/decorations";

type SpeciesOption = {
  id: string;
  name: string;
  catalogImageId: string | null;
  behavior: AquariumBehavior;
  usualSizeCm: number;
};
type TestFish = AquariumFish & { speciesId: string };

export function AdminAquariumEditor({
  species,
  initialFish,
  initialDecorations,
}: {
  species: SpeciesOption[];
  initialFish: TestFish[];
  initialDecorations: PlacedDecoration[];
}) {
  const [fish, setFish] = useState(initialFish);
  const [placed, setPlaced] = useState(initialDecorations);
  const [speciesId, setSpeciesId] = useState(species[0]?.id ?? "");
  const selectedSpecies = species.find((item) => item.id === speciesId);
  const [lengthCm, setLengthCm] = useState(selectedSpecies?.usualSizeCm ?? 30);
  const [decorationQuery, setDecorationQuery] = useState("");
  const [activeDecorationId, setActiveDecorationId] = useState<string | null>(
    null,
  );
  const addFish = () => {
    const item = species.find((entry) => entry.id === speciesId);
    if (!item) return;
    setFish((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        speciesId: item.id,
        name: item.name,
        lengthCm,
        catalogImageId: item.catalogImageId,
        behavior: item.behavior,
        flipCatalogImage: item.name.toLocaleLowerCase("es") === "platija",
        detailHref: null,
      },
    ]);
  };
  const addDecoration = (slug: string, rarity: string) => {
    const id = crypto.randomUUID();
    setPlaced((current) => [
      ...current,
      { id, slug, rarity, xPct: 50, yPct: 70, scale: 1 },
    ]);
    setActiveDecorationId(id);
  };
  return (
    <form
      action={saveAdminAquariumAction}
      className="aquarium-editor admin-aquarium-editor"
    >
      <input
        type="hidden"
        name="fish"
        value={JSON.stringify(
          fish.map((item) => ({
            speciesId: item.speciesId,
            lengthCm: item.lengthCm,
          })),
        )}
      />
      <input
        type="hidden"
        name="decorations"
        value={JSON.stringify(
          placed.map(({ slug, xPct, yPct, scale }) => ({
            slug,
            xPct,
            yPct,
            scale,
          })),
        )}
      />
      <div className="aquarium-editor-heading">
        <div>
          <h1>Pecera de pruebas</h1>
          <p>
            Compartida entre administradores. Aquí puedes repetir y probar
            cualquier pez o decoración.
          </p>
        </div>
        <SubmitButton>Guardar pecera común</SubmitButton>
      </div>
      <VirtualAquarium
        fish={fish}
        decorations={placed}
        editableDecorations
        pendingDecorationId={activeDecorationId}
        onPlaceDecoration={(id, xPct, yPct) => {
          setPlaced((current) =>
            current.map((item) =>
              item.id === id ? { ...item, xPct, yPct } : item,
            ),
          );
          setActiveDecorationId(null);
        }}
        onRemoveDecoration={(id) =>
          setPlaced((current) => current.filter((item) => item.id !== id))
        }
        onSelectDecoration={setActiveDecorationId}
      />
      <section className="card admin-aquarium-controls">
        <h2>Añadir peces</h2>
        <div className="admin-fish-add">
          <label className="field">
            Especie
            <select
              value={speciesId}
              onChange={(event) => {
                setSpeciesId(event.target.value);
                const next = species.find(
                  (item) => item.id === event.target.value,
                );
                if (next) setLengthCm(next.usualSizeCm);
              }}
            >
              {species.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Longitud (cm)
            <input
              type="number"
              min="1"
              max="500"
              step="0.1"
              value={lengthCm}
              onChange={(event) => setLengthCm(Number(event.target.value))}
            />
          </label>
          <button type="button" className="button" onClick={addFish}>
            Añadir pez
          </button>
        </div>
        <div className="admin-test-fish-list">
          {fish.map((item) => (
            <span key={item.id}>
              {item.name} · {item.lengthCm} cm{" "}
              <button
                type="button"
                onClick={() =>
                  setFish((current) =>
                    current.filter((fishItem) => fishItem.id !== item.id),
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>
      <section className="card admin-aquarium-controls">
        <h2>Añadir decoraciones</h2>
        <p>Puedes añadir el mismo objeto tantas veces como necesites.</p>
        <label className="field">
          Buscar decoración
          <input
            type="search"
            value={decorationQuery}
            onChange={(event) => setDecorationQuery(event.target.value)}
          />
        </label>
        <div className="decoration-inventory-grid">
          {decorations
            .filter((item) =>
              item.name
                .toLocaleLowerCase("es")
                .includes(decorationQuery.toLocaleLowerCase("es")),
            )
            .map((item) => (
              <button
                type="button"
                className={`decoration-inventory-card rarity-bg-${item.rarity.toLowerCase().replace("_", "-")}`}
                key={item.slug}
                onClick={() => addDecoration(item.slug, item.rarity)}
              >
                <DecorationSprite slug={item.slug} />
                <b>{item.name}</b>
                <small>{decorationRarityLabels[item.rarity]}</small>
              </button>
            ))}
        </div>
      </section>
    </form>
  );
}

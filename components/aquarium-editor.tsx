"use client";

import Image from "next/image";
import { useState } from "react";
import { saveAquariumAction } from "@/app/actions/aquarium";
import { SubmitButton } from "@/components/submit-button";
import { type AquariumFish, VirtualAquarium } from "@/components/virtual-aquarium";

type CatchOption = AquariumFish & { caughtAt: string };

export function AquariumEditor({
  catches,
  initialIds,
}: {
  catches: CatchOption[];
  initialIds: string[];
}) {
  const [selected, setSelected] = useState(() => new Set(initialIds));
  const preview = catches.filter((item) => selected.has(item.id));

  return (
    <form action={saveAquariumAction} className="aquarium-editor">
      <section>
        <div className="aquarium-editor-heading">
          <div>
            <h1>Editar pecera</h1>
            <p>Elige únicamente entre tus capturas. El tamaño depende de la longitud registrada.</p>
          </div>
          <SubmitButton>Guardar pecera</SubmitButton>
        </div>
        <VirtualAquarium fish={preview} compact />
      </section>
      <section className="card aquarium-catch-selector">
        <h2>Tus peces</h2>
        {catches.length === 0 ? (
          <p>Aún no tienes capturas que puedas añadir.</p>
        ) : (
          <div className="aquarium-catch-grid">
            {catches.map((item) => (
              <label
                className={`aquarium-catch-option${selected.has(item.id) ? " selected" : ""}`}
                key={item.id}
              >
                <input
                  type="checkbox"
                  name="catchIds"
                  value={item.id}
                  checked={selected.has(item.id)}
                  onChange={(event) => {
                    const next = new Set(selected);
                    if (event.target.checked) next.add(item.id);
                    else next.delete(item.id);
                    setSelected(next);
                  }}
                />
                <span className="aquarium-option-image">
                  {item.catalogImageId ? (
                    <Image
                      unoptimized
                      fill
                      sizes="120px"
                      src={`/api/assets/${item.catalogImageId}`}
                      alt={item.name}
                    />
                  ) : (
                    <span>🐟</span>
                  )}
                </span>
                <span>
                  <b>{item.name}</b>
                  <small>{item.lengthCm} cm · {item.caughtAt}</small>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>
    </form>
  );
}

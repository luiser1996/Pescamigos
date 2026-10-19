"use client";

import { useState } from "react";
import {
  craftDecorationsAction,
  dismantleDecorationAction,
} from "@/app/actions/decorations";
import { DecorationSprite } from "@/components/decoration-sprite";
import {
  decorationBySlug,
  decorationRarityLabels,
  rarityOrder,
} from "@/lib/decorations";

type Item = { id: string; slug: string; rarity: (typeof rarityOrder)[number] };

export function DecorationCrafting({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState(new Set<string>());
  return (
    <div className="craft-page">
      <h1>Crafteo de decoraciones</h1>
      <p>
        Combina 5 objetos de la misma rareza para obtener uno del nivel
        siguiente. También puedes convertir uno en 3 del nivel anterior.
      </p>
      {rarityOrder.map((rarity) => {
        const group = items.filter((item) => item.rarity === rarity);
        if (!group.length) return null;
        const selectedHere = group.filter((item) => selected.has(item.id));
        return (
          <section className="card craft-tier" key={rarity}>
            <h2>
              {decorationRarityLabels[rarity]} ({group.length})
            </h2>
            <div className="decoration-inventory-grid">
              {group.map((item) => {
                const definition = decorationBySlug.get(item.slug);
                return (
                  <label
                    className={`decoration-inventory-card rarity-bg-${rarity.toLowerCase().replace("_", "-")}${selected.has(item.id) ? " selected" : ""}`}
                    key={item.id}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(item.id);
                        else next.delete(item.id);
                        setSelected(next);
                      }}
                    />
                    <DecorationSprite slug={item.slug} />
                    <b>{definition?.name ?? item.slug}</b>
                  </label>
                );
              })}
            </div>
            <div className="craft-actions">
              {rarity !== "LEGENDARY" && (
                <form action={craftDecorationsAction}>
                  {selectedHere.slice(0, 5).map((item) => (
                    <input
                      key={item.id}
                      type="hidden"
                      name="decorationIds"
                      value={item.id}
                    />
                  ))}
                  <button
                    className="button"
                    disabled={selectedHere.length !== 5}
                  >
                    Forjar con 5
                  </button>
                </form>
              )}
              {rarity !== "COMMON" && selectedHere.length === 1 && (
                <form action={dismantleDecorationAction}>
                  <input
                    type="hidden"
                    name="decorationId"
                    value={selectedHere[0].id}
                  />
                  <button className="button secondary">Descraftear en 3</button>
                </form>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

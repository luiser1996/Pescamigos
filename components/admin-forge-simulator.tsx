"use client";

import { useMemo, useState } from "react";
import { DecorationSprite } from "@/components/decoration-sprite";
import {
  decorationBySlug,
  decorationRarityLabels,
  decorations,
  rarityOrder,
} from "@/lib/decorations";

type Mode = "CRAFT" | "DISMANTLE";
type Rarity = (typeof rarityOrder)[number];

const randomFromRarity = (rarity: Rarity) => {
  const pool = decorations.filter((item) => item.rarity === rarity);
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return pool[value[0] % pool.length].slug;
};

const rarityClass = (rarity: Rarity) =>
  `rarity-bg-${rarity.toLowerCase().replace("_", "-")}`;

export function AdminForgeSimulator() {
  const [mode, setMode] = useState<Mode>("CRAFT");
  const [rarity, setRarity] = useState<Rarity>("COMMON");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [rewards, setRewards] = useState<string[]>([]);
  const validRarities = useMemo(
    () => (mode === "CRAFT" ? rarityOrder.slice(0, -1) : rarityOrder.slice(1)),
    [mode],
  );

  const changeMode = (next: Mode) => {
    setMode(next);
    setRarity(next === "CRAFT" ? "COMMON" : "RARE");
    setIngredients([]);
    setRewards([]);
  };

  const simulate = () => {
    const index = rarityOrder.indexOf(rarity);
    if (mode === "CRAFT") {
      setIngredients(Array.from({ length: 5 }, () => randomFromRarity(rarity)));
      setRewards([randomFromRarity(rarityOrder[index + 1])]);
    } else {
      setIngredients([randomFromRarity(rarity)]);
      setRewards(
        Array.from({ length: 3 }, () =>
          randomFromRarity(rarityOrder[index - 1]),
        ),
      );
    }
  };

  return (
    <div className="chest-page">
      <section className="card chest-summary">
        <div>
          <h1>Simulador de forja</h1>
          <p>
            Prueba combinaciones y desmantelados sin consumir ni añadir
            decoraciones.
          </p>
        </div>
      </section>
      <section className="card admin-aquarium-controls">
        <div className="forge-simulator-controls">
          <div className="segmented-control" aria-label="Tipo de simulación">
            <button
              type="button"
              className={mode === "CRAFT" ? "active" : ""}
              onClick={() => changeMode("CRAFT")}
            >
              Forjar 5 en 1
            </button>
            <button
              type="button"
              className={mode === "DISMANTLE" ? "active" : ""}
              onClick={() => changeMode("DISMANTLE")}
            >
              Desmantelar 1 en 3
            </button>
          </div>
          <label className="field">
            Rareza de origen
            <select
              value={rarity}
              onChange={(event) => {
                setRarity(event.target.value as Rarity);
                setIngredients([]);
                setRewards([]);
              }}
            >
              {validRarities.map((value) => (
                <option key={value} value={value}>
                  {decorationRarityLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="button" onClick={simulate}>
            Simular
          </button>
        </div>
      </section>
      {ingredients.length > 0 && (
        <section className="card admin-aquarium-controls">
          <div className="forge-simulator-items">
            {ingredients.map((slug, index) => {
              const item = decorationBySlug.get(slug)!;
              return (
                <div
                  className={`forge-simulator-item ${rarityClass(item.rarity)}`}
                  key={`ingredient-${index}-${slug}`}
                >
                  <DecorationSprite slug={slug} />
                  <b>{item.name}</b>
                </div>
              );
            })}
            <span className="forge-simulator-arrow" aria-hidden="true">
              →
            </span>
            {rewards.map((slug, index) => {
              const item = decorationBySlug.get(slug)!;
              return (
                <div
                  className={`forge-simulator-item ${rarityClass(item.rarity)}`}
                  key={`reward-${index}-${slug}`}
                >
                  <DecorationSprite slug={slug} />
                  <b>{item.name}</b>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

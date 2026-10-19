"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { DecorationSprite } from "@/components/decoration-sprite";
import {
  decorationBySlug,
  decorationOdds,
  decorationRarityLabels,
  decorations,
  rarityOrder,
} from "@/lib/decorations";

const randomNumber = (limit: number) => {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % limit;
};

export function AdminChestSimulator() {
  const [strip, setStrip] = useState<string[]>([]);
  const [rolling, setRolling] = useState(false);
  const [reward, setReward] = useState<string>();
  const [run, setRun] = useState(0);
  const [continuesFromPrevious, setContinuesFromPrevious] = useState(false);
  const settledSlug = useRef<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const simulate = () => {
    const roll = randomNumber(100);
    const rarity =
      roll < 50
        ? "COMMON"
        : roll < 80
          ? "RARE"
          : roll < 95
            ? "VERY_RARE"
            : "LEGENDARY";
    const pool = decorations.filter((item) => item.rarity === rarity);
    const winner = pool[randomNumber(pool.length)].slug;
    const previousSlug = settledSlug.current;
    const targetIndex = previousSlug ? 39 : 19;
    const next = Array.from(
      { length: previousSlug ? 43 : 23 },
      () => decorations[randomNumber(decorations.length)].slug,
    );
    if (previousSlug) next[19] = previousSlug;
    next[targetIndex] = winner;
    setStrip(next);
    setContinuesFromPrevious(Boolean(previousSlug));
    setRun((value) => value + 1);
    setReward(undefined);
    setRolling(true);
    timer.current = setTimeout(() => {
      settledSlug.current = winner;
      setRolling(false);
      setReward(winner);
    }, 9200);
  };
  const won = reward ? decorationBySlug.get(reward) : undefined;
  const stripStyle = {
    "--chest-start-x": continuesFromPrevious ? "-2740px" : "0px",
    "--chest-end-x": continuesFromPrevious ? "-5540px" : "-2740px",
  } as CSSProperties;
  return (
    <div className="chest-page">
      <section className="card chest-summary">
        <div>
          <h1>Simulador de cofres</h1>
          <p>
            Prueba la apertura real sin gastar cofres ni añadir objetos al
            inventario.
          </p>
        </div>
      </section>
      <section className="rarity-odds">
        {rarityOrder.map((rarity) => (
          <div
            className={`rarity-odds-item rarity-bg-${rarity.toLowerCase().replace("_", "-")}`}
            key={rarity}
          >
            <b>{decorationRarityLabels[rarity]}</b>
            <span>{decorationOdds[rarity]}%</span>
          </div>
        ))}
      </section>
      <section className="card chest-machine">
        <div className="chest-roulette-window">
          <span className="chest-pointer" aria-hidden="true" />
          {strip.length ? (
            <div
              className={`chest-strip ${rolling ? "rolling" : "settled"}`}
              key={run}
              style={stripStyle}
            >
              {strip.map((slug, index) => {
                const item = decorationBySlug.get(slug)!;
                return (
                  <div
                    className={`chest-strip-item rarity-bg-${item.rarity.toLowerCase().replace("_", "-")}`}
                    key={`${slug}-${index}`}
                  >
                    <DecorationSprite slug={slug} />
                    <small>{item.name}</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="chest-placeholder">
              Pulsa el botón para simular una apertura.
            </p>
          )}
        </div>
        <button
          type="button"
          className="button chest-open-button"
          disabled={rolling}
          onClick={simulate}
        >
          {rolling ? "Abriendo…" : "Simular apertura"}
        </button>
        {won && !rolling && (
          <div
            className={`chest-reward rarity-bg-${won.rarity.toLowerCase().replace("_", "-")}`}
          >
            <DecorationSprite slug={won.slug} />
            <div>
              <span>Resultado simulado</span>
              <h2>{won.name}</h2>
              <p>{won.description}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

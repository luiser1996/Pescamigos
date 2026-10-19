"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { openChestAction } from "@/app/actions/decorations";
import { DecorationSprite } from "@/components/decoration-sprite";
import {
  decorationBySlug,
  decorationOdds,
  decorationRarityLabels,
  decorations,
  rarityOrder,
} from "@/lib/decorations";

export function ChestOpener({
  initialAvailable,
}: {
  initialAvailable: number;
}) {
  const [state, action, pending] = useActionState(openChestAction, {
    available: initialAvailable,
  });
  const [revealedNonce, setRevealedNonce] = useState<string>();
  const strip = useMemo(() => {
    if (!state.slug || !state.nonce) return [];
    let value =
      [...state.nonce].reduce(
        (sum, character) => Math.imul(sum ^ character.charCodeAt(0), 16777619),
        2166136261,
      ) >>> 0;
    const result = Array.from({ length: 23 }, () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return decorations[value % decorations.length].slug;
    });
    result[19] = state.slug;
    return result;
  }, [state.slug, state.nonce]);
  useEffect(() => {
    if (!state.slug || !state.nonce) return;
    const nonce = state.nonce;
    const timer = setTimeout(() => setRevealedNonce(nonce), 4600);
    return () => clearTimeout(timer);
  }, [state.slug, state.nonce]);
  const rolling = Boolean(state.nonce && revealedNonce !== state.nonce);
  const won =
    state.slug && !rolling ? decorationBySlug.get(state.slug) : undefined;
  return (
    <div className="chest-page">
      <section className="card chest-summary">
        <div>
          <h1>Cofres</h1>
          <p>
            Tienes <b>{state.available}</b>{" "}
            {state.available === 1 ? "cofre disponible" : "cofres disponibles"}.
          </p>
        </div>
        <Link className="button secondary" href="/cofres/crafteo">
          Craftear decoraciones
        </Link>
      </section>
      <section className="rarity-odds" aria-label="Probabilidades">
        {rarityOrder.map((rarity) => (
          <div
            className={`rarity-odds-item rarity-${rarity.toLowerCase().replace("_", "-")}`}
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
              className={`chest-strip${rolling ? " rolling" : ""}`}
              key={state.nonce}
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
              Abre un cofre para descubrir una decoración.
            </p>
          )}
        </div>
        <form action={action}>
          <button
            className="button chest-open-button"
            disabled={pending || rolling || state.available < 1}
          >
            {pending ? "Preparando…" : rolling ? "Abriendo…" : "Abrir cofre"}
          </button>
        </form>
        {state.error && <p className="form-error">{state.error}</p>}
        {won && !rolling && (
          <div
            className={`chest-reward rarity-bg-${won.rarity.toLowerCase().replace("_", "-")}`}
          >
            <DecorationSprite slug={won.slug} />
            <div>
              <span>Has conseguido</span>
              <h2>{won.name}</h2>
              <p>{won.description}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

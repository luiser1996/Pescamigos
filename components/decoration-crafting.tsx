"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  type CraftState,
  craftDecorationsAction,
  dismantleDecorationAction,
} from "@/app/actions/decorations";
import { DecorationSprite } from "@/components/decoration-sprite";
import {
  decorationBySlug,
  decorationRarityLabels,
  rarityOrder,
} from "@/lib/decorations";

type Rarity = (typeof rarityOrder)[number];
type Item = { id: string; slug: string; rarity: Rarity };
type Result = { nonce: string; rewards: string[]; kind: "craft" | "dismantle" };
type Group = { slug: string; rarity: Rarity; ids: string[] };

const emptyState: CraftState = {};

function grouped(items: Item[]) {
  const groups = new Map<string, Group>();
  for (const item of items) {
    const key = `${item.rarity}:${item.slug}`;
    const current = groups.get(key);
    if (current) current.ids.push(item.id);
    else
      groups.set(key, { slug: item.slug, rarity: item.rarity, ids: [item.id] });
  }
  return [...groups.values()].sort((a, b) =>
    (decorationBySlug.get(a.slug)?.name ?? a.slug).localeCompare(
      decorationBySlug.get(b.slug)?.name ?? b.slug,
      "es",
    ),
  );
}

export function DecorationCrafting({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [lastAction, setLastAction] = useState<Result["kind"] | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const [craftState, craftAction, craftPending] = useActionState(
    craftDecorationsAction,
    emptyState,
  );
  const [dismantleState, dismantleAction, dismantlePending] = useActionState(
    dismantleDecorationAction,
    emptyState,
  );
  const groups = useMemo(() => grouped(items), [items]);
  const busy = craftPending || dismantlePending;
  const serverResult = lastAction === "dismantle" ? dismantleState : craftState;
  const visibleResult =
    serverResult.nonce && serverResult.rewards && serverResult.kind
      ? {
          nonce: serverResult.nonce,
          rewards: serverResult.rewards,
          kind: serverResult.kind,
        }
      : null;
  const resultNonce = visibleResult?.nonce;

  useEffect(() => {
    if (busy || resultNonce)
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [busy, resultNonce]);

  const changeAmount = (group: Group, delta: number) => {
    setSelected((current) => {
      const amount = Math.max(
        0,
        Math.min(group.ids.length, (current[group.slug] ?? 0) + delta),
      );
      const next = { ...current };
      if (amount) next[group.slug] = amount;
      else delete next[group.slug];
      return next;
    });
  };

  const chosenIds = (rarity: Rarity) =>
    groups
      .filter((group) => group.rarity === rarity)
      .flatMap((group) => group.ids.slice(0, selected[group.slug] ?? 0));

  return (
    <div className="craft-page">
      <header className="card craft-header">
        <div>
          <h1>Forja de decoraciones</h1>
          <p>
            Combina 3 objetos de la misma rareza para obtener uno del nivel
            siguiente, o desmantela uno para recibir 3 del nivel anterior.
          </p>
        </div>
      </header>

      {(busy || visibleResult || craftState.error || dismantleState.error) && (
        <section
          ref={resultRef}
          className="card craft-result"
          aria-live="polite"
        >
          {busy ? (
            <div className="crafting-animation">
              <span aria-hidden="true">✦</span>
              <b>{craftPending ? "Forjando…" : "Desmantelando…"}</b>
            </div>
          ) : visibleResult ? (
            <div className="craft-reveal" key={visibleResult.nonce}>
              <b>
                {visibleResult.kind === "craft"
                  ? "¡Objeto forjado!"
                  : "¡Objetos obtenidos!"}
              </b>
              <div className="craft-reward-list">
                {visibleResult.rewards.map((slug, index) => {
                  const definition = decorationBySlug.get(slug);
                  return (
                    <div
                      className={`craft-reward-card rarity-bg-${definition?.rarity.toLowerCase().replace("_", "-")}`}
                      key={`${slug}-${index}`}
                    >
                      <DecorationSprite slug={slug} />
                      <span>{definition?.name ?? slug}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="form-error">
              {craftState.error ?? dismantleState.error}
            </p>
          )}
        </section>
      )}

      {rarityOrder.map((rarity) => {
        const rarityGroups = groups.filter((group) => group.rarity === rarity);
        if (!rarityGroups.length) return null;
        const ids = chosenIds(rarity);
        const canCraft = rarity !== "LEGENDARY" && ids.length === 3;
        const canDismantle = rarity !== "COMMON" && ids.length === 1;
        return (
          <section className="card craft-tier" key={rarity}>
            <div className="craft-tier-heading">
              <h2>{decorationRarityLabels[rarity]}</h2>
              <span>
                {rarityGroups.reduce((sum, group) => sum + group.ids.length, 0)}{" "}
                objetos
              </span>
            </div>
            <div className="craft-inventory-grid">
              {rarityGroups.map((group) => {
                const definition = decorationBySlug.get(group.slug);
                const amount = selected[group.slug] ?? 0;
                return (
                  <article
                    className={`craft-item rarity-bg-${rarity.toLowerCase().replace("_", "-")}${amount ? " selected" : ""}`}
                    key={group.slug}
                  >
                    <span className="craft-item-count">
                      ×{group.ids.length}
                    </span>
                    <DecorationSprite slug={group.slug} />
                    <b>{definition?.name ?? group.slug}</b>
                    <div
                      className="craft-quantity"
                      aria-label={`Seleccionar ${definition?.name ?? group.slug}`}
                    >
                      <button
                        type="button"
                        onClick={() => changeAmount(group, -1)}
                        disabled={!amount || busy}
                        aria-label="Quitar una unidad"
                      >
                        −
                      </button>
                      <strong>{amount}</strong>
                      <button
                        type="button"
                        onClick={() => changeAmount(group, 1)}
                        disabled={amount >= group.ids.length || busy}
                        aria-label="Añadir una unidad"
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="craft-actions">
              {rarity !== "LEGENDARY" && (
                <form action={craftAction}>
                  {ids.map((id) => (
                    <input
                      key={id}
                      type="hidden"
                      name="decorationIds"
                      value={id}
                    />
                  ))}
                  <button
                    className="button"
                    disabled={!canCraft || busy}
                    onClick={() => setLastAction("craft")}
                  >
                    Forjar objeto superior ({ids.length}/3)
                  </button>
                </form>
              )}
              {rarity !== "COMMON" && (
                <form action={dismantleAction}>
                  <input
                    type="hidden"
                    name="decorationId"
                    value={ids[0] ?? ""}
                  />
                  <button
                    className="button secondary"
                    disabled={!canDismantle || busy}
                    onClick={() => setLastAction("dismantle")}
                  >
                    Desmantelar objeto
                  </button>
                </form>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

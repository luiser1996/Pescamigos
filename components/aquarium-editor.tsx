"use client";

import Image from "next/image";
import { useState } from "react";
import { saveAquariumAction } from "@/app/actions/aquarium";
import { FilterPanel } from "@/components/filter-panel";
import { SubmitButton } from "@/components/submit-button";
import {
  type AquariumFish,
  type PlacedDecoration,
  VirtualAquarium,
} from "@/components/virtual-aquarium";
import { reorderDecorations } from "@/lib/aquarium-layers";
import { DecorationSprite } from "@/components/decoration-sprite";
import {
  decorationBySlug,
  decorationRarityLabels,
  rarityOrder,
} from "@/lib/decorations";

type CatchOption = AquariumFish & {
  caughtAt: string;
  caughtAtValue: number;
  speciesId: string;
};

export function AquariumEditor({
  catches,
  initialIds,
  decorations,
}: {
  catches: CatchOption[];
  initialIds: string[];
  decorations: PlacedDecoration[];
}) {
  const [selected, setSelected] = useState(() => new Set(initialIds));
  const [speciesId, setSpeciesId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minimumSize, setMinimumSize] = useState("");
  const [maximumSize, setMaximumSize] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(1);
  const [placed, setPlaced] = useState(
    decorations.filter((item) => item.isPlaced),
  );
  const [decorationQuery, setDecorationQuery] = useState("");
  const [decorationSort, setDecorationSort] = useState<
    "new" | "old" | "rare" | "common"
  >("new");
  const [activeDecorationId, setActiveDecorationId] = useState<string | null>(
    null,
  );
  const preview = catches.filter((item) => selected.has(item.id));
  const speciesOptions = [
    ...new Map(catches.map((item) => [item.speciesId, item.name])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "es"));
  const fromValue = dateFrom
    ? new Date(`${dateFrom}T00:00:00`).getTime()
    : null;
  const toValue = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
  const minValue = minimumSize === "" ? null : Number(minimumSize);
  const maxValue = maximumSize === "" ? null : Number(maximumSize);
  const filtered = [...catches]
    .filter(
      (item) =>
        (!speciesId || item.speciesId === speciesId) &&
        (fromValue == null || item.caughtAtValue >= fromValue) &&
        (toValue == null || item.caughtAtValue <= toValue) &&
        (minValue == null || item.lengthCm >= minValue) &&
        (maxValue == null || item.lengthCm <= maxValue) &&
        (!onlySelected || selected.has(item.id)),
    )
    .sort((a, b) =>
      ascending
        ? a.caughtAtValue - b.caughtAtValue
        : b.caughtAtValue - a.caughtAtValue,
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  );
  const availableDecorations = decorations.filter(
    (item) => !placed.some((placedItem) => placedItem.id === item.id),
  );

  return (
    <form action={saveAquariumAction} className="aquarium-editor">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="catchIds" value={id} />
      ))}
      <input
        type="hidden"
        name="decorationPlacements"
        value={JSON.stringify(
          placed.map(({ id, xPct, yPct, scale, layer, coversFish }) => ({
            id,
            xPct,
            yPct,
            scale,
            layer,
            coversFish,
          })),
        )}
      />
      <section>
        <div className="aquarium-editor-heading">
          <div>
            <h1>Editar pecera</h1>
            <p>
              Elige únicamente entre tus capturas. El tamaño depende de la
              longitud registrada.
            </p>
          </div>
          <SubmitButton>Guardar pecera</SubmitButton>
        </div>
        <VirtualAquarium
          fish={preview}
          decorations={placed}
          editableDecorations
          onRemoveFish={(id) =>
            setSelected((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            })
          }
          pendingDecorationId={activeDecorationId}
          onPlaceDecoration={(id, xPct, yPct) => {
            setPlaced((current) => {
              const source = decorations.find((item) => item.id === id);
              if (!source) return current;
              const without = current.filter((item) => item.id !== id);
              const existing = current.find((item) => item.id === id);
              return [
                ...without,
                {
                  ...source,
                  xPct,
                  yPct,
                  layer:
                    existing?.layer ??
                    Math.max(-1, ...current.map((item) => item.layer)) + 1,
                  coversFish: existing?.coversFish ?? false,
                },
              ];
            });
            setActiveDecorationId(null);
          }}
          onRemoveDecoration={(id) =>
            setPlaced((current) => current.filter((item) => item.id !== id))
          }
          onSelectDecoration={setActiveDecorationId}
          onChangeDecorationLayer={(id, action) =>
            setPlaced((current) => reorderDecorations(current, id, action))
          }
          onToggleDecorationCoversFish={(id) =>
            setPlaced((current) =>
              current.map((item) =>
                item.id === id
                  ? { ...item, coversFish: !item.coversFish }
                  : item,
              ),
            )
          }
        />
      </section>
      <section className="card aquarium-decoration-selector">
        <h2>Tus decoraciones</h2>
        <p>
          Arrastra una decoración hasta el lugar de la pecera donde quieras
          colocarla. En móvil, tócala y después toca la pecera.
        </p>
        <FilterPanel label="Filtrar decoraciones">
          <div className="decoration-filter-row">
            <label className="field">
              Nombre
              <input
                type="search"
                value={decorationQuery}
                onChange={(event) => setDecorationQuery(event.target.value)}
              />
            </label>
            <label className="field">
              Orden
              <select
                value={decorationSort}
                onChange={(event) =>
                  setDecorationSort(event.target.value as typeof decorationSort)
                }
              >
                <option value="new">Más recientes</option>
                <option value="old">Más antiguas</option>
                <option value="rare">Rareza: mayor a menor</option>
                <option value="common">Rareza: menor a mayor</option>
              </select>
            </label>
          </div>
        </FilterPanel>
        {decorations.length === 0 ? (
          <p>Aún no tienes decoraciones. Abre cofres para conseguirlas.</p>
        ) : availableDecorations.length === 0 ? (
          <p>Todas tus decoraciones están colocadas en la pecera.</p>
        ) : (
          <div className="decoration-inventory-grid">
            {[...availableDecorations]
              .filter((item) =>
                (decorationBySlug.get(item.slug)?.name ?? item.slug)
                  .toLocaleLowerCase("es")
                  .includes(decorationQuery.toLocaleLowerCase("es")),
              )
              .sort((a, b) => {
                const rarity =
                  rarityOrder.indexOf(a.rarity as never) -
                  rarityOrder.indexOf(b.rarity as never);
                if (decorationSort === "rare") return -rarity;
                if (decorationSort === "common") return rarity;
                const date =
                  (a.acquiredAtValue ?? 0) - (b.acquiredAtValue ?? 0);
                return decorationSort === "old" ? date : -date;
              })
              .map((item) => (
                <div
                  draggable
                  role="button"
                  tabIndex={0}
                  aria-pressed={activeDecorationId === item.id}
                  onClick={() =>
                    setActiveDecorationId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveDecorationId((current) =>
                        current === item.id ? null : item.id,
                      );
                    }
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "application/x-pescamigos-decoration",
                      item.id,
                    );
                    setActiveDecorationId(item.id);
                  }}
                  className={`decoration-inventory-card rarity-bg-${item.rarity.toLowerCase().replace("_", "-")}${activeDecorationId === item.id ? " selected" : ""}`}
                  key={item.id}
                >
                  <DecorationSprite slug={item.slug} />
                  <b>{decorationBySlug.get(item.slug)?.name}</b>
                  <small>
                    {
                      decorationRarityLabels[
                        item.rarity as keyof typeof decorationRarityLabels
                      ]
                    }
                  </small>
                </div>
              ))}
          </div>
        )}
      </section>
      <section className="card aquarium-catch-selector">
        <h2>Tus peces</h2>
        <FilterPanel label="Filtrar capturas">
          <div className="aquarium-selector-filters">
            <label className="field">
              Especie
              <select
                value={speciesId}
                onChange={(event) => {
                  setSpeciesId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas las especies</option>
                {speciesOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="aquarium-selected-filter">
              <input
                type="checkbox"
                checked={onlySelected}
                onChange={(event) => {
                  setOnlySelected(event.target.checked);
                  setPage(1);
                }}
              />
              Mostrar solo los añadidos
            </label>
          </div>
          <div className="aquarium-range-filters">
            <label className="field">
              Desde
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="field">
              Hasta
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="field">
              Tamaño mínimo (cm)
              <input
                type="number"
                min="0"
                step="0.1"
                value={minimumSize}
                onChange={(event) => {
                  setMinimumSize(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="field">
              Tamaño máximo (cm)
              <input
                type="number"
                min="0"
                step="0.1"
                value={maximumSize}
                onChange={(event) => {
                  setMaximumSize(event.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>
        </FilterPanel>
        <button
          type="button"
          className="button secondary aquarium-order-toggle"
          onClick={() => {
            setAscending((current) => !current);
            setPage(1);
          }}
        >
          {ascending ? "↑ Más antiguas primero" : "↓ Más recientes primero"}
        </button>
        {catches.length === 0 ? (
          <p>Aún no tienes capturas que puedas añadir.</p>
        ) : visible.length === 0 ? (
          <p>No hay capturas que coincidan con el filtro.</p>
        ) : (
          <>
            <div className="aquarium-catch-grid">
              {visible.map((item) => (
                <label
                  className={`aquarium-catch-option${selected.has(item.id) ? " selected" : ""}`}
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
                    <small>
                      {item.lengthCm} cm · {item.caughtAt}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            {totalPages > 1 && (
              <nav
                className="aquarium-pagination"
                aria-label="Páginas de capturas"
              >
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Página anterior"
                >
                  ‹
                </button>
                {pageNumbers.map((number) => (
                  <button
                    type="button"
                    key={number}
                    className={number === currentPage ? "active" : ""}
                    aria-current={number === currentPage ? "page" : undefined}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="Página siguiente"
                >
                  ›
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </form>
  );
}

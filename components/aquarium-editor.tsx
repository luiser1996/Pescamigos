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
  const [query, setQuery] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [page, setPage] = useState(1);
  const preview = catches.filter((item) => selected.has(item.id));
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filtered = catches.filter(
    (item) =>
      (!normalizedQuery ||
        item.name.toLocaleLowerCase("es").includes(normalizedQuery)) &&
      (!onlySelected || selected.has(item.id)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  );

  return (
    <form action={saveAquariumAction} className="aquarium-editor">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="catchIds" value={id} />
      ))}
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
        <div className="aquarium-selector-filters">
          <label className="field">
            Filtrar por especie
            <input
              type="search"
              value={query}
              placeholder="Ej. black bass"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
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
                  <small>{item.lengthCm} cm · {item.caughtAt}</small>
                </span>
              </label>
            ))}
            </div>
            {totalPages > 1 && (
              <nav className="aquarium-pagination" aria-label="Páginas de capturas">
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

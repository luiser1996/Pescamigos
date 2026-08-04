"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { FilterPanel } from "@/components/filter-panel";

type Option = { id: string; label: string };
type Values = {
  from?: string;
  to?: string;
  species?: string;
  fisher?: string;
  place?: string;
  order?: string;
};

export function MemoryFilters({
  species,
  fishers,
  places,
  values,
}: {
  species: Option[];
  fishers: Option[];
  places: Option[];
  values: Values;
}) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const ascending = values.order === "asc";
  const hasFilters = Boolean(
    values.from || values.to || values.species || values.fisher || values.place,
  );
  const toggleOrder = () => {
    const query = new URLSearchParams(
      new FormData(form.current ?? undefined) as never,
    );
    query.set("order", ascending ? "desc" : "asc");
    query.delete("page");
    router.push(`/capturas?${query}`);
  };
  return (
    <>
      <FilterPanel label="Filtrar recuerdos">
        <form
          ref={form}
          method="get"
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <input
            type="hidden"
            name="order"
            value={ascending ? "asc" : "desc"}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 10,
            }}
          >
            {[
              { name: "species", label: "Especie", options: species },
              { name: "fisher", label: "Pescador", options: fishers },
              { name: "place", label: "Lugar", options: places },
            ].map((field) => (
              <label className="field" key={field.name}>
                {field.label}
                <select
                  name={field.name}
                  defaultValue={values[field.name as keyof Values] ?? ""}
                >
                  <option value="">Todos</option>
                  {field.options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
              gap: 10,
              alignItems: "end",
            }}
          >
            <label className="field">
              Desde
              <input type="date" name="from" defaultValue={values.from ?? ""} />
            </label>
            <label className="field">
              Hasta
              <input type="date" name="to" defaultValue={values.to ?? ""} />
            </label>
            <button className="button">Aplicar filtros</button>
            {hasFilters && (
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  form.current
                    ?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
                      "[name]:not([name='order'])",
                    )
                    .forEach((field) => {
                      field.value = "";
                    });
                  router.push(`/capturas?order=${ascending ? "asc" : "desc"}`);
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </form>
      </FilterPanel>
      <button
        type="button"
        className="button secondary"
        onClick={toggleOrder}
        style={{ marginBlock: 12 }}
      >
        {ascending ? "↑ Más antiguas primero" : "↓ Más recientes primero"}
      </button>
    </>
  );
}

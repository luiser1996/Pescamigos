import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CatalogSelector } from "@/components/catalog-selector";
import { FilterPanel } from "@/components/filter-panel";
import { monthInAppTimeZone } from "@/lib/date";
import { sortCatalog } from "@/lib/catalog-filters";
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    q?: string;
    agua?: string;
    estado?: string;
    descubierta?: string;
    activo?: string;
    orden?: string;
  }>;
}) {
  const user = await requireUser();
  const p = await searchParams;
  const currentMonth = monthInAppTimeZone(new Date()) + 1;
  const discoveredFilter =
    p.descubierta ??
    (p.estado === "caught" ? "yes" : p.estado === "missing" ? "no" : "");
  const hasFilters = Boolean(
    p.q?.trim() ||
    p.agua ||
    discoveredFilter ||
    p.activo ||
    (p.orden && p.orden !== "alphabetical"),
  );
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, displayName: true },
    orderBy: { createdAt: "asc" },
  });
  const ids =
    p.vista === "all"
      ? users.map((x) => x.id)
      : [!p.vista || p.vista === "mine" ? user.id : p.vista];
  const species = await prisma.species.findMany({
    where: {
      archivedAt: null,
      ...(p.q?.trim()
        ? {
            OR: [
              {
                commonName: {
                  contains: p.q.trim(),
                  mode: "insensitive" as const,
                },
              },
              {
                scientificName: {
                  contains: p.q.trim(),
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      waterType:
        p.agua === "FRESHWATER" ||
        p.agua === "SALTWATER" ||
        p.agua === "BRACKISH"
          ? p.agua
          : undefined,
    },
    include: {
      catalogImage: true,
      catches: {
        where: { fisherId: { in: ids }, deletedAt: null },
        select: { id: true, caughtAt: true },
      },
    },
    orderBy: { commonName: "asc" },
  });
  const shown = sortCatalog(
    species.filter((s) => {
      if (discoveredFilter === "yes" && !s.catches.length) return false;
      if (discoveredFilter === "no" && s.catches.length) return false;
      if (p.activo === "yes" && !s.activeMonths.includes(currentMonth))
        return false;
      if (p.activo === "no" && s.activeMonths.includes(currentMonth))
        return false;
      return true;
    }),
    p.orden,
  );
  const discovered = species.filter((item) => item.catches.length > 0).length;
  const percentage = species.length
    ? Math.round((discovered / species.length) * 100)
    : 0;
  return (
    <>
      <h1>Catálogo de especies</h1>
      <CatalogSelector
        users={[
          { id: user.id, displayName: user.displayName },
          ...users.filter((x) => x.id !== user.id),
        ]}
        current={p.vista ?? "mine"}
      />
      <section className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>Progreso de esta colección</b>
          <strong>{percentage}%</strong>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: 14,
            background: "#dce7df",
            borderRadius: 99,
            margin: ".8rem 0",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percentage}%`,
              background: "#4f946f",
              borderRadius: 99,
            }}
          />
        </div>
        <span>
          {discovered} de {species.length} especies descubiertas
        </span>
      </section>
      <FilterPanel label="Buscar y filtrar especies">
        <form
          key={JSON.stringify(p)}
          action="/catalogo"
          method="get"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))",
            alignItems: "end",
            gap: 12,
          }}
        >
          <input type="hidden" name="vista" value={p.vista ?? "mine"} />
          <label className="field">
            Nombre
            <input
              name="q"
              defaultValue={p.q}
              placeholder="Nombre común o científico"
            />
          </label>
          <label className="field">
            Agua
            <select name="agua" defaultValue={p.agua ?? ""}>
              <option value="">Todas</option>
              <option value="FRESHWATER">Dulce</option>
              <option value="SALTWATER">Salada</option>
              <option value="BRACKISH">Salobre</option>
            </select>
          </label>
          <label className="field">
            Descubierta
            <select name="descubierta" defaultValue={discoveredFilter}>
              <option value="">Todas</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="field">
            Activo
            <select name="activo" defaultValue={p.activo ?? ""}>
              <option value="">Todos</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="field">
            Ordenar por
            <select name="orden" defaultValue={p.orden ?? "alphabetical"}>
              <option value="alphabetical">Nombre (A–Z)</option>
              <option value="difficulty-asc">Dificultad: menos a más</option>
              <option value="difficulty-desc">Dificultad: más a menos</option>
            </select>
          </label>
          <button className="button">Filtrar</button>
          {hasFilters && (
            <Link
              className="button secondary"
              href={`/catalogo?vista=${encodeURIComponent(p.vista ?? "mine")}`}
            >
              Limpiar filtros
            </Link>
          )}
        </form>
        <small>
          Activo indica los meses de mayor actividad de la especie, según el mes
          actual. No equivale a autorización legal para pescar.
        </small>
      </FilterPanel>
      {!shown.length && <p>No hay especies que coincidan con los filtros.</p>}
      {["FRESHWATER", "SALTWATER", "BRACKISH"].map((w) => (
        <section key={w}>
          <h2>
            {w === "FRESHWATER"
              ? "Agua dulce"
              : w === "SALTWATER"
                ? "Agua salada"
                : "Agua salobre"}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))",
              gap: 14,
            }}
          >
            {shown
              .filter((s) => s.waterType === w)
              .map((s) => (
                <Link
                  href={`/especies/${s.slug}?vista=${p.vista ?? "mine"}`}
                  key={s.id}
                  className={`card ${s.catches.length ? "" : "undiscovered"}`}
                  style={{ padding: 10 }}
                >
                  <div className="fish-placeholder" aria-hidden>
                    {s.catalogImage ? (
                      <Image
                        unoptimized
                        src={`/api/assets/${s.catalogImage.id}`}
                        alt=""
                        width={420}
                        height={300}
                        style={{
                          width: "100%",
                          height: "118px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      "🐟"
                    )}
                  </div>
                  <h3 style={{ marginBottom: 2, fontWeight: 900 }}>
                    {s.commonName}
                  </h3>
                  <i>{s.scientificName}</i>
                  <p>
                    {s.catches.length
                      ? `✓ ${s.catches.length} captura${s.catches.length === 1 ? "" : "s"}`
                      : "Aún por descubrir"}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}

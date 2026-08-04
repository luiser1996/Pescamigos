import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CatalogSelector } from "@/components/catalog-selector";
import { FilterPanel } from "@/components/filter-panel";
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    q?: string;
    agua?: string;
    estado?: string;
  }>;
}) {
  const user = await requireUser();
  const p = await searchParams;
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
      commonName: p.q ? { contains: p.q, mode: "insensitive" } : undefined,
      waterType:
        p.agua === "FRESHWATER" || p.agua === "SALTWATER" ? p.agua : undefined,
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
  const shown = species.filter((s) =>
    p.estado === "caught"
      ? s.catches.length > 0
      : p.estado === "missing"
        ? s.catches.length === 0
        : true,
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
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <input type="hidden" name="vista" value={p.vista ?? "mine"} />
          <label className="field" style={{ flex: "2 1 220px" }}>
            Buscar
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
            </select>
          </label>
          <label className="field">
            Estado
            <select name="estado" defaultValue={p.estado ?? ""}>
              <option value="">Todas</option>
              <option value="caught">Descubiertas</option>
              <option value="missing">Sin descubrir</option>
            </select>
          </label>
          <button className="button">Filtrar</button>
        </form>
      </FilterPanel>
      {["FRESHWATER", "SALTWATER"].map((w) => (
        <section key={w}>
          <h2>{w === "FRESHWATER" ? "Agua dulce" : "Agua salada"}</h2>
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

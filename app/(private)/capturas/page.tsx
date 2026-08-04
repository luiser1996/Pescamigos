import type { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MemoryFilters } from "@/components/memory-filters";
import { Pagination } from "@/components/pagination";

type Filters = {
  from?: string;
  to?: string;
  species?: string;
  fisher?: string;
  place?: string;
  order?: string;
  page?: string;
};

const validDate = (value?: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : null;

export default async function Timeline({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const from = validDate(filters.from);
  const to = validDate(filters.to);
  if (to) to.setDate(to.getDate() + 1);
  const where: Prisma.CatchWhereInput = {
    deletedAt: null,
    ...(filters.species ? { speciesId: filters.species } : {}),
    ...(filters.fisher ? { fisherId: filters.fisher } : {}),
    ...(filters.place ? { placeId: filters.place } : {}),
    ...(from || to
      ? {
          caughtAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lt: to } : {}),
          },
        }
      : {}),
  };
  const [catches, total, species, fishers, places] = await Promise.all([
    prisma.catch.findMany({
      where,
      include: {
        species: true,
        fisher: true,
        place: true,
        photos: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { caughtAt: filters.order === "asc" ? "asc" : "desc" },
      skip: (page - 1) * 15,
      take: 15,
    }),
    prisma.catch.count({ where }),
    prisma.species.findMany({
      where: { archivedAt: null },
      orderBy: { commonName: "asc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.fishingPlace.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);
  const hasFilters = Boolean(
    filters.from ||
    filters.to ||
    filters.species ||
    filters.fisher ||
    filters.place,
  );
  return (
    <>
      <h1>Recuerdos</h1>
      <MemoryFilters
        values={filters}
        species={species.map((item) => ({
          id: item.id,
          label: item.commonName,
        }))}
        fishers={fishers.map((item) => ({
          id: item.id,
          label: item.displayName,
        }))}
        places={places.map((item) => ({ id: item.id, label: item.name }))}
      />
      {!catches.length && (
        <div className="card" style={{ padding: "1.5rem" }}>
          {hasFilters
            ? "No hay capturas con estos filtros."
            : "Todavía no hay capturas."}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
          gap: 14,
        }}
      >
        {catches.map((capture) => {
          const photo = capture.photos[0];
          return (
            <article className="card" key={capture.id} style={{ padding: 8 }}>
              <Link
                href={`/capturas/${capture.id}`}
                style={{ display: "block" }}
              >
                {photo ? (
                  <Image
                    unoptimized
                    src={`/api/photos/${photo.id}`}
                    alt={`Captura de ${capture.species.commonName}`}
                    width={photo.width || 800}
                    height={photo.height || 600}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 16,
                      display: "block",
                    }}
                  />
                ) : (
                  <div className="fish-placeholder">🐟</div>
                )}
                <h2 style={{ fontSize: "1.2rem", margin: ".8rem .5rem .2rem" }}>
                  {capture.species.commonName}
                </h2>
              </Link>
              <div style={{ padding: "0 .5rem .6rem" }}>
                <p style={{ margin: 0 }}>
                  {capture.fisher.displayName} ·{" "}
                  {capture.caughtAt.toLocaleDateString("es-ES")}
                </p>
                <span>{capture.place.name}</span>
              </div>
            </article>
          );
        })}
      </div>
      <Pagination
        path="/capturas"
        current={page}
        totalItems={total}
        params={filters}
      />
    </>
  );
}

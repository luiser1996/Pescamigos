import { CatchMap } from "@/components/catch-map";
import { FilterPanel } from "@/components/filter-panel";
import { prisma } from "@/lib/prisma";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{
    fisher?: string;
    species?: string;
    water?: string;
    from?: string;
    to?: string;
    place?: string;
  }>;
}) {
  const query = await searchParams;
  const [users, species] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, displayName: true },
    }),
    prisma.species.findMany({
      where: { archivedAt: null },
      select: { id: true, commonName: true },
      orderBy: { commonName: "asc" },
    }),
  ]);
  const caughtAt =
    query.from || query.to
      ? {
          gte: query.from ? new Date(`${query.from}T00:00:00`) : undefined,
          lte: query.to ? new Date(`${query.to}T23:59:59`) : undefined,
        }
      : undefined;
  const catchFilter = {
    deletedAt: null,
    fisherId: query.fisher || undefined,
    speciesId: query.species || undefined,
    caughtAt,
  };
  const places = await prisma.fishingPlace.findMany({
    where: {
      archivedAt: null,
      waterType:
        query.water === "FRESHWATER" || query.water === "SALTWATER"
          ? query.water
          : undefined,
      catches: { some: catchFilter },
    },
    include: {
      placeImage: true,
      catches: {
        where: catchFilter,
        select: {
          id: true,
          caughtAt: true,
          species: { select: { commonName: true } },
          fisher: { select: { displayName: true } },
        },
        orderBy: { caughtAt: "desc" },
        take: 5,
      },
    },
  });
  return (
    <>
      <h1>Mapa de recuerdos</h1>
      <FilterPanel label="Filtrar mapa">
        <form
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <label className="field">
            Pescador
            <select name="fisher" defaultValue={query.fisher ?? ""}>
              <option value="">Todos</option>
              {users.map((user) => (
                <option value={user.id} key={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Especie
            <select name="species" defaultValue={query.species ?? ""}>
              <option value="">Todas</option>
              {species.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.commonName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Agua
            <select name="water" defaultValue={query.water ?? ""}>
              <option value="">Toda</option>
              <option value="FRESHWATER">Dulce</option>
              <option value="SALTWATER">Salada</option>
            </select>
          </label>
          <label className="field">
            Desde
            <input type="date" name="from" defaultValue={query.from} />
          </label>
          <label className="field">
            Hasta
            <input type="date" name="to" defaultValue={query.to} />
          </label>
          <button className="button">Filtrar</button>
        </form>
      </FilterPanel>
      {places.length ? (
        <CatchMap
          places={places.map((place) => ({
            id: place.id,
            name: place.name,
            latitude: Number(place.latitude),
            longitude: Number(place.longitude),
            catches: place.catches.map((capture) => ({
              id: capture.id,
              label: `${capture.species.commonName} · ${capture.fisher.displayName} · ${capture.caughtAt.toLocaleDateString("es-ES")}`,
            })),
            imageId: place.placeImageId,
          }))}
          selectedPlaceId={query.place}
          tileUrl={
            process.env.TILE_URL ??
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution={
            process.env.TILE_ATTRIBUTION ?? "&copy; OpenStreetMap contributors"
          }
        />
      ) : (
        <div className="card" style={{ padding: "2rem" }}>
          No hay lugares con capturas para estos filtros.
        </div>
      )}
    </>
  );
}

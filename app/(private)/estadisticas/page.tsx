import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Stats() {
  const [species, catches, users, places] = await Promise.all([
    prisma.species.findMany({ where: { archivedAt: null } }),
    prisma.catch.findMany({
      where: { deletedAt: null },
      include: { species: true, fisher: true },
    }),
    prisma.user.findMany({ where: { active: true } }),
    prisma.fishingPlace.findMany({
      where: { archivedAt: null },
      include: {
        placeImage: true,
        _count: { select: { catches: { where: { deletedAt: null } } } },
      },
    }),
  ]);
  const unique = new Set(catches.map((item) => item.speciesId)).size;
  const counts = new Map<string, { name: string; count: number }>();
  for (const item of catches)
    counts.set(item.speciesId, {
      name: item.species.commonName,
      count: (counts.get(item.speciesId)?.count ?? 0) + 1,
    });
  const most = [...counts.values()].sort((a, b) => b.count - a.count)[0];
  const longest = [...catches].sort(
    (a, b) => Number(b.lengthCm) - Number(a.lengthCm),
  )[0];
  const heaviest = [...catches]
    .filter((item) => item.weightG)
    .sort((a, b) => Number(b.weightG) - Number(a.weightG))[0];
  const byMonth = Array.from(
    { length: 12 },
    (_, month) =>
      catches.filter((item) => item.caughtAt.getMonth() === month).length,
  );
  // La página es dinámica y refleja el mes real de la consulta.
  const now = new Date();
  const currentMonth = Number(
    new Intl.DateTimeFormat("en", {
      month: "numeric",
      timeZone: "Europe/Madrid",
    }).format(now),
  );
  const monthName = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    timeZone: "Europe/Madrid",
  }).format(now);
  const seasonalSpecies = species
    .filter((item) => item.activeMonths.includes(currentMonth))
    .sort(
      (a, b) =>
        (a.difficulty ?? 99) - (b.difficulty ?? 99) ||
        a.commonName.localeCompare(b.commonName, "es"),
    );
  return (
    <>
      <h1>Lo que llevamos vivido</h1>
      <section
        className="card"
        style={{
          padding: "1.2rem",
          marginBottom: 16,
          background: "linear-gradient(145deg,#f0faed,#dff3df)",
        }}
      >
        <p style={{ margin: 0, textTransform: "capitalize" }}>
          Actividad biológica · {monthName}
        </p>
        <h2 style={{ marginTop: 6 }}>
          Especies de mayor actividad actualmente
        </h2>
        {seasonalSpecies.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
              gap: 8,
            }}
          >
            {seasonalSpecies.map((item) => (
              <Link
                href={`/especies/${item.slug}`}
                key={item.id}
                style={{
                  padding: ".8rem",
                  borderRadius: 14,
                  background: "#ffffffc9",
                }}
              >
                <b>{item.commonName}</b>
                <br />
                <i>{item.scientificName}</i>
                <br />
                <small>
                  {item.waterType === "FRESHWATER"
                    ? "Agua dulce"
                    : item.waterType === "SALTWATER"
                      ? "Agua salada"
                      : "Agua salobre"}
                  {item.difficulty ? ` · dificultad ${item.difficulty}/5` : ""}
                </small>
              </Link>
            ))}
          </div>
        ) : (
          <p>No hay especies con meses de actividad revisados para este mes.</p>
        )}
        <aside style={{ marginTop: 12, fontSize: ".9rem" }}>
          La actividad indica cuándo suele ser más fácil localizar una especie,
          pero no confirma que su pesca esté permitida. Consulta la normativa,
          vedas y restricciones vigentes antes de pescar.
        </aside>
      </section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
        }}
      >
        {[
          ["Especies", `${unique} / ${species.length}`],
          [
            "Completado",
            species.length
              ? `${Math.round((unique / species.length) * 100)}%`
              : "0%",
          ],
          ["Capturas", catches.length],
          ["Más recordada", most?.name ?? "—"],
        ].map(([label, value]) => (
          <section
            className="card"
            style={{ padding: "1.2rem" }}
            key={String(label)}
          >
            <small>{label}</small>
            <div style={{ fontSize: "1.7rem", fontWeight: 850 }}>{value}</div>
          </section>
        ))}
      </div>
      <h2>Pescadores</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {users.map((user) => (
          <Link
            className="button secondary"
            href={`/pescadores/${user.id}`}
            key={user.id}
          >
            {user.displayName}:{" "}
            {catches.filter((item) => item.fisherId === user.id).length}
          </Link>
        ))}
      </div>
      <h2>Récords conjuntos</h2>
      <p>
        Longitud:{" "}
        {longest
          ? `${Number(longest.lengthCm)} cm · ${longest.species.commonName} (${longest.fisher.displayName})`
          : "—"}
      </p>
      <p>
        Peso:{" "}
        {heaviest
          ? `${Number(heaviest.weightG)} g · ${heaviest.species.commonName} (${heaviest.fisher.displayName})`
          : "—"}
      </p>
      <h2>Capturas por mes</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12,minmax(0,1fr))",
          gap: 4,
          alignItems: "end",
          minHeight: 170,
        }}
      >
        {byMonth.map((count, index) => (
          <div key={index} style={{ textAlign: "center" }}>
            <div
              title={`${count} capturas`}
              style={{
                height: `${Math.max(8, count * 18)}px`,
                background: "#4f946f",
                borderRadius: "8px 8px 2px 2px",
              }}
            />
            <small>{index + 1}</small>
          </div>
        ))}
      </div>
      <h2>Lugares con más capturas</h2>
      {places
        .sort((a, b) => b._count.catches - a._count.catches)
        .slice(0, 5)
        .map((place) => (
          <p key={place.id}>
            <Link
              className="place-preview-link"
              href={`/mapa?place=${place.id}`}
            >
              {place.name}
              {place.placeImageId && (
                <span className="place-preview">
                  <Image
                    unoptimized
                    src={`/api/assets/${place.placeImageId}?size=thumb`}
                    alt={place.name}
                    width={260}
                    height={180}
                  />
                </span>
              )}
            </Link>
            : {place._count.catches}
          </p>
        ))}
    </>
  );
}

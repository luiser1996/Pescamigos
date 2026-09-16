import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { APP_TIME_ZONE } from "@/lib/date";

export async function SeasonalSpecies() {
  const now = new Date();
  const month = Number(
    new Intl.DateTimeFormat("en", {
      month: "numeric",
      timeZone: APP_TIME_ZONE,
    }).format(now),
  );
  const monthName = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    timeZone: APP_TIME_ZONE,
  }).format(now);
  const species = await prisma.species.findMany({
    where: { archivedAt: null, activeMonths: { has: month } },
    orderBy: { commonName: "asc" },
  });
  return (
    <details className="filter-panel card seasonal-panel">
      <summary>Especies de mayor actividad actualmente</summary>
      <div className="filter-panel-content">
        <p className="seasonal-month">Actividad biológica · {monthName}</p>
        <div className="seasonal-species-grid">
          {species.map((item) => (
            <Link
              className="card"
              href={`/especies/${item.slug}`}
              key={item.id}
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
        {!species.length && (
          <p>No hay especies con actividad registrada para este mes.</p>
        )}
        <aside className="seasonal-notice">
          La actividad biológica no confirma que la pesca esté permitida.
          Consulta las vedas y restricciones vigentes antes de pescar.
        </aside>
      </div>
    </details>
  );
}

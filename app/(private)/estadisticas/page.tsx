import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { monthInAppTimeZone } from "@/lib/date";
import { mostCaughtSpecies } from "@/lib/statistics";
import { StatisticsPodium } from "@/components/statistics-podium";
import { LureImage } from "@/components/lure-image";
import { SubmitButton } from "@/components/submit-button";
import { changeLostLuresAction } from "@/app/actions/lures";

export const metadata = { title: "Estadísticas" };

export default async function Stats() {
  const actor = await requireUser();
  const [speciesCount, catches, users, places] = await Promise.all([
    prisma.species.count({ where: { archivedAt: null } }),
    prisma.catch.findMany({
      where: { deletedAt: null },
      include: { species: true, fisher: true },
      orderBy: [{ caughtAt: "desc" }, { id: "asc" }],
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.fishingPlace.findMany({
      where: { archivedAt: null },
      include: {
        catches: {
          where: { deletedAt: null },
          include: { species: { select: { id: true, commonName: true } } },
        },
      },
    }),
  ]);
  const unique = new Set(catches.map((item) => item.speciesId)).size;
  const most = mostCaughtSpecies(catches);
  const longest = [...catches]
    .sort((a, b) => Number(b.lengthCm) - Number(a.lengthCm))
    .slice(0, 3);
  const heaviest = catches
    .filter((item) => item.weightG !== null)
    .sort((a, b) => Number(b.weightG) - Number(a.weightG))
    .slice(0, 3);
  const byMonth = Array.from(
    { length: 12 },
    (_, month) =>
      catches.filter((item) => monthInAppTimeZone(item.caughtAt) === month)
        .length,
  );
  const peakMonth = Math.max(1, ...byMonth);
  const topPlaces = places
    .filter((place) => place.catches.length > 0)
    .sort(
      (a, b) =>
        b.catches.length - a.catches.length ||
        a.name.localeCompare(b.name, "es"),
    )
    .slice(0, 3);
  const lureUsers = [...users].sort(
    (a, b) =>
      b.lostLures - a.lostLures ||
      a.displayName.localeCompare(b.displayName, "es"),
  );
  const recordData = (item: (typeof catches)[number], weight = false) => ({
    id: item.id,
    speciesName: item.species.commonName,
    catalogImageId: item.species.catalogImageId,
    fisherName: item.fisher.displayName,
    value: Number(weight ? item.weightG : item.lengthCm),
  });

  return (
    <>
      <h1>Lo que llevamos vivido</h1>
      <section className="stats-section">
        <h2 className="stats-section-title">Pescadores</h2>
        <div className="stats-horizontal-row">
          {users.map((user) => (
            <Link
              className="card fisher-stat-card"
              href={`/pescadores/${user.id}`}
              key={user.id}
            >
              {user.avatarImageId ? (
                <Image
                  unoptimized
                  src={`/api/assets/${user.avatarImageId}?size=thumb`}
                  alt=""
                  width={48}
                  height={48}
                  className="fisher-stat-avatar"
                />
              ) : (
                <span className="fisher-stat-avatar avatar-initial">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>
                <b>{user.displayName}</b>
                <small>
                  {catches.filter((item) => item.fisherId === user.id).length}{" "}
                  peces capturados
                </small>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <div className="stats-summary-grid">
        {[
          ["Especies", `${unique} / ${speciesCount}`],
          [
            "Completado",
            speciesCount
              ? `${Math.round((unique / speciesCount) * 100)}%`
              : "0%",
          ],
          ["Capturas", String(catches.length)],
          ["Más pescada", most?.name ?? "—"],
        ].map(([label, value]) => (
          <article className="card stats-summary-card" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="stats-section">
        <h2 className="stats-section-title">Podios de récords</h2>
        <div className="stats-podium-grid">
          <StatisticsPodium
            records={longest.map((item) => recordData(item))}
            metric="Longitud"
            unit="cm"
          />
          <StatisticsPodium
            records={heaviest.map((item) => recordData(item, true))}
            metric="Peso"
            unit="g"
          />
        </div>
      </section>
      <section className="stats-section">
        <h2 className="stats-section-title">Capturas por mes</h2>
        <div className="stats-month-chart">
          {byMonth.map((count, index) => (
            <div key={index} className="stats-month">
              <small>{count}</small>
              <div
                title={`${count} capturas`}
                style={{
                  height: `${Math.max(6, (count / peakMonth) * 140)}px`,
                }}
              />
              <small>
                {
                  [
                    "Ene",
                    "Feb",
                    "Mar",
                    "Abr",
                    "May",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dic",
                  ][index]
                }
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="stats-section">
        <h2 className="stats-section-title">Lugares con más capturas</h2>
        <div className="stats-places-grid">
          {topPlaces.map((place) => (
            <Link
              className="card stats-place-card"
              href={`/mapa?place=${place.id}`}
              key={place.id}
            >
              {place.placeImageId ? (
                <Image
                  unoptimized
                  src={`/api/assets/${place.placeImageId}`}
                  alt={place.name}
                  width={480}
                  height={300}
                  className="stats-place-image"
                />
              ) : (
                <div className="stats-place-placeholder">
                  Sin foto del lugar
                </div>
              )}
              <div>
                <h3>{place.name}</h3>
                <p>
                  <b>{place.catches.length}</b> capturas
                </p>
                <small>
                  Especie más capturada:{" "}
                  <b>{mostCaughtSpecies(place.catches)?.name ?? "—"}</b>
                </small>
              </div>
            </Link>
          ))}
        </div>
        {!topPlaces.length && <p>Todavía no hay lugares con capturas.</p>}
      </section>
      <section className="stats-section" id="senuelos-perdidos">
        <h2 className="stats-section-title">Señuelos perdidos</h2>
        <div className="stats-horizontal-row">
          {lureUsers.map((user) => (
            <article className="card lost-lure-card" key={user.id}>
              <Link href={`/pescadores/${user.id}`}>
                <b>{user.displayName}</b>
                <LureImage
                  imageId={user.favoriteLureImageId}
                  alt={`Señuelo favorito de ${user.displayName}`}
                />
                <small>{user.favoriteLureName ?? "Señuelo estándar"}</small>
              </Link>
              <strong className="lost-lure-count">{user.lostLures}</strong>
              <small>señuelos perdidos</small>
              {user.id === actor.id && (
                <div className="lure-counter-actions">
                  <form action={changeLostLuresAction.bind(null, 1)}>
                    <SubmitButton>+1</SubmitButton>
                  </form>
                  <form action={changeLostLuresAction.bind(null, -1)}>
                    <SubmitButton disabled={user.lostLures === 0}>
                      −1
                    </SubmitButton>
                  </form>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

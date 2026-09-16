import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatisticsPodium } from "@/components/statistics-podium";
const months = [
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
];

function Field({ title, value }: { title: string; value?: React.ReactNode }) {
  return value ? (
    <div style={{ padding: ".8rem", borderRadius: 12, background: "#f3f8f3" }}>
      <b style={{ display: "block", marginBottom: 4 }}>{title}</b>
      <span>{value}</span>
    </div>
  ) : null;
}

export default async function SpeciesDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.species.findUnique({
    where: { slug },
    include: {
      detailImage: true,
      sources: true,
      catches: {
        where: { deletedAt: null },
        include: {
          fisher: { include: { avatarImage: true } },
        },
        orderBy: { caughtAt: "desc" },
      },
    },
  });
  if (!item || item.archivedAt) notFound();
  const fishers = [
    ...new Map(
      item.catches.map((capture) => [capture.fisher.id, capture.fisher]),
    ).values(),
  ];
  return (
    <>
      <p>
        {item.waterType === "FRESHWATER"
          ? "Agua dulce"
          : item.waterType === "SALTWATER"
            ? "Agua salada"
            : null}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ marginRight: "auto" }}>
          <h1
            style={{
              marginBottom: 2,
              fontSize: "clamp(2.1rem,5vw,3rem)",
              fontWeight: 900,
            }}
          >
            {item.commonName}
          </h1>
          <i>{item.scientificName}</i>
        </div>
        <Link className="button" href={`/capturas/nueva?species=${item.id}`}>
          ＋ Añadir captura
        </Link>
      </div>
      <section
        className="card"
        style={{ padding: "1.2rem", marginTop: "1rem" }}
      >
        <div className="fish-placeholder species-hero">
          {item.detailImage ? (
            <Image
              unoptimized
              src={`/api/assets/${item.detailImage.id}`}
              alt={`Imagen de ${item.commonName}`}
              width={item.detailImage.width || 1000}
              height={item.detailImage.height || 700}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "1.1rem",
              }}
            />
          ) : (
            "🐟"
          )}
          <div className="avatar-stack">
            {fishers.slice(0, 5).map((fisher) => (
              <Link
                key={fisher.id}
                href={`/capturas?species=${item.id}`}
                aria-label={`Ver recuerdos de ${item.commonName}`}
              >
                {fisher.avatarImageId ? (
                  <Image
                    unoptimized
                    className="avatar-dot"
                    src={`/api/assets/${fisher.avatarImageId}?size=thumb`}
                    alt={fisher.displayName}
                    title={fisher.displayName}
                    width={42}
                    height={42}
                  />
                ) : (
                  <span className="avatar-dot" title={fisher.displayName}>
                    {fisher.displayName.slice(0, 1)}
                  </span>
                )}
              </Link>
            ))}
            {fishers.length > 5 && (
              <Link
                className="avatar-dot"
                href={`/capturas?species=${item.id}`}
                aria-label={`Ver todos los recuerdos de ${item.commonName}`}
              >
                +
              </Link>
            )}
          </div>
        </div>
        <p style={{ fontSize: "1.08rem", lineHeight: 1.65 }}>
          {item.description ?? "Información pendiente de revisión."}
        </p>
        <h2>Ficha de campo</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 8,
          }}
        >
          <Field title="Otros nombres" value={item.alternateNames.join(", ")} />
          <Field title="Hábitat" value={item.habitat} />
          <Field
            title="Distribución aproximada en Granada"
            value={item.granadaDistribution}
          />
          <Field
            title="Tamaño habitual"
            value={
              item.usualSizeCm ? `${Number(item.usualSizeCm)} cm` : undefined
            }
          />
          <Field
            title="Tamaño máximo documentado"
            value={
              item.documentedMaxSizeCm
                ? `${Number(item.documentedMaxSizeCm)} cm`
                : undefined
            }
          />
          <Field
            title="Peso habitual"
            value={
              item.usualWeightG ? `${Number(item.usualWeightG)} g` : undefined
            }
          />
          <Field title="Profundidad habitual" value={item.usualDepth} />
          <Field
            title="Dificultad estimada"
            value={item.difficulty ? `${item.difficulty}/5` : undefined}
          />
          <Field title="Técnicas" value={item.techniques.join(", ")} />
          <Field title="Cebos o señuelos" value={item.baits.join(", ")} />
          <Field title="Curiosidades" value={item.curiosities} />
        </div>
        <h2>Meses de mayor actividad</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6,1fr)",
            gap: 5,
          }}
        >
          {months.map((month, index) => (
            <span
              key={month}
              style={{
                textAlign: "center",
                padding: 7,
                borderRadius: 8,
                background: item.activeMonths.includes(index + 1)
                  ? "#9ed3a9"
                  : "#e7ece8",
              }}
            >
              {month}
            </span>
          ))}
        </div>
        <h2>Conservación y normativa</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <Field title="Conservación" value={item.conservationStatus} />
          <Field
            title="Estado legal"
            value={item.legalStatus ?? "Pendiente de revisión"}
          />
          <Field title="Vedas" value={item.closedSeasonNotes} />
          <Field title="Especie invasora" value={item.invasiveNotes} />
          <Field
            title="Temporada biológica"
            value={item.biologicalSeasonNotes}
          />
        </div>
        <aside
          style={{
            padding: "1rem",
            marginTop: 12,
            borderRadius: 12,
            background: "#fff3cd",
          }}
        >
          La normativa puede cambiar. Consulta siempre la regulación oficial
          vigente antes de pescar. La temporada biológica no equivale a
          autorización legal.
        </aside>
      </section>
      <h2>Mejores capturas ({item.catches.length} en total)</h2>
      {item.catches.length === 0 && (
        <p className="card" style={{ padding: "1rem" }}>
          Todavía no hay capturas de esta especie.
        </p>
      )}
      {item.catches.length > 0 && (
        <StatisticsPodium
          metric="Longitud"
          unit="cm"
          records={[...item.catches]
            .sort(
              (a, b) =>
                Number(b.lengthCm) - Number(a.lengthCm) ||
                b.caughtAt.getTime() - a.caughtAt.getTime() ||
                a.id.localeCompare(b.id),
            )
            .slice(0, 3)
            .map((capture) => ({
              id: capture.id,
              speciesName: item.commonName,
              catalogImageId: item.catalogImageId,
              fisherName: capture.fisher.displayName,
              value: Number(capture.lengthCm),
            }))}
        />
      )}
      <Link
        className="button"
        style={{ marginTop: "1rem" }}
        href={`/capturas?species=${encodeURIComponent(item.id)}`}
      >
        Mostrar todas las capturas ({item.catches.length})
      </Link>
    </>
  );
}

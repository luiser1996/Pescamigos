import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/pagination";
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const item = await prisma.species.findUnique({
    where: { slug },
    include: {
      detailImage: true,
      sources: true,
      catches: {
        where: { deletedAt: null },
        include: {
          fisher: { include: { avatarImage: true } },
          place: true,
          photos: { where: { isPrimary: true }, take: 1 },
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
            : "Agua salobre"}
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
      <h2>Capturas ({item.catches.length})</h2>
      {item.catches.length === 0 && (
        <p className="card" style={{ padding: "1rem" }}>
          Todavía no hay capturas de esta especie.
        </p>
      )}
      {item.catches.slice((page - 1) * 15, page * 15).map((capture) => (
        <Link
          href={`/capturas/${capture.id}`}
          className="card"
          style={{
            padding: ".8rem",
            marginBottom: 10,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
          key={capture.id}
        >
          {capture.photos[0] && (
            <Image
              unoptimized
              src={`/api/photos/${capture.photos[0].id}`}
              width={90}
              height={70}
              alt=""
              style={{
                width: 90,
                height: 70,
                borderRadius: 10,
                objectFit: "cover",
              }}
            />
          )}
          <span>
            <b>{capture.fisher.displayName}</b>
            <br />
            {capture.place.name} · {Number(capture.lengthCm)} cm ·{" "}
            {capture.caughtAt.toLocaleDateString("es-ES")}
          </span>
        </Link>
      ))}
      <Pagination
        path={`/especies/${item.slug}`}
        current={page}
        totalItems={item.catches.length}
      />
    </>
  );
}

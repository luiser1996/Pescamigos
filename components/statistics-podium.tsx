import Image from "next/image";
import Link from "next/link";

export type PodiumRecord = {
  id: string;
  speciesName: string;
  catalogImageId: string | null;
  fisherName: string;
  value: number;
};

export function StatisticsPodium({
  records,
  metric,
  unit,
}: {
  records: PodiumRecord[];
  metric: string;
  unit: string;
}) {
  return (
    <article className="card podium-card">
      <h3>{metric}</h3>
      <div className="podium" aria-label={`Podio de ${metric.toLowerCase()}`}>
        {[1, 0, 2].map((index) => {
          const record = records[index];
          return (
            <div className={`podium-entry rank-${index + 1}`} key={index}>
              {record ? (
                <Link href={`/capturas/${record.id}`} className="podium-record">
                  {record.catalogImageId ? (
                    <Image
                      unoptimized
                      src={`/api/assets/${record.catalogImageId}`}
                      alt={record.speciesName}
                      width={120}
                      height={90}
                      className="podium-fish"
                    />
                  ) : (
                    <span
                      className="podium-fish-placeholder"
                      aria-hidden="true"
                    >
                      🐟
                    </span>
                  )}
                  <small>
                    <b>
                      {metric}: {record.value.toLocaleString("es-ES")} {unit}
                    </b>
                    <br />
                    {record.speciesName}
                    <br />
                    {record.fisherName}
                  </small>
                </Link>
              ) : (
                <span className="podium-empty">Sin captura</span>
              )}
              <div className="podium-step">
                <strong>{index + 1}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

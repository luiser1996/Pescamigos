import Link from "next/link";

export function Pagination({
  path,
  current,
  totalItems,
  pageSize = 15,
  pageParam = "page",
  params = {},
}: {
  path: string;
  current: number;
  totalItems: number;
  pageSize?: number;
  pageParam?: string;
  params?: Record<string, string | undefined>;
}) {
  const pages = Math.ceil(totalItems / pageSize);
  if (pages <= 1) return null;
  const start = Math.floor((current - 1) / 10) * 10 + 1;
  const end = Math.min(pages, start + 9);
  const pageLink = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (value) query.set(key, value);
    query.set(pageParam, String(page));
    return `${path}?${query}`;
  };
  return (
    <nav
      aria-label="Paginación"
      style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBlock: 16 }}
    >
      {start > 1 && (
        <Link className="button secondary" href={pageLink(start - 1)}>
          ‹ Anteriores
        </Link>
      )}
      {Array.from({ length: end - start + 1 }, (_, index) => start + index).map(
        (page) => (
          <Link
            key={page}
            className={page === current ? "button" : "button secondary"}
            href={pageLink(page)}
            aria-current={page === current ? "page" : undefined}
          >
            {page}
          </Link>
        ),
      )}
      {end < pages && (
        <Link className="button secondary" href={pageLink(end + 1)}>
          Siguientes ›
        </Link>
      )}
    </nav>
  );
}

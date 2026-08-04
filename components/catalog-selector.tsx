import Link from "next/link";
export function CatalogSelector({
  users,
  current,
}: {
  users: { id: string; displayName: string }[];
  current: string;
}) {
  return (
    <div
      aria-label="Vista del catálogo"
      style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}
    >
      {users.map((u, i) => {
        const value = i === 0 ? "mine" : u.id;
        return (
          <Link
            className={`button ${current === value ? "" : "secondary"}`}
            key={value}
            href={`?vista=${value}`}
          >
            {i === 0 ? "Mi catálogo" : u.displayName}
          </Link>
        );
      })}
      <Link
        className={`button ${current === "all" ? "" : "secondary"}`}
        href="?vista=all"
      >
        Pescamigos
      </Link>
    </div>
  );
}

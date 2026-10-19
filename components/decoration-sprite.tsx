import { decorationBySlug } from "@/lib/decorations";

export function DecorationSprite({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const item = decorationBySlug.get(slug);
  if (!item) return null;
  const column = item.index % item.columns;
  const row = Math.floor(item.index / item.columns);
  return (
    <span
      className={`decoration-sprite ${className}`}
      role="img"
      aria-label={item.name}
      style={{
        backgroundImage: `url(${item.atlas})`,
        backgroundSize: `${item.columns * 100}% ${item.rows * 100}%`,
        backgroundPosition: `${item.columns === 1 ? 0 : (column / (item.columns - 1)) * 100}% ${item.rows === 1 ? 0 : (row / (item.rows - 1)) * 100}%`,
        aspectRatio: item.aspectRatio,
      }}
    />
  );
}

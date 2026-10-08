import type { Rarity } from "@prisma/client";
import { rarityLabels } from "@/lib/ranking";
export function RarityBadge({
  rarity,
  prefix,
}: {
  rarity: Rarity;
  prefix?: string;
}) {
  return (
    <span
      className={`rarity rarity-${rarity.toLowerCase().replace("_", "-")} ${prefix ? "rarity-prefixed" : ""}`}
    >
      {prefix}
      {rarityLabels[rarity]}
    </span>
  );
}

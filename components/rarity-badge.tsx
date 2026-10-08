import type { Rarity } from "@prisma/client";
import { feminineRarityLabels, rarityLabels } from "@/lib/ranking";
export function RarityBadge({
  rarity,
  prefix,
  feminine = false,
}: {
  rarity: Rarity;
  prefix?: string;
  feminine?: boolean;
}) {
  return (
    <span className={`rarity rarity-${rarity.toLowerCase().replace("_", "-")}`}>
      {prefix}
      {(feminine ? feminineRarityLabels : rarityLabels)[rarity]}
    </span>
  );
}

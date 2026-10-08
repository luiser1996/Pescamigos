import { fisherRank } from "@/lib/ranking";
export function RankMedal({ points }: { points: number }) {
  const rank = fisherRank(points);
  return (
    <span
      className={`fisher-rank-medal fisher-rank-${rank.toLowerCase()}`}
      role="img"
      aria-label={`Rango ${rank}`}
    />
  );
}

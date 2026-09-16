export function mostCaughtSpecies(
  catches: { species: { id: string; commonName: string } }[],
) {
  const counts = new Map<string, { name: string; count: number }>();
  for (const item of catches) {
    const previous = counts.get(item.species.id);
    counts.set(item.species.id, {
      name: item.species.commonName,
      count: (previous?.count ?? 0) + 1,
    });
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"),
  )[0];
}

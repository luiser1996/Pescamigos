export function sortCatalog<
  T extends { commonName: string; difficulty: number | null },
>(species: T[], order?: string): T[] {
  return [...species].sort((a, b) => {
    if (order === "difficulty-asc" || order === "difficulty-desc") {
      if (a.difficulty == null && b.difficulty != null) return 1;
      if (b.difficulty == null && a.difficulty != null) return -1;
      const difference = (a.difficulty ?? 0) - (b.difficulty ?? 0);
      if (difference)
        return order === "difficulty-asc" ? difference : -difference;
    }
    return a.commonName.localeCompare(b.commonName, "es");
  });
}

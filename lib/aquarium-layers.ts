export type DecorationLayerAction = "lower" | "raise" | "back" | "front";

type LayeredDecoration = { id: string; layer: number };

export function reorderDecorations<T extends LayeredDecoration>(
  decorations: T[],
  id: string,
  action: DecorationLayerAction,
) {
  const ordered = [...decorations].sort(
    (a, b) => a.layer - b.layer || a.id.localeCompare(b.id),
  );
  const index = ordered.findIndex((item) => item.id === id);
  if (index < 0) return decorations;
  const [selected] = ordered.splice(index, 1);
  const destination =
    action === "back"
      ? 0
      : action === "front"
        ? ordered.length
        : action === "lower"
          ? Math.max(0, index - 1)
          : Math.min(ordered.length, index + 1);
  ordered.splice(destination, 0, selected);
  return ordered.map((item, layer) => ({ ...item, layer }));
}

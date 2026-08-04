import { SlidersHorizontal } from "lucide-react";

export function FilterPanel({
  children,
  label = "Filtros",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <details className="filter-panel card">
      <summary>
        <SlidersHorizontal size={19} aria-hidden="true" />
        {label}
      </summary>
      <div className="filter-panel-content">{children}</div>
    </details>
  );
}

"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const mainViews = [
    "/catalogo",
    "/capturas",
    "/mapa",
    "/estadisticas",
    "/admin",
  ];

  if (pathname === "/" || mainViews.includes(pathname)) return null;

  return (
    <button
      type="button"
      className="button secondary"
      onClick={() => router.back()}
      aria-label="Volver a la página anterior"
      style={{ marginBottom: "1rem", paddingInline: ".8rem" }}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      Volver
    </button>
  );
}

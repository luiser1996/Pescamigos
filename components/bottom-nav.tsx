"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumn, Fish, Map, Shield } from "lucide-react";

const items = [
  { href: "/catalogo", label: "Catálogo", Icon: Fish },
  { href: "/capturas", label: "Recuerdos", Icon: BookOpen },
  { href: "/mapa", label: "Mapa", Icon: Map },
  { href: "/estadisticas", label: "Datos", Icon: ChartNoAxesColumn },
];

function isActive(pathname: string, href: string) {
  if (href === "/catalogo")
    return pathname === href || pathname.startsWith("/especies/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...items, { href: "/admin", label: "Admin", Icon: Shield }]
    : items;

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <div
        style={{
          width: "min(680px,100%)",
          display: "grid",
          gridTemplateColumns: `repeat(${links.length},1fr)`,
        }}
      >
        {links.map(({ href, Icon, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-link${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChartNoAxesColumn, Fish, Map, Shield } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { BackButton } from "@/components/back-button";
import { ScrollToTop } from "@/components/scroll-to-top";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <>
      <header
        style={{ background: "#dff3df", borderBottom: "1px solid #c6dec9" }}
      >
        <div
          className="shell"
          style={{
            paddingBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Link
            href="/"
            style={{ fontSize: "1.3rem", fontWeight: 850, marginRight: "auto" }}
          >
            🐟 Pescamigos
          </Link>
          <Link
            href={`/pescadores/${user.id}`}
            className="profile-header-link"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {user.avatarImageId ? (
              <Image
                unoptimized
                className="avatar-dot"
                src={`/api/assets/${user.avatarImageId}?size=thumb`}
                alt=""
                width={36}
                height={36}
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <span
                className="avatar-dot"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}
              >
                {user.displayName.slice(0, 1)}
              </span>
            )}
            <span className="profile-greeting">Hola, {user.displayName}</span>
          </Link>
          <form action={logoutAction}>
            <button className="button secondary">Salir</button>
          </form>
        </div>
      </header>
      <main className="shell">
        <BackButton />
        {children}
      </main>
      <ScrollToTop />
      <nav
        className="bottom-nav"
        aria-label="Navegación principal"
        style={{
          position: "fixed",
          zIndex: 1000,
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          background: "#fffdf5f2",
          borderTop: "1px solid #cfe2d3",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: "min(680px,100%)",
            display: "grid",
            gridTemplateColumns:
              user.role === "ADMIN" ? "repeat(5,1fr)" : "repeat(4,1fr)",
          }}
        >
          {[
            ["/catalogo", Fish, "Catálogo"],
            ["/capturas", BookOpen, "Recuerdos"],
            ["/mapa", Map, "Mapa"],
            ["/estadisticas", ChartNoAxesColumn, "Datos"],
            ...(user.role === "ADMIN" ? [["/admin", Shield, "Admin"]] : []),
          ].map(([href, Icon, label]) => (
            <Link
              key={String(href)}
              href={String(href)}
              style={{
                minHeight: 62,
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                padding: 6,
              }}
            >
              <Icon size={22} />
              <span>{String(label)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

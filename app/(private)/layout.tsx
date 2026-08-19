import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { BackButton } from "@/components/back-button";
import { ScrollToTop } from "@/components/scroll-to-top";
import { BottomNav } from "@/components/bottom-nav";

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
          className="shell header-shell"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Link
            href="/"
            className="brand-link"
            aria-label="Pescamigos · Ir al catálogo"
          >
            <Image
              className="brand-logo"
              src="/pescamigos-logo.png"
              alt="Pescamigos"
              width={888}
              height={393}
              priority
            />
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
      <BottomNav isAdmin={user.role === "ADMIN"} />
    </>
  );
}

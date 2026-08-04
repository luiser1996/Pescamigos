import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  changePasswordAction,
  updateDisplayNameAction,
} from "@/app/actions/auth";
import { updateAvatarAction } from "@/app/actions/media";
import { AvatarCropInput } from "@/components/avatar-crop-input";
import { PasswordInput } from "@/components/password-input";

export default async function FisherProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    edit?: string;
    error?: string;
    changed?: string;
    avatar?: string;
  }>;
}) {
  const actor = await requireUser();
  const { id } = await params;
  const status = await searchParams;
  const fisher = await prisma.user.findFirst({
    where: { id, active: true },
    include: {
      catches: {
        where: { deletedAt: null },
        include: { species: true, place: true },
        orderBy: { caughtAt: "desc" },
      },
    },
  });
  if (!fisher) notFound();
  const species = new Set(fisher.catches.map((item) => item.speciesId)).size;
  const longest = [...fisher.catches].sort(
    (a, b) => Number(b.lengthCm) - Number(a.lengthCm),
  )[0];
  const heaviest = [...fisher.catches]
    .filter((item) => item.weightG)
    .sort((a, b) => Number(b.weightG) - Number(a.weightG))[0];
  if (actor.id === fisher.id && status.edit) {
    return (
      <>
        <h1>Editar perfil</h1>
        {status.error && (
          <p role="alert" style={{ color: "#9b2c2c" }}>
            {status.error}
          </p>
        )}
        {(status.changed || status.avatar) && (
          <p role="status">✓ Cambios guardados.</p>
        )}
        <section className="card" style={{ padding: "1.3rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 24,
            }}
          >
            <form
              action={updateAvatarAction}
              style={{
                display: "grid",
                gap: 12,
                justifyItems: "center",
                alignContent: "start",
              }}
            >
              <AvatarCropInput
                currentImageUrl={
                  fisher.avatarImageId
                    ? `/api/assets/${fisher.avatarImageId}`
                    : undefined
                }
                initial={fisher.displayName.slice(0, 1).toUpperCase()}
              />
              <small>Pulsa la foto para elegir una nueva.</small>
              <button className="button">Guardar foto</button>
            </form>
            <form
              action={updateDisplayNameAction}
              style={{ display: "grid", gap: 10, alignContent: "start" }}
            >
              <h2>Nombre</h2>
              <label className="field">
                Nombre visible
                <input
                  name="displayName"
                  defaultValue={fisher.displayName}
                  minLength={2}
                  maxLength={60}
                  required
                />
              </label>
              <button className="button">Guardar nombre</button>
            </form>
            <form
              action={changePasswordAction}
              style={{ display: "grid", gap: 10, alignContent: "start" }}
            >
              <h2>Contraseña</h2>
              <label className="field">
                Contraseña actual
                <PasswordInput
                  name="currentPassword"
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="field">
                Nueva contraseña
                <PasswordInput
                  name="newPassword"
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className="button">Actualizar contraseña</button>
            </form>
          </div>
        </section>
      </>
    );
  }
  return (
    <>
      {status.error && (
        <p role="alert" style={{ color: "#9b2c2c" }}>
          {status.error}
        </p>
      )}
      {(status.changed || status.avatar) && (
        <p role="status">✓ Cambios guardados.</p>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        {fisher.avatarImageId ? (
          <Image
            unoptimized
            src={`/api/assets/${fisher.avatarImageId}`}
            alt={`Foto de ${fisher.displayName}`}
            width={180}
            height={180}
            style={{
              width: 170,
              height: 170,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            className="avatar-dot"
            style={{
              width: 170,
              height: 170,
              minWidth: 170,
              minHeight: 170,
              flex: "0 0 170px",
              fontSize: 52,
            }}
          >
            {fisher.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div style={{ marginRight: "auto" }}>
          <p style={{ margin: 0 }}>Perfil y cuaderno personal</p>
          <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.4rem)", marginTop: 6 }}>
            {fisher.displayName}
          </h1>
        </div>
        {actor.id === fisher.id && (
          <Link className="button secondary" href={`/pescadores/${id}?edit=1`}>
            Editar perfil
          </Link>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 10,
        }}
      >
        <article className="card" style={{ padding: "1rem" }}>
          <small>Capturas</small>
          <h2>{fisher.catches.length}</h2>
        </article>
        <article className="card" style={{ padding: "1rem" }}>
          <small>Especies</small>
          <h2>{species}</h2>
        </article>
        <article className="card" style={{ padding: "1rem" }}>
          <small>Mayor longitud</small>
          <h2>{longest ? `${Number(longest.lengthCm)} cm` : "—"}</h2>
        </article>
        <article className="card" style={{ padding: "1rem" }}>
          <small>Mayor peso</small>
          <h2>{heaviest ? `${Number(heaviest.weightG)} g` : "—"}</h2>
        </article>
      </div>
      <h2>Últimos recuerdos</h2>
      {fisher.catches.slice(0, 5).map((item) => (
        <Link
          className="card"
          style={{ display: "block", padding: "1rem", marginBottom: 8 }}
          href={`/capturas/${item.id}`}
          key={item.id}
        >
          <b>{item.species.commonName}</b> · {item.place.name} ·{" "}
          {item.caughtAt.toLocaleDateString("es-ES")}
        </Link>
      ))}
      {fisher.catches.length > 5 && (
        <Link
          className="button secondary"
          href={`/capturas?fisher=${fisher.id}`}
        >
          Ver todos sus recuerdos
        </Link>
      )}
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createPlaceAction,
  createSpeciesAction,
  deletePlaceAction,
  deleteSpeciesAction,
  importSpeciesAction,
  resetMemberPasswordAction,
} from "@/app/actions/admin";
import { createUserAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PasswordInput } from "@/components/password-input";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Pagination } from "@/components/pagination";
import { CircleCheck, Clock3, TriangleAlert } from "lucide-react";

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    speciesPage?: string;
    placePage?: string;
  }>;
}) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  const status = await searchParams;
  const speciesPage = Math.max(
    1,
    Number.parseInt(status.speciesPage ?? "1", 10) || 1,
  );
  const placePage = Math.max(
    1,
    Number.parseInt(status.placePage ?? "1", 10) || 1,
  );
  const [
    users,
    species,
    speciesTotal,
    places,
    placeTotal,
    archivedSpecies,
    archivedPlaces,
    storage,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.species.findMany({
      where: { archivedAt: null },
      orderBy: { commonName: "asc" },
      skip: (speciesPage - 1) * 15,
      take: 15,
    }),
    prisma.species.count({ where: { archivedAt: null } }),
    prisma.fishingPlace.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      skip: (placePage - 1) * 15,
      take: 15,
    }),
    prisma.fishingPlace.count({ where: { archivedAt: null } }),
    prisma.species.findMany({
      where: { archivedAt: { not: null } },
      orderBy: { commonName: "asc" },
    }),
    prisma.fishingPlace.findMany({
      where: { archivedAt: { not: null } },
      orderBy: { name: "asc" },
    }),
    prisma.catchPhoto.aggregate({ _sum: { sizeBytes: true }, _count: true }),
  ]);
  return (
    <>
      <h1>Administración tranquila</h1>
      {status.error && (
        <p role="alert" style={{ color: "#9b2c2c" }}>
          {status.error}
        </p>
      )}
      {status.imported && (
        <p role="status">
          ✓ {status.imported} especies importadas o actualizadas.
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        <section className="card" style={{ padding: "1.2rem" }}>
          <h2>Crear miembro</h2>
          <form action={createUserAction} style={{ display: "grid", gap: 10 }}>
            <label className="field">
              Nombre
              <input name="displayName" required />
            </label>
            <label className="field">
              Usuario
              <input name="username" required />
            </label>
            <label className="field">
              Contraseña temporal
              <PasswordInput name="password" minLength={10} required />
            </label>
            <button className="button">Crear cuenta</button>
          </form>
        </section>
        <section className="card" style={{ padding: "1.2rem" }}>
          <h2>Usuarios ({users.length})</h2>
          {users.map((member) => (
            <form
              action={resetMemberPasswordAction.bind(null, member.id)}
              key={member.id}
              style={{
                borderTop: "1px solid #d8e5da",
                padding: ".8rem 0",
                display: "grid",
                gap: 6,
              }}
            >
              <b>
                {member.displayName} · {member.role}
              </b>
              <label className="field">
                Nueva contraseña temporal
                <PasswordInput name="password" minLength={10} required />
              </label>
              <button className="button secondary">
                Restablecer y cerrar sesiones
              </button>
            </form>
          ))}
        </section>
        <section className="card" style={{ padding: "1.2rem" }}>
          <h2>Crear lugar</h2>
          <p>{placeTotal} lugares guardados.</p>
          <form action={createPlaceAction} style={{ display: "grid", gap: 10 }}>
            <label className="field">
              Nombre
              <input name="name" required />
            </label>
            <label className="field">
              Latitud
              <input
                name="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                required
              />
            </label>
            <label className="field">
              Longitud
              <input
                name="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                required
              />
            </label>
            <label className="field">
              Agua
              <select name="waterType">
                <option value="FRESHWATER">Dulce</option>
                <option value="SALTWATER">Salada</option>
                <option value="BRACKISH">Salobre</option>
              </select>
            </label>
            <button className="button">Guardar lugar</button>
          </form>
        </section>
        <section className="card" style={{ padding: "1.2rem" }}>
          <h2>Crear especie</h2>
          <form
            action={createSpeciesAction}
            style={{ display: "grid", gap: 10 }}
          >
            <label className="field">
              Identificador URL
              <input
                name="slug"
                placeholder="trucha-comun"
                pattern="[a-z0-9-]+"
                required
              />
            </label>
            <label className="field">
              Nombre común
              <input name="commonName" required />
            </label>
            <label className="field">
              Nombre científico
              <input name="scientificName" required />
            </label>
            <label className="field">
              Agua
              <select name="waterType">
                <option value="FRESHWATER">Dulce</option>
                <option value="SALTWATER">Salada</option>
                <option value="BRACKISH">Salobre</option>
              </select>
            </label>
            <label className="field">
              Descripción
              <textarea name="description" rows={3} />
            </label>
            <label className="field">
              Información legal
              <textarea name="legalStatus" rows={3} />
            </label>
            <label className="field">
              Revisión
              <select name="verificationStatus">
                <option value="PENDING">Pendiente</option>
                <option value="NEEDS_REVIEW">Necesita revisión</option>
                <option value="VERIFIED">Verificada</option>
              </select>
            </label>
            <button className="button">Crear especie</button>
          </form>
        </section>
        <section
          className="card"
          style={{ padding: "1.2rem", overflow: "hidden" }}
        >
          <h2>Importar y exportar</h2>
          <p>
            La importación fusiona por <code>slug</code>: actualiza
            coincidencias y añade nuevas especies sin borrar las anteriores.
          </p>
          <form
            action={importSpeciesAction}
            style={{ display: "grid", gap: 10, minWidth: 0 }}
          >
            <label className="field">
              JSON de especies
              <input
                name="file"
                type="file"
                accept="application/json"
                required
              />
            </label>
            <button className="button">Importar JSON</button>
          </form>
          <Link
            href="/api/admin/export"
            className="button secondary"
            style={{ marginTop: 12 }}
          >
            Exportar catálogo JSON
          </Link>
        </section>
        <section className="card" style={{ padding: "1.2rem" }}>
          <h2>Almacenamiento</h2>
          <p>{storage._count} fotografías originales.</p>
          <p>
            {((storage._sum.sizeBytes ?? 0) / 1024 / 1024).toFixed(1)} MB en
            originales registrados, más miniaturas y versiones web.
          </p>
          <p>
            Ruta: <code>{process.env.PHOTO_STORAGE_PATH ?? "./storage"}</code>
          </p>
        </section>
      </div>
      <h2>Especies activas ({speciesTotal})</h2>
      <p>
        <b>Pendiente</b> significa que falta verificación;{" "}
        <b>necesita revisión</b> señala dudas y <b>verificada</b> debe
        reservarse para información contrastada.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {species.map((item) => (
          <div
            className="card"
            style={{
              padding: ".8rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            key={item.id}
          >
            <span style={{ marginRight: "auto" }}>
              <b>{item.commonName}</b> ·{" "}
              {item.verificationStatus === "PENDING" ? (
                <>
                  <Clock3
                    size={17}
                    aria-hidden="true"
                    style={{ verticalAlign: "middle" }}
                  />{" "}
                  Pendiente
                </>
              ) : item.verificationStatus === "NEEDS_REVIEW" ? (
                <>
                  <TriangleAlert
                    size={17}
                    color="#b26a00"
                    aria-hidden="true"
                    style={{ verticalAlign: "middle" }}
                  />{" "}
                  Necesita revisión
                </>
              ) : (
                <>
                  <CircleCheck
                    size={17}
                    color="#238653"
                    aria-hidden="true"
                    style={{ verticalAlign: "middle" }}
                  />{" "}
                  Verificada
                </>
              )}
            </span>
            <Link className="button secondary" href={`/especies/${item.slug}`}>
              Ver
            </Link>
            <Link className="button" href={`/admin/especies/${item.id}`}>
              Editar
            </Link>
          </div>
        ))}
      </div>
      <Pagination
        path="/admin"
        current={speciesPage}
        totalItems={speciesTotal}
        pageParam="speciesPage"
        params={{ placePage: String(placePage) }}
      />
      <h2>Lugares activos ({placeTotal})</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {places.map((place) => (
          <div
            className="card"
            style={{
              padding: ".8rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            key={place.id}
          >
            <span style={{ marginRight: "auto" }}>
              <b>{place.name}</b>
              <br />
              {Number(place.latitude)}, {Number(place.longitude)}
            </span>
            <Link
              className="button secondary"
              href={`/admin/lugares/${place.id}`}
            >
              Editar o mover
            </Link>
          </div>
        ))}
      </div>
      <Pagination
        path="/admin"
        current={placePage}
        totalItems={placeTotal}
        pageParam="placePage"
        params={{ speciesPage: String(speciesPage) }}
      />
      {(archivedSpecies.length > 0 || archivedPlaces.length > 0) && (
        <section className="card" style={{ padding: "1.2rem", marginTop: 24 }}>
          <h2>Elementos archivados</h2>
          <p>
            Puedes eliminarlos definitivamente junto con sus capturas y
            fotografías. Esta acción no se puede deshacer.
          </p>
          {[
            ...archivedSpecies.map((item) => ({
              id: item.id,
              label: `Especie: ${item.commonName}`,
              action: deleteSpeciesAction,
            })),
            ...archivedPlaces.map((item) => ({
              id: item.id,
              label: `Lugar: ${item.name}`,
              action: deletePlaceAction,
            })),
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBlock: ".65rem",
                borderTop: "1px solid #d8e5da",
              }}
            >
              <span style={{ marginRight: "auto" }}>{item.label}</span>
              <form action={item.action.bind(null, item.id)}>
                <ConfirmSubmit message="Se eliminará definitivamente junto con sus capturas y fotografías. ¿Continuar?">
                  Eliminar definitivamente
                </ConfirmSubmit>
              </form>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

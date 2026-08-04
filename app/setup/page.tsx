import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setupAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";

export const dynamic = "force-dynamic";
export default async function Setup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await prisma.user.count()) redirect("/login");
  const { error } = await searchParams;
  return (
    <main className="shell" style={{ maxWidth: 520, paddingTop: "6vh" }}>
      <section className="card" style={{ padding: "2rem" }}>
        <p>Primer arranque</p>
        <h1>Crea la cuenta propietaria</h1>
        <p>
          Será la única cuenta administradora inicial. No existe registro
          público.
        </p>
        {error && <p role="alert">{error}</p>}
        <form action={setupAction} style={{ display: "grid", gap: "1rem" }}>
          <label className="field">
            Nombre visible
            <input name="displayName" defaultValue="Luis" required />
          </label>
          <label className="field">
            Usuario
            <input name="username" autoComplete="username" required />
          </label>
          <label className="field">
            Contraseña (mínimo 10 caracteres)
            <PasswordInput
              name="password"
              minLength={10}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="button">Crear mi cuaderno</button>
        </form>
      </section>
    </main>
  );
}

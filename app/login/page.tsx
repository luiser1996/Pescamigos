import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";

export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentUser()) redirect("/");
  if ((await prisma.user.count()) === 0) redirect("/setup");
  const { error } = await searchParams;
  return (
    <main className="shell" style={{ maxWidth: 480, paddingTop: "10vh" }}>
      <section className="card" style={{ padding: "2rem" }}>
        <div style={{ fontSize: "3rem" }}>🐟</div>
        <h1 style={{ fontSize: "2.2rem", margin: 0 }}>Qué alegría verte</h1>
        <p>Entra a vuestro cuaderno de pesca.</p>
        {error && (
          <p role="alert" style={{ color: "#9b2c2c" }}>
            {error}
          </p>
        )}
        <form action={loginAction} style={{ display: "grid", gap: "1rem" }}>
          <label className="field">
            Usuario
            <input name="username" autoComplete="username" required />
          </label>
          <label className="field">
            Contraseña
            <PasswordInput
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button">Entrar</button>
        </form>
      </section>
    </main>
  );
}

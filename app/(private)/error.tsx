"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PrivateError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("pescamigos_private_error", error);
  }, [error]);

  return (
    <section className="card error-card" role="alert">
      <span className="error-fish" aria-hidden="true">
        🐟
      </span>
      <h1>Algo ha salido mal</h1>
      <p>
        No hemos podido completar esta acción. Tus datos anteriores siguen a
        salvo.
      </p>
      <div className="error-actions">
        <button className="button" type="button" onClick={() => retry()}>
          Volver a intentarlo
        </button>
        <Link className="button secondary" href="/catalogo">
          Ir al catálogo
        </Link>
      </div>
    </section>
  );
}

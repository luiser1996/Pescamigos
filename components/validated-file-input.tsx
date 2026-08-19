"use client";

import { useState } from "react";
import {
  optimizeImageFile,
  replaceInputFiles,
  setImageProcessing,
} from "@/lib/client-image";

export function ValidatedFileInput({
  name,
  multiple = false,
}: {
  name: string;
  multiple?: boolean;
}) {
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  return (
    <>
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={async (event) => {
          const input = event.currentTarget;
          const files = [...(input.files ?? [])];
          if (files.length > 5) {
            input.value = "";
            setError("Puedes seleccionar un máximo de 5 fotografías.");
            return;
          }
          setError("");
          if (!files.length) {
            setStatus("");
            return;
          }
          setStatus("Preparando imágenes…");
          setImageProcessing(input, true);
          try {
            const optimized: File[] = [];
            for (const [index, file] of files.entries()) {
              setStatus(`Preparando imagen ${index + 1} de ${files.length}…`);
              optimized.push(await optimizeImageFile(file));
            }
            replaceInputFiles(input, optimized);
            const reduced = optimized.filter(
              (file, index) => file !== files[index],
            ).length;
            setStatus(
              reduced
                ? `${reduced} imagen${reduced === 1 ? "" : "es"} reducida${reduced === 1 ? "" : "s"} automáticamente.`
                : "",
            );
          } catch (cause) {
            input.value = "";
            setStatus("");
            setError(
              cause instanceof Error
                ? cause.message
                : "No se pudieron preparar las imágenes.",
            );
          } finally {
            setImageProcessing(input, false);
          }
        }}
      />
      {status && <small aria-live="polite">{status}</small>}
      {error && (
        <small role="alert" style={{ color: "#9b2c2c" }}>
          {error}
        </small>
      )}
    </>
  );
}

"use client";

import { useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={async (event) => {
          const input = event.currentTarget;
          input.setCustomValidity("");
          const files = [...(input.files ?? [])];
          if (files.length > 5) {
            input.value = "";
            setError("Puedes seleccionar un máximo de 5 fotografías.");
            input.setCustomValidity(
              "Puedes seleccionar un máximo de 5 fotografías.",
            );
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
              try {
                optimized.push(await optimizeImageFile(file));
              } catch (cause) {
                throw new Error(
                  `Foto ${index + 1} (${file.name.slice(0, 120)}): ${cause instanceof Error ? cause.message : "No se pudo preparar la imagen."}`,
                );
              }
            }
            replaceInputFiles(input, optimized);
            const reduced = optimized.filter(
              (file, index) => file !== files[index],
            ).length;
            setStatus(
              reduced
                ? `${reduced} imagen${reduced === 1 ? "" : "es"} preparada${reduced === 1 ? "" : "s"} para subir.`
                : "",
            );
          } catch (cause) {
            input.value = "";
            setStatus("");
            input.setCustomValidity(
              "La foto no se ha preparado. Elige otra imagen o descarta la selección.",
            );
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
        <div>
          <small role="alert" style={{ color: "#9b2c2c" }}>
            {error}
          </small>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = "";
                inputRef.current.setCustomValidity("");
              }
              setError("");
              setStatus("");
            }}
          >
            Descartar selección
          </button>
        </div>
      )}
    </>
  );
}

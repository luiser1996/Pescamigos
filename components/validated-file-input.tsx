"use client";

import { useState } from "react";

const MAX_BYTES = 12 * 1024 * 1024;

export function ValidatedFileInput({
  name,
  multiple = false,
}: {
  name: string;
  multiple?: boolean;
}) {
  const [error, setError] = useState("");
  return (
    <>
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          const tooLarge = files.find((file) => file.size > MAX_BYTES);
          if (tooLarge) {
            event.target.value = "";
            setError(`“${tooLarge.name}” supera el máximo de 12 MB.`);
          } else if (files.length > 5) {
            event.target.value = "";
            setError("Puedes seleccionar un máximo de 5 fotografías.");
          } else {
            setError("");
          }
        }}
      />
      {error && (
        <small role="alert" style={{ color: "#9b2c2c" }}>
          {error}
        </small>
      )}
    </>
  );
}

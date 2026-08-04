"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

type Drag = { x: number; y: number; focusX: number; focusY: number };

export function ImageCropInput({
  name,
  label,
  prefix,
  round = false,
  required = false,
  triggerImageUrl,
  triggerInitial,
}: {
  name: string;
  label: string;
  prefix: string;
  round?: boolean;
  required?: boolean;
  triggerImageUrl?: string;
  triggerInitial?: string;
}) {
  const [url, setUrl] = useState<string>();
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const drag = useRef<Drag | null>(null);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <label
        className={
          triggerImageUrl || triggerInitial ? "profile-photo-trigger" : "field"
        }
        aria-label={label}
      >
        {triggerImageUrl || triggerInitial ? (
          <>
            {triggerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={triggerImageUrl} alt="Foto de perfil actual" />
            ) : (
              <span>{triggerInitial}</span>
            )}
            <span className="profile-photo-pencil">
              <Pencil size={36} aria-hidden="true" />
            </span>
          </>
        ) : (
          label
        )}
        <input
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={required}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file && file.size > 12 * 1024 * 1024) {
              event.target.value = "";
              setError(`“${file.name}” supera el máximo de 12 MB.`);
              setUrl(undefined);
              return;
            }
            setError("");
            if (url) URL.revokeObjectURL(url);
            setUrl(file ? URL.createObjectURL(file) : undefined);
            setX(50);
            setY(50);
            setZoom(1);
          }}
        />
        {error && (
          <small role="alert" style={{ color: "#9b2c2c" }}>
            {error}
          </small>
        )}
      </label>
      {url && (
        <>
          <div
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                focusX: x,
                focusY: y,
              };
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              setX(
                Math.max(
                  0,
                  Math.min(
                    100,
                    drag.current.focusX - (event.clientX - drag.current.x) / 2,
                  ),
                ),
              );
              setY(
                Math.max(
                  0,
                  Math.min(
                    100,
                    drag.current.focusY - (event.clientY - drag.current.y) / 2,
                  ),
                ),
              );
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            style={{
              width: "min(100%,360px)",
              aspectRatio: round ? "1" : "4 / 3",
              borderRadius: round ? "50%" : "18px",
              overflow: "hidden",
              margin: "auto",
              border: "5px solid white",
              boxShadow: "0 4px 18px #173b2c33",
              touchAction: "none",
              cursor: "grab",
              background: "#dfe9e1",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              draggable={false}
              src={url}
              alt="Vista previa del recorte"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${x}% ${y}%`,
                transform: `scale(${zoom})`,
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
          <small style={{ textAlign: "center" }}>
            Arrastra la foto para encuadrarla.
          </small>
          <label className="field">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step=".1"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <input type="hidden" name={`${prefix}CropX`} value={x} />
          <input type="hidden" name={`${prefix}CropY`} value={y} />
          <input type="hidden" name={`${prefix}CropZoom`} value={zoom} />
        </>
      )}
    </div>
  );
}

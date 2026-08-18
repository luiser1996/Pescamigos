"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { optimizeImageFile, replaceInputFiles } from "@/lib/client-image";

type Drag = {
  x: number;
  y: number;
  focusX: number;
  focusY: number;
  overflowX: number;
  overflowY: number;
};

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
  const [sourceAspect, setSourceAspect] = useState(4 / 3);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const drag = useRef<Drag | null>(null);
  const frameAspect = round ? 1 : 4 / 3;
  const baseWidthPercent =
    sourceAspect >= frameAspect ? (sourceAspect / frameAspect) * 100 : 100;
  const baseHeightPercent =
    sourceAspect >= frameAspect ? 100 : (frameAspect / sourceAspect) * 100;
  const imageWidthPercent = baseWidthPercent * zoom;
  const imageHeightPercent = baseHeightPercent * zoom;
  const leftPercent = -((imageWidthPercent - 100) * x) / 100;
  const topPercent = -((imageHeightPercent - 100) * y) / 100;

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
          onChange={async (event) => {
            const input = event.currentTarget;
            const original = input.files?.[0];
            setError("");
            setStatus(
              original && original.size > 10 * 1024 * 1024
                ? "Reduciendo imagen…"
                : "",
            );
            if (url) URL.revokeObjectURL(url);
            if (!original) {
              setUrl(undefined);
              setStatus("");
              return;
            }
            try {
              const file = await optimizeImageFile(original);
              replaceInputFiles(input, [file]);
              setUrl(URL.createObjectURL(file));
              setStatus(
                file === original
                  ? ""
                  : "Imagen reducida automáticamente antes de subirla.",
              );
            } catch (cause) {
              input.value = "";
              setUrl(undefined);
              setStatus("");
              setError(
                cause instanceof Error
                  ? cause.message
                  : "No se pudo preparar la imagen.",
              );
            }
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
        {status && <small aria-live="polite">{status}</small>}
      </label>
      {url && (
        <>
          <div
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              const bounds = event.currentTarget.getBoundingClientRect();
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                focusX: x,
                focusY: y,
                overflowX: Math.max(
                  0,
                  (bounds.width * (imageWidthPercent - 100)) / 100,
                ),
                overflowY: Math.max(
                  0,
                  (bounds.height * (imageHeightPercent - 100)) / 100,
                ),
              };
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              setX(
                Math.max(
                  0,
                  Math.min(
                    100,
                    drag.current.focusX -
                      ((event.clientX - drag.current.x) * 100) /
                        Math.max(1, drag.current.overflowX),
                  ),
                ),
              );
              setY(
                Math.max(
                  0,
                  Math.min(
                    100,
                    drag.current.focusY -
                      ((event.clientY - drag.current.y) * 100) /
                        Math.max(1, drag.current.overflowY),
                  ),
                ),
              );
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
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
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              draggable={false}
              src={url}
              alt="Vista previa del recorte"
              onLoad={(event) =>
                setSourceAspect(
                  event.currentTarget.naturalWidth /
                    event.currentTarget.naturalHeight,
                )
              }
              style={{
                position: "absolute",
                width: `${imageWidthPercent}%`,
                height: "auto",
                maxWidth: "none",
                maxHeight: "none",
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
          <small style={{ textAlign: "center" }}>
            Arrastra la foto o usa los controles para encuadrarla con precisión.
          </small>
          <div className="crop-direction-controls" aria-label="Mover encuadre">
            <button
              type="button"
              aria-label="Mover arriba"
              onClick={() => setY((value) => Math.max(0, value - 5))}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Mover izquierda"
              onClick={() => setX((value) => Math.max(0, value - 5))}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Centrar encuadre"
              onClick={() => {
                setX(50);
                setY(50);
              }}
            >
              •
            </button>
            <button
              type="button"
              aria-label="Mover derecha"
              onClick={() => setX((value) => Math.min(100, value + 5))}
            >
              →
            </button>
            <button
              type="button"
              aria-label="Mover abajo"
              onClick={() => setY((value) => Math.min(100, value + 5))}
            >
              ↓
            </button>
          </div>
          <label className="field">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step=".05"
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

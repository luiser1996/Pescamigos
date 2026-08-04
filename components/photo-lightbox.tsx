"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
export function PhotoLightbox({
  photos,
  alt,
}: {
  photos: { id: string; width: number; height: number }[];
  alt: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (active === null) dialog.current?.close();
    else dialog.current?.showModal();
  }, [active]);
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 8,
          alignItems: "start",
        }}
      >
        {photos.map((photo, index) => (
          <button
            type="button"
            onClick={() => setActive(index)}
            key={photo.id}
            aria-label="Ampliar fotografía"
            style={{
              border: 0,
              padding: 0,
              background: "transparent",
              borderRadius: 18,
              cursor: "zoom-in",
              overflow: "hidden",
            }}
          >
            <Image
              unoptimized
              src={`/api/photos/${photo.id}`}
              alt={alt}
              width={photo.width || 900}
              height={photo.height || 600}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === dialog.current) setActive(null);
        }}
        style={{
          border: 0,
          borderRadius: 18,
          padding: 8,
          maxWidth: "95vw",
          maxHeight: "95vh",
          background: "#17241fee",
        }}
      >
        {active !== null && (
          <>
            <button
              onClick={() => setActive(null)}
              aria-label="Cerrar"
              style={{
                position: "absolute",
                right: 12,
                top: 12,
                zIndex: 2,
                border: 0,
                borderRadius: 99,
                width: 44,
                height: 44,
                fontSize: 24,
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <Image
              unoptimized
              src={`/api/photos/${photos[active].id}`}
              alt={alt}
              width={photos[active].width || 1600}
              height={photos[active].height || 1200}
              style={{
                display: "block",
                maxWidth: "90vw",
                maxHeight: "88vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <button
                className="button secondary"
                disabled={active === 0}
                onClick={() => setActive(Math.max(0, active - 1))}
              >
                Anterior
              </button>
              <button
                className="button secondary"
                disabled={active === photos.length - 1}
                onClick={() =>
                  setActive(Math.min(photos.length - 1, active + 1))
                }
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

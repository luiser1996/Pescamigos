"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DecorationSprite } from "@/components/decoration-sprite";
import type { DecorationLayerAction } from "@/lib/aquarium-layers";
import { decorationBySlug } from "@/lib/decorations";

export type AquariumBehavior = "FREE_SWIMMER" | "BOTTOM_DWELLER" | "CEPHALOPOD";

export type AquariumFish = {
  id: string;
  name: string;
  lengthCm: number;
  catalogImageId: string | null;
  behavior: AquariumBehavior;
  caughtAt?: string;
  placeName?: string;
  isRecord?: boolean;
  flipCatalogImage?: boolean;
  detailHref?: string | null;
};
export type PlacedDecoration = {
  id: string;
  slug: string;
  rarity: string;
  xPct: number;
  yPct: number;
  scale: number;
  layer: number;
  coversFish: boolean;
  acquiredAtValue?: number;
  isPlaced?: boolean;
};

type Motion = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  nextTurn: number;
  behavior: AquariumBehavior;
};

type DecorationDrag = {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

type DecorationResize = {
  id: string;
  pointerId: number;
  centerX: number;
  centerY: number;
  startDistance: number;
  startScale: number;
  currentScale: number;
};

const SAND_HEIGHT = 53;
const fishWidth = (lengthCm: number) =>
  Math.min(245, Math.max(36, lengthCm * 2.35));

function seed(value: string) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return Math.abs(result);
}

export function VirtualAquarium({
  fish,
  decorations = [],
  editableDecorations = false,
  onPlaceDecoration,
  onRemoveDecoration,
  onSelectDecoration,
  onChangeDecorationLayer,
  onToggleDecorationCoversFish,
  onResizeDecoration,
  onRemoveFish,
  pendingDecorationId,
}: {
  fish: AquariumFish[];
  decorations?: PlacedDecoration[];
  editableDecorations?: boolean;
  onPlaceDecoration?: (id: string, xPct: number, yPct: number) => void;
  onRemoveDecoration?: (id: string) => void;
  onSelectDecoration?: (id: string | null) => void;
  onChangeDecorationLayer?: (id: string, action: DecorationLayerAction) => void;
  onToggleDecorationCoversFish?: (id: string) => void;
  onResizeDecoration?: (id: string, scale: number) => void;
  onRemoveFish?: (id: string) => void;
  pendingDecorationId?: string | null;
}) {
  const tankRef = useRef<HTMLDivElement>(null);
  const fishRefs = useRef(new Map<string, HTMLButtonElement>());
  const decorationDrag = useRef<DecorationDrag | null>(null);
  const decorationResize = useRef<DecorationResize | null>(null);
  const decorationDragMoved = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [decorationPreview, setDecorationPreview] = useState<{
    id: string;
    xPct: number;
    yPct: number;
  } | null>(null);
  const [decorationScalePreview, setDecorationScalePreview] = useState<{
    id: string;
    scale: number;
  } | null>(null);
  const [spriteScales, setSpriteScales] = useState<Record<string, number>>({});
  const [sparkling, setSparkling] = useState<Set<string>>(() => new Set());
  const activeFish = fish.find((item) => item.id === activeId);
  const activeDecoration = decorations.find(
    (item) => item.id === pendingDecorationId,
  );

  const decorationPosition = (clientX: number, clientY: number) => {
    const tank = tankRef.current;
    const drag = decorationDrag.current;
    if (!tank || !drag) return null;
    const bounds = tank.getBoundingClientRect();
    return {
      id: drag.id,
      xPct: Math.max(
        1,
        Math.min(
          99,
          ((clientX - bounds.left - drag.offsetX) / bounds.width) * 100,
        ),
      ),
      yPct: Math.max(
        1,
        Math.min(
          97,
          ((clientY - bounds.top - drag.offsetY) / bounds.height) * 100,
        ),
      ),
    };
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    fish
      .filter((item) => item.isRecord)
      .forEach((item) => {
        const sparkle = () => {
          setSparkling((current) => new Set(current).add(item.id));
          timers.push(
            setTimeout(() => {
              setSparkling((current) => {
                const next = new Set(current);
                next.delete(item.id);
                return next;
              });
            }, 1900),
          );
          timers.push(setTimeout(sparkle, 2600 + Math.random() * 2200));
        };
        timers.push(setTimeout(sparkle, 300 + Math.random() * 1800));
      });
    return () => timers.forEach(clearTimeout);
  }, [fish]);

  const normalizeSprite = (id: string, image: HTMLImageElement) => {
    if (!image.naturalWidth || spriteScales[id]) return;
    const reduction = Math.min(
      1,
      600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * reduction));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * reduction));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    try {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      let left = canvas.width;
      let right = -1;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          if (pixels[(y * canvas.width + x) * 4 + 3] > 16) {
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
        }
      }
      if (right < left) return;
      const sourceAspect = canvas.width / canvas.height;
      const renderedWidthFraction = Math.min(1, sourceAspect / 1.72);
      const visibleWidthFraction =
        renderedWidthFraction * ((right - left + 1) / canvas.width);
      const scale = Math.min(2.8, Math.max(1, 0.9 / visibleWidthFraction));
      setSpriteScales((current) => ({ ...current, [id]: scale }));
    } catch {
      setSpriteScales((current) => ({ ...current, [id]: 1 }));
    }
  };

  useEffect(() => {
    const tank = tankRef.current;
    if (!tank || fish.length === 0) return;
    const motions = new Map<string, Motion>();
    const setBounds = () => {
      const bounds = tank.getBoundingClientRect();
      fish.forEach((item, index) => {
        const width = Math.min(fishWidth(item.lengthCm), bounds.width * 0.38);
        const height = width * 0.58;
        const value = seed(item.id);
        const waterMaxY = Math.max(0, bounds.height - SAND_HEIGHT - height - 5);
        const maxY =
          item.behavior === "BOTTOM_DWELLER"
            ? Math.max(0, bounds.height - height - SAND_HEIGHT * 0.5 - 5)
            : waterMaxY;
        const previous = motions.get(item.id);
        motions.set(item.id, {
          x:
            previous?.x ??
            ((value % 83) / 83) * Math.max(1, bounds.width - width),
          y:
            previous?.y ??
            (item.behavior === "BOTTOM_DWELLER"
              ? Math.max(0, maxY - (value % 13))
              : (((value >> 5) % 71) / 71) * maxY),
          vx:
            previous?.vx ??
            (index % 2 ? -1 : 1) *
              (item.behavior === "CEPHALOPOD" ? 0.25 : 0.42),
          vy:
            previous?.vy ??
            (item.behavior === "BOTTOM_DWELLER"
              ? 0
              : (((value >> 3) % 3) - 1) * 0.08),
          width,
          nextTurn:
            previous?.nextTurn ?? performance.now() + 1200 + (value % 2400),
          behavior: item.behavior,
        });
      });
    };
    setBounds();
    const observer = new ResizeObserver(setBounds);
    observer.observe(tank);
    let frame = 0;
    let previousTime = performance.now();
    const animate = (time: number) => {
      const delta = Math.min(2.2, (time - previousTime) / 16.67);
      previousTime = time;
      const bounds = tank.getBoundingClientRect();
      motions.forEach((motion, id) => {
        const node = fishRefs.current.get(id);
        if (!node) return;
        if (time >= motion.nextTurn) {
          const direction =
            Math.random() > 0.22
              ? Math.sign(motion.vx || 1)
              : -Math.sign(motion.vx || 1);
          if (motion.behavior === "CEPHALOPOD") {
            motion.vx = direction * (0.12 + Math.random() * 0.25);
            motion.vy = -0.48 + Math.random() * 0.96;
            motion.nextTurn = time + 900 + Math.random() * 1900;
          } else if (motion.behavior === "BOTTOM_DWELLER") {
            motion.vx = direction * (0.14 + Math.random() * 0.3);
            motion.vy = -0.035 + Math.random() * 0.07;
            motion.nextTurn = time + 2200 + Math.random() * 4200;
          } else {
            motion.vx = direction * (0.22 + Math.random() * 0.46);
            motion.vy = -0.2 + Math.random() * 0.4;
            motion.nextTurn = time + 1600 + Math.random() * 3600;
          }
        }
        const height = motion.width * 0.58;
        const maxX = Math.max(0, bounds.width - motion.width);
        const waterMaxY = Math.max(0, bounds.height - SAND_HEIGHT - height - 5);
        const maxY =
          motion.behavior === "BOTTOM_DWELLER"
            ? Math.max(0, bounds.height - height - SAND_HEIGHT * 0.5 - 5)
            : waterMaxY;
        const minY =
          motion.behavior === "BOTTOM_DWELLER" ? Math.max(0, maxY - 28) : 0;
        motion.x += motion.vx * delta;
        motion.y += motion.vy * delta;
        if (motion.x <= 0 || motion.x >= maxX) {
          motion.x = Math.min(maxX, Math.max(0, motion.x));
          motion.vx *= -1;
        }
        if (motion.y <= minY || motion.y >= maxY) {
          motion.y = Math.min(maxY, Math.max(minY, motion.y));
          motion.vy *= -1;
        }
        node.style.width = `${motion.width}px`;
        node.style.zIndex = String(Math.round(600 - motion.width));
        node.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0) scaleX(${motion.vx > 0 ? -1 : 1})`;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fish]);

  return (
    <div
      ref={tankRef}
      className="virtual-aquarium"
      aria-label="Pecera virtual"
      onClick={(event) => {
        if (
          editableDecorations &&
          pendingDecorationId &&
          !(event.target as HTMLElement).closest(
            ".aquarium-fish, .aquarium-fish-details, .aquarium-decoration",
          ) &&
          tankRef.current
        ) {
          const bounds = tankRef.current.getBoundingClientRect();
          onPlaceDecoration?.(
            pendingDecorationId,
            Math.max(
              1,
              Math.min(
                99,
                ((event.clientX - bounds.left) / bounds.width) * 100,
              ),
            ),
            Math.max(
              1,
              Math.min(
                97,
                ((event.clientY - bounds.top) / bounds.height) * 100,
              ),
            ),
          );
        }
        if (
          !(event.target as HTMLElement).closest(
            ".aquarium-fish, .aquarium-fish-details",
          )
        )
          setActiveId(null);
      }}
      onDragOver={
        editableDecorations ? (event) => event.preventDefault() : undefined
      }
      onDrop={
        editableDecorations
          ? (event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData(
                "application/x-pescamigos-decoration",
              );
              if (!id || !tankRef.current) return;
              const bounds = tankRef.current.getBoundingClientRect();
              onPlaceDecoration?.(
                id,
                Math.max(
                  1,
                  Math.min(
                    99,
                    ((event.clientX - bounds.left) / bounds.width) * 100,
                  ),
                ),
                Math.max(
                  1,
                  Math.min(
                    97,
                    ((event.clientY - bounds.top) / bounds.height) * 100,
                  ),
                ),
              );
            }
          : undefined
      }
    >
      <div className="aquarium-water-light" aria-hidden="true" />
      {decorations.map((item) => (
        <span
          className={`aquarium-decoration rarity-decoration-${item.rarity.toLowerCase().replace("_", "-")} decoration-${item.slug}${editableDecorations ? " editable" : ""}${pendingDecorationId === item.id ? " selected" : ""}`}
          key={item.id}
          style={{
            left: `${decorationPreview?.id === item.id ? decorationPreview.xPct : item.xPct}%`,
            top: `${decorationPreview?.id === item.id ? decorationPreview.yPct : item.yPct}%`,
            transform: `translate(-50%, -50%) scale(${decorationScalePreview?.id === item.id ? decorationScalePreview.scale : item.scale})`,
            zIndex: (item.coversFish ? 700 : 100) + item.layer,
          }}
          onClick={(event) => {
            if (decorationDragMoved.current) {
              decorationDragMoved.current = false;
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            if (
              editableDecorations &&
              !(event.target as HTMLElement).closest("button")
            ) {
              setActiveId(null);
              onSelectDecoration?.(item.id);
            }
          }}
          onPointerDown={(event) => {
            if (
              !editableDecorations ||
              !event.isPrimary ||
              event.button !== 0 ||
              (event.target as HTMLElement).closest("button") ||
              !tankRef.current
            )
              return;
            event.preventDefault();
            event.stopPropagation();
            const bounds = tankRef.current.getBoundingClientRect();
            decorationDrag.current = {
              id: item.id,
              pointerId: event.pointerId,
              offsetX:
                event.clientX - bounds.left - (item.xPct / 100) * bounds.width,
              offsetY:
                event.clientY - bounds.top - (item.yPct / 100) * bounds.height,
            };
            decorationDragMoved.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
            setActiveId(null);
            onSelectDecoration?.(item.id);
          }}
          onPointerMove={(event) => {
            const drag = decorationDrag.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            const position = decorationPosition(event.clientX, event.clientY);
            if (!position) return;
            decorationDragMoved.current = true;
            setDecorationPreview(position);
          }}
          onPointerUp={(event) => {
            const drag = decorationDrag.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            event.stopPropagation();
            const position = decorationPosition(event.clientX, event.clientY);
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
            decorationDrag.current = null;
            setDecorationPreview(null);
            if (position && decorationDragMoved.current)
              onPlaceDecoration?.(position.id, position.xPct, position.yPct);
            window.setTimeout(() => {
              decorationDragMoved.current = false;
            }, 0);
          }}
          onPointerCancel={(event) => {
            if (decorationDrag.current?.pointerId !== event.pointerId) return;
            decorationDrag.current = null;
            decorationDragMoved.current = false;
            setDecorationPreview(null);
          }}
          title={editableDecorations ? "Seleccionar para recolocar" : undefined}
        >
          <DecorationSprite slug={item.slug} />
          {editableDecorations && pendingDecorationId === item.id && (
            <button
              type="button"
              className="aquarium-resize-handle"
              aria-label="Redimensionar decoración"
              title="Arrastra para cambiar el tamaño"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0 || !tankRef.current)
                  return;
                event.preventDefault();
                event.stopPropagation();
                const bounds = tankRef.current.getBoundingClientRect();
                const centerX = bounds.left + (item.xPct / 100) * bounds.width;
                const centerY = bounds.top + (item.yPct / 100) * bounds.height;
                decorationResize.current = {
                  id: item.id,
                  pointerId: event.pointerId,
                  centerX,
                  centerY,
                  startDistance: Math.max(
                    1,
                    Math.hypot(
                      event.clientX - centerX,
                      event.clientY - centerY,
                    ),
                  ),
                  startScale: item.scale,
                  currentScale: item.scale,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const resize = decorationResize.current;
                if (!resize || resize.pointerId !== event.pointerId) return;
                event.preventDefault();
                event.stopPropagation();
                const distance = Math.hypot(
                  event.clientX - resize.centerX,
                  event.clientY - resize.centerY,
                );
                const scale = Math.max(
                  0.5,
                  Math.min(
                    2,
                    resize.startScale * (distance / resize.startDistance),
                  ),
                );
                resize.currentScale = scale;
                setDecorationScalePreview({ id: resize.id, scale });
              }}
              onPointerUp={(event) => {
                const resize = decorationResize.current;
                if (!resize || resize.pointerId !== event.pointerId) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  event.currentTarget.releasePointerCapture(event.pointerId);
                decorationResize.current = null;
                setDecorationScalePreview(null);
                onResizeDecoration?.(resize.id, resize.currentScale);
              }}
              onPointerCancel={() => {
                decorationResize.current = null;
                setDecorationScalePreview(null);
              }}
            />
          )}
        </span>
      ))}
      {fish.length === 0 && (
        <p className="aquarium-empty">La pecera está vacía.</p>
      )}
      {fish.map((item) => (
        <button
          type="button"
          ref={(node) => {
            if (node) fishRefs.current.set(item.id, node);
            else fishRefs.current.delete(item.id);
          }}
          className={`aquarium-fish aquarium-fish-${item.behavior.toLowerCase().replace("_", "-")}`}
          key={item.id}
          title={`${item.name} · ${item.lengthCm} cm`}
          aria-pressed={activeId === item.id}
          onClick={() => {
            onSelectDecoration?.(null);
            setActiveId(activeId === item.id ? null : item.id);
          }}
        >
          {item.catalogImageId ? (
            <span
              className="aquarium-fish-art"
              style={{
                transform: `scale(${spriteScales[item.id] ?? 1}) scaleX(${item.flipCatalogImage || item.name.toLocaleLowerCase("es") === "platija" ? -1 : 1})`,
              }}
            >
              <Image
                unoptimized
                fill
                sizes="260px"
                src={`/api/assets/${item.catalogImageId}`}
                alt={`${item.name}, ${item.lengthCm} cm`}
                onLoad={(event) =>
                  normalizeSprite(item.id, event.currentTarget)
                }
              />
            </span>
          ) : (
            <span className="aquarium-fish-placeholder" aria-label={item.name}>
              🐟
            </span>
          )}
          {item.isRecord && (
            <span
              className={`aquarium-record-sparkles${sparkling.has(item.id) ? " active" : ""}`}
              aria-hidden="true"
            >
              ✦
            </span>
          )}
        </button>
      ))}
      {activeFish && (
        <aside className="aquarium-fish-details" aria-live="polite">
          <button
            type="button"
            className="aquarium-details-close"
            onClick={() => setActiveId(null)}
            aria-label="Cerrar detalles"
          >
            ×
          </button>
          {onRemoveFish ? (
            <div className="aquarium-details-copy aquarium-edit-selection">
              <b>Pez seleccionado</b>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  onRemoveFish(activeFish.id);
                  setActiveId(null);
                }}
              >
                Quitar de la pecera
              </button>
            </div>
          ) : (
            <div className="aquarium-details-copy">
              <b>{activeFish.name}</b>
              <span>{activeFish.lengthCm} cm</span>
              {activeFish.caughtAt && <span>{activeFish.caughtAt}</span>}
              {activeFish.placeName && <span>{activeFish.placeName}</span>}
              {activeFish.detailHref !== null && (
                <Link
                  href={activeFish.detailHref ?? `/capturas/${activeFish.id}`}
                >
                  Ver recuerdo
                </Link>
              )}
            </div>
          )}
          {!onRemoveFish && activeFish.catalogImageId && (
            <span className="aquarium-details-image">
              <Image
                unoptimized
                fill
                sizes="100px"
                src={`/api/assets/${activeFish.catalogImageId}`}
                alt={activeFish.name}
                style={{
                  transform:
                    activeFish.flipCatalogImage ||
                    activeFish.name.toLocaleLowerCase("es") === "platija"
                      ? "scaleX(-1)"
                      : undefined,
                }}
              />
            </span>
          )}
        </aside>
      )}
      {editableDecorations && activeDecoration && (
        <aside className="aquarium-fish-details aquarium-decoration-details">
          <button
            type="button"
            className="aquarium-details-close"
            onClick={() => onSelectDecoration?.(null)}
            aria-label="Cerrar controles"
          >
            ×
          </button>
          <b>
            {decorationBySlug.get(activeDecoration.slug)?.name ??
              "Decoración seleccionada"}
          </b>
          <div className="aquarium-layer-controls">
            <button
              type="button"
              onClick={() =>
                onChangeDecorationLayer?.(activeDecoration.id, "back")
              }
            >
              Mandar al fondo
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeDecorationLayer?.(activeDecoration.id, "lower")
              }
            >
              Bajar una capa
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeDecorationLayer?.(activeDecoration.id, "raise")
              }
            >
              Subir una capa
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeDecorationLayer?.(activeDecoration.id, "front")
              }
            >
              Mandar al frente
            </button>
          </div>
          <label className="aquarium-cover-fish-toggle">
            <input
              type="checkbox"
              checked={activeDecoration.coversFish}
              onChange={() =>
                onToggleDecorationCoversFish?.(activeDecoration.id)
              }
            />
            Cubrir a los peces
          </label>
          <button
            type="button"
            className="button danger"
            onClick={() => onRemoveDecoration?.(activeDecoration.id)}
          >
            Quitar de la pecera
          </button>
        </aside>
      )}
      <div className="aquarium-sand" aria-hidden="true" />
    </div>
  );
}

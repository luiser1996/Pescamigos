"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type AquariumBehavior =
  | "FREE_SWIMMER"
  | "BOTTOM_DWELLER"
  | "CEPHALOPOD";

export type AquariumFish = {
  id: string;
  name: string;
  lengthCm: number;
  catalogImageId: string | null;
  behavior: AquariumBehavior;
  caughtAt?: string;
  placeName?: string;
  isRecord?: boolean;
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

const SAND_HEIGHT = 42;
const fishWidth = (lengthCm: number) =>
  Math.min(260, Math.max(38, lengthCm * 2.55));

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
  compact = false,
}: {
  fish: AquariumFish[];
  compact?: boolean;
}) {
  const tankRef = useRef<HTMLDivElement>(null);
  const fishRefs = useRef(new Map<string, HTMLButtonElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [spriteScales, setSpriteScales] = useState<Record<string, number>>({});
  const activeFish = fish.find((item) => item.id === activeId);

  const normalizeSprite = (
    id: string,
    image: HTMLImageElement,
  ) => {
    if (!image.naturalWidth || spriteScales[id]) return;
    const reduction = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * reduction));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * reduction));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    try {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
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
        const maxY = Math.max(0, bounds.height - SAND_HEIGHT - height - 5);
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
        const maxY = Math.max(0, bounds.height - SAND_HEIGHT - height - 5);
        const minY =
          motion.behavior === "BOTTOM_DWELLER" ? Math.max(0, maxY - 16) : 0;
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
      className={`virtual-aquarium${compact ? " virtual-aquarium-compact" : ""}`}
      aria-label="Pecera virtual"
    >
      <div className="aquarium-water-light" aria-hidden="true" />
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
          onClick={() => setActiveId(activeId === item.id ? null : item.id)}
        >
          {item.catalogImageId ? (
            <span
              className="aquarium-fish-art"
              style={{ transform: `scale(${spriteScales[item.id] ?? 1})` }}
            >
              <Image
                unoptimized
                fill
                sizes="260px"
                src={`/api/assets/${item.catalogImageId}`}
                alt={`${item.name}, ${item.lengthCm} cm`}
                onLoad={(event) => normalizeSprite(item.id, event.currentTarget)}
              />
            </span>
          ) : (
            <span className="aquarium-fish-placeholder" aria-label={item.name}>
              🐟
            </span>
          )}
          {item.isRecord && (
            <span className="aquarium-record-sparkles" aria-hidden="true">
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
          <div className="aquarium-details-copy">
            <b>{activeFish.name}</b>
            <span>{activeFish.lengthCm} cm</span>
            {activeFish.caughtAt && <span>{activeFish.caughtAt}</span>}
            {activeFish.placeName && <span>{activeFish.placeName}</span>}
            <Link href={`/capturas/${activeFish.id}`}>Ver recuerdo</Link>
          </div>
          {activeFish.catalogImageId && (
            <span className="aquarium-details-image">
              <Image
                unoptimized
                fill
                sizes="100px"
                src={`/api/assets/${activeFish.catalogImageId}`}
                alt={activeFish.name}
              />
            </span>
          )}
        </aside>
      )}
      <div className="aquarium-sand" aria-hidden="true" />
    </div>
  );
}

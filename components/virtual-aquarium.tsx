"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export type AquariumFish = {
  id: string;
  name: string;
  lengthCm: number;
  catalogImageId: string | null;
};

type Motion = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  nextTurn: number;
};

const fishWidth = (lengthCm: number) =>
  Math.min(240, Math.max(34, lengthCm * 2.35));

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
  const fishRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const tank = tankRef.current;
    if (!tank || fish.length === 0) return;
    const motions = new Map<string, Motion>();
    const setBounds = () => {
      const bounds = tank.getBoundingClientRect();
      fish.forEach((item, index) => {
        const width = Math.min(fishWidth(item.lengthCm), bounds.width * 0.34);
        const height = width * 0.58;
        const value = seed(item.id);
        const previous = motions.get(item.id);
        motions.set(item.id, {
          x:
            previous?.x ??
            ((value % 83) / 83) * Math.max(1, bounds.width - width),
          y:
            previous?.y ??
            (((value >> 5) % 71) / 71) *
              Math.max(1, bounds.height - height - 38),
          vx: previous?.vx ?? (index % 2 ? -0.42 : 0.42),
          vy: previous?.vy ?? (((value >> 3) % 3) - 1) * 0.08,
          width,
          nextTurn: previous?.nextTurn ?? performance.now() + 1200 + (value % 2400),
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
          const direction = Math.random() > 0.22 ? Math.sign(motion.vx || 1) : -Math.sign(motion.vx || 1);
          motion.vx = direction * (0.22 + Math.random() * 0.46);
          motion.vy = -0.2 + Math.random() * 0.4;
          motion.nextTurn = time + 1600 + Math.random() * 3600;
        }
        const height = motion.width * 0.58;
        const maxX = Math.max(0, bounds.width - motion.width);
        const maxY = Math.max(0, bounds.height - height - 32);
        motion.x += motion.vx * delta;
        motion.y += motion.vy * delta;
        if (motion.x <= 0 || motion.x >= maxX) {
          motion.x = Math.min(maxX, Math.max(0, motion.x));
          motion.vx *= -1;
        }
        if (motion.y <= 0 || motion.y >= maxY) {
          motion.y = Math.min(maxY, Math.max(0, motion.y));
          motion.vy *= -1;
        }
        node.style.width = `${motion.width}px`;
        node.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0) scaleX(${motion.vx < 0 ? -1 : 1})`;
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
        <div
          ref={(node) => {
            if (node) fishRefs.current.set(item.id, node);
            else fishRefs.current.delete(item.id);
          }}
          className="aquarium-fish"
          key={item.id}
          title={`${item.name} · ${item.lengthCm} cm`}
        >
          {item.catalogImageId ? (
            <Image
              unoptimized
              fill
              sizes="220px"
              src={`/api/assets/${item.catalogImageId}`}
              alt={`${item.name}, ${item.lengthCm} cm`}
            />
          ) : (
            <span aria-label={item.name}>🐟</span>
          )}
        </div>
      ))}
      <div className="aquarium-sand" aria-hidden="true" />
    </div>
  );
}

"use client";

import type * as Leaflet from "leaflet";
import { useEffect, useRef } from "react";

export type MapPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  catches: { id: string; label: string }[];
  imageId: string | null;
};

export function CatchMap({
  places,
  tileUrl,
  attribution,
  selectedPlaceId,
}: {
  places: MapPlace[];
  tileUrl: string;
  attribution: string;
  selectedPlaceId?: string;
}) {
  const node = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let instance: Leaflet.Map | undefined;
    void import("leaflet").then(({ default: L }) => {
      if (disposed || !node.current) return;
      instance = L.map(node.current).setView([37.1773, -3.5986], 9);
      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(instance);
      const icon = L.divIcon({
        className: "",
        html: '<svg width="32" height="42" viewBox="0 0 24 24" fill="#4f946f" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="none"/></svg>',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -40],
      });
      for (const place of places) {
        const pin = L.marker([place.latitude, place.longitude], { icon })
          .addTo(instance)
          .bindPopup(
            `${place.imageId ? `<img src="/api/assets/${encodeURIComponent(place.imageId)}?size=thumb" alt="" style="width:220px;height:140px;object-fit:cover;border-radius:10px;margin-bottom:6px">` : ""}<strong>${escapeHtml(place.name)}</strong><br>${place.catches.length} capturas<div style="margin-top:6px;display:grid;gap:5px">${place.catches.map((capture) => `<a href="/capturas/${encodeURIComponent(capture.id)}">${escapeHtml(capture.label)}</a>`).join("")}</div>`,
          );
        if (place.id === selectedPlaceId) {
          pin.openPopup();
          instance.setView([place.latitude, place.longitude], 14);
        }
      }
      if (places.length)
        instance.fitBounds(
          places.map(
            (place) => [place.latitude, place.longitude] as [number, number],
          ),
          { padding: [30, 30], maxZoom: 14 },
        );
    });
    return () => {
      disposed = true;
      instance?.remove();
    };
  }, [places, tileUrl, attribution, selectedPlaceId]);
  return (
    <div
      ref={node}
      className="leaflet-map"
      style={{ height: 500 }}
      aria-label="Mapa de lugares de pesca"
    />
  );
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ]!,
  );
}

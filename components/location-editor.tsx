"use client";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
export function LocationEditor({
  latitude: initialLat,
  longitude: initialLng,
}: {
  latitude: number;
  longitude: number;
}) {
  const node = useRef<HTMLDivElement>(null);
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);
  useEffect(() => {
    let disposed = false;
    let map: Leaflet.Map | undefined;
    void import("leaflet").then(({ default: L }) => {
      if (disposed || !node.current) return;
      map = L.map(node.current).setView([initialLat, initialLng], 14);
      L.tileLayer(
        process.env.NEXT_PUBLIC_TILE_URL ??
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ??
            "&copy; OpenStreetMap contributors",
        },
      ).addTo(map);
      const icon = L.divIcon({
        className: "",
        html: '<svg width="32" height="42" viewBox="0 0 24 24" fill="#4f946f" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="none"/></svg>',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon,
      }).addTo(map);
      const update = (lat: number, lng: number) => {
        setLatitude(Number(lat.toFixed(6)));
        setLongitude(Number(lng.toFixed(6)));
        marker.setLatLng([lat, lng]);
      };
      map.on("click", (event: Leaflet.LeafletMouseEvent) =>
        update(event.latlng.lat, event.latlng.lng),
      );
      marker.on("dragend", () => {
        const point = marker.getLatLng();
        update(point.lat, point.lng);
      });
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [initialLat, initialLng]);
  return (
    <>
      <div ref={node} className="leaflet-map" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label className="field">
          Latitud
          <input
            name="latitude"
            type="number"
            step=".000001"
            value={latitude}
            onChange={(event) => setLatitude(Number(event.target.value))}
            required
          />
        </label>
        <label className="field">
          Longitud
          <input
            name="longitude"
            type="number"
            step=".000001"
            value={longitude}
            onChange={(event) => setLongitude(Number(event.target.value))}
            required
          />
        </label>
      </div>
    </>
  );
}

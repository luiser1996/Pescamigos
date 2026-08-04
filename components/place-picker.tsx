"use client";

import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
type Place = { id: string; name: string };
const markerSvg =
  '<svg width="32" height="42" viewBox="0 0 24 24" fill="#4f946f" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="none"/></svg>';

export function PlacePicker({
  places: initialPlaces,
  selectedPlaceId,
}: {
  places: Place[];
  selectedPlaceId?: string;
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [selected, setSelected] = useState(
    selectedPlaceId ?? initialPlaces[0]?.id ?? "",
  );
  const [open, setOpen] = useState(initialPlaces.length === 0);
  const [latitude, setLatitude] = useState(37.1773);
  const [longitude, setLongitude] = useState(-3.5986);
  const [name, setName] = useState("");
  const [waterType, setWaterType] = useState("FRESHWATER");
  const [photo, setPhoto] = useState<File>();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const marker = useRef<Leaflet.Marker | null>(null);
  const initialPosition = useRef({ latitude, longitude });
  useEffect(() => {
    if (!open || !node.current || map.current) return;
    let disposed = false;
    let instance: Leaflet.Map | undefined;
    void import("leaflet").then(({ default: L }) => {
      if (disposed || !node.current) return;
      const start = initialPosition.current;
      instance = L.map(node.current).setView(
        [start.latitude, start.longitude],
        11,
      );
      L.tileLayer(
        process.env.NEXT_PUBLIC_TILE_URL ??
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ??
            "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        },
      ).addTo(instance);
      const icon = L.divIcon({
        className: "",
        html: markerSvg,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      const pin = L.marker([start.latitude, start.longitude], {
        draggable: true,
        icon,
      }).addTo(instance);
      const update = (lat: number, lng: number) => {
        setLatitude(Number(lat.toFixed(6)));
        setLongitude(Number(lng.toFixed(6)));
        pin.setLatLng([lat, lng]);
      };
      instance.on("click", (event: Leaflet.LeafletMouseEvent) =>
        update(event.latlng.lat, event.latlng.lng),
      );
      pin.on("dragend", () => {
        const point = pin.getLatLng();
        update(point.lat, point.lng);
      });
      map.current = instance;
      marker.current = pin;
    });
    return () => {
      disposed = true;
      instance?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [open]);
  const save = async () => {
    setSaving(true);
    setMessage("");
    const body = new FormData();
    body.set("name", name);
    body.set("latitude", String(latitude));
    body.set("longitude", String(longitude));
    body.set("waterType", waterType);
    if (photo) body.set("photo", photo);
    const response = await fetch("/api/places", { method: "POST", body });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error ?? "No se pudo guardar");
      return;
    }
    setPlaces((current) => [...current, result]);
    setSelected(result.id);
    setOpen(false);
    setMessage("");
  };
  return (
    <fieldset style={{ border: 0, padding: 0, display: "grid", gap: 10 }}>
      <legend style={{ fontWeight: 800 }}>2. Lugar</legend>
      <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
        <label className="field" style={{ flex: 1 }}>
          Lugar guardado
          <select
            name="placeId"
            required
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">Elige un lugar</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button secondary"
          onClick={() => setOpen(true)}
        >
          ＋ Crear lugar
        </button>
      </div>
      {open && (
        <div
          className="card"
          style={{
            padding: "1rem",
            display: "grid",
            gap: 10,
            position: "relative",
            zIndex: 3,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <h3 style={{ marginRight: "auto" }}>Nuevo lugar</h3>
            {initialPlaces.length > 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            )}
          </div>
          <label className="field">
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Tipo de agua
            <select
              value={waterType}
              onChange={(e) => setWaterType(e.target.value)}
            >
              <option value="FRESHWATER">Agua dulce</option>
              <option value="SALTWATER">Agua salada</option>
              <option value="BRACKISH">Agua salobre</option>
            </select>
          </label>
          <label className="field">
            Foto del lugar (opcional)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0])}
            />
          </label>
          <p style={{ margin: 0 }}>
            Pulsa en el mapa o arrastra la chincheta hasta el punto exacto.
          </p>
          <div ref={node} className="leaflet-map" />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <label className="field">
              Latitud
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Longitud
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
              />
            </label>
          </div>
          {message && <p role="status">{message}</p>}
          <button
            type="button"
            className="button"
            disabled={saving || name.trim().length < 2}
            onClick={save}
          >
            {saving ? "Guardando…" : "Guardar lugar y seleccionarlo"}
          </button>
        </div>
      )}
    </fieldset>
  );
}

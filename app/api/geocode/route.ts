import { currentUser } from "@/lib/auth";
export async function GET(request: Request) {
  if (!(await currentUser()))
    return new Response("No autorizado", { status: 401 });
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) return Response.json([]);
  const base =
    process.env.GEOCODING_URL ?? "https://nominatim.openstreetmap.org/search";
  const response = await fetch(
    `${base}?format=jsonv2&limit=5&countrycodes=es&q=${encodeURIComponent(q)}`,
    {
      headers: { "User-Agent": "Pescamigos/1.0 (self-hosted map search)" },
      next: { revalidate: 3600 },
    },
  );
  if (!response.ok) return Response.json([], { status: 502 });
  const results = (await response.json()) as {
    display_name: string;
    lat: string;
    lon: string;
  }[];
  return Response.json(
    results.map((item) => ({
      name: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    })),
  );
}

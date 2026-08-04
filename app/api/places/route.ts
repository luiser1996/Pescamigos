import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { placeSchema } from "@/lib/validation";
import { removeSavedPhoto, saveImageAsset } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });
  const data = await request.formData();
  const parsed = placeSchema.safeParse({
    name: data.get("name"),
    latitude: data.get("latitude"),
    longitude: data.get("longitude"),
    waterType: data.get("waterType"),
  });
  if (!parsed.success)
    return Response.json(
      { error: "Revisa el nombre y las coordenadas" },
      { status: 400 },
    );
  const photo = data.get("photo");
  let saved: Awaited<ReturnType<typeof saveImageAsset>> | null = null;
  try {
    if (photo instanceof File && photo.size > 0)
      saved = await saveImageAsset(photo);
    const place = await prisma.fishingPlace.create({
      data: {
        ...parsed.data,
        createdBy: { connect: { id: user.id } },
        placeImage: saved ? { create: saved } : undefined,
      },
      select: { id: true, name: true },
    });
    return Response.json(place);
  } catch {
    if (saved)
      await removeSavedPhoto([
        saved.originalPath,
        saved.webPath,
        saved.thumbnailPath,
      ]);
    return Response.json(
      { error: "No se pudo guardar el lugar" },
      { status: 500 },
    );
  }
}

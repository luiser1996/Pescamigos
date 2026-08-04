import { readFile } from "node:fs/promises";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentUser()))
    return new Response("No autorizado", { status: 401 });
  const { id } = await params;
  const photo = await prisma.catchPhoto.findFirst({
    where: { id, catch: { deletedAt: null } },
    select: { webPath: true },
  });
  if (!photo) return new Response("No encontrada", { status: 404 });
  try {
    return new Response(await readFile(photo.webPath), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
}

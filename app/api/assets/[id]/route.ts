import { readFile } from "node:fs/promises";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentUser()))
    return new Response("No autorizado", { status: 401 });
  const image = await prisma.storedImage.findUnique({
    where: { id: (await params).id },
  });
  if (!image) return new Response("No encontrada", { status: 404 });
  const thumbnail = new URL(request.url).searchParams.get("size") === "thumb";
  try {
    return new Response(
      await readFile(thumbnail ? image.thumbnailPath : image.webPath),
      {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
}

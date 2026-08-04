import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN")
    return new Response("No autorizado", { status: 401 });
  const species = await prisma.species.findMany({
    include: { sources: true },
    orderBy: { commonName: "asc" },
  });
  return Response.json(species, {
    headers: {
      "Content-Disposition": `attachment; filename="pescamigos-catalogo-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

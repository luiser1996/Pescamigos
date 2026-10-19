import { redirect } from "next/navigation";
import { DecorationCrafting } from "@/components/decoration-crafting";
import { requireUser } from "@/lib/auth";
import { decorations } from "@/lib/decorations";
import { prisma } from "@/lib/prisma";

export default async function AdminCraftingSimulatorPage() {
  const actor = await requireUser();
  if (actor.role !== "ADMIN") redirect("/");
  const owner = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: "luiser1996", mode: "insensitive" } },
        { displayName: { equals: "Luis", mode: "insensitive" } },
      ],
    },
    include: {
      decorations: {
        select: { id: true, slug: true, rarity: true },
        orderBy: { acquiredAt: "desc" },
      },
    },
  });
  const extras = decorations.flatMap((decoration) =>
    Array.from({ length: 3 }, (_, index) => ({
      id: `sim-extra-${decoration.slug}-${index}`,
      slug: decoration.slug,
      rarity: decoration.rarity,
    })),
  );
  return (
    <DecorationCrafting
      simulated
      ownerName={owner?.displayName ?? "Luis"}
      items={[...(owner?.decorations ?? []), ...extras]}
    />
  );
}

import { DecorationCrafting } from "@/components/decoration-crafting";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CraftingPage() {
  const user = await requireUser();
  const items = await prisma.userDecoration.findMany({
    where: { userId: user.id },
    select: { id: true, slug: true, rarity: true, xPct: true, yPct: true },
    orderBy: { acquiredAt: "desc" },
  });
  return (
    <DecorationCrafting
      items={items.map((item) => ({
        id: item.id,
        slug: item.slug,
        rarity: item.rarity,
        isPlaced: item.xPct != null && item.yPct != null,
      }))}
    />
  );
}

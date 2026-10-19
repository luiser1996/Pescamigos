import { DecorationCrafting } from "@/components/decoration-crafting";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CraftingPage() {
  const user = await requireUser();
  const items = await prisma.userDecoration.findMany({
    where: { userId: user.id },
    select: { id: true, slug: true, rarity: true },
    orderBy: { acquiredAt: "desc" },
  });
  return <DecorationCrafting items={items} />;
}

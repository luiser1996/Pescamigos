"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveAquariumAction(data: FormData) {
  const user = await requireUser();
  const requestedIds = [
    ...new Set(
      data
        .getAll("catchIds")
        .map(String)
        .filter((value) => value.length > 0),
    ),
  ];
  const owned = await prisma.catch.findMany({
    where: {
      id: { in: requestedIds },
      fisherId: user.id,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (owned.length !== requestedIds.length)
    redirect(
      `/pescadores/${user.id}/pecera?error=${encodeURIComponent("Alguna captura seleccionada no es válida")}`,
      RedirectType.replace,
    );

  await prisma.$transaction([
    prisma.aquariumFish.deleteMany({ where: { userId: user.id } }),
    prisma.aquariumFish.createMany({
      data: owned.map((item) => ({ userId: user.id, catchId: item.id })),
    }),
  ]);
  revalidatePath(`/pescadores/${user.id}`);
  redirect(`/pescadores/${user.id}?aquarium=saved`, RedirectType.replace);
}

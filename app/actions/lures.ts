"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function changeLostLuresAction(delta: number) {
  const user = await requireUser();
  if (delta !== 1 && delta !== -1) throw new Error("Cambio no válido");
  await prisma.user.updateMany({
    where: { id: user.id, ...(delta === -1 ? { lostLures: { gt: 0 } } : {}) },
    data: { lostLures: { increment: delta } },
  });
  revalidatePath("/estadisticas");
  revalidatePath(`/pescadores/${user.id}`);
}

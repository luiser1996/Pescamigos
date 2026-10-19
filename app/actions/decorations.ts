"use server";

import { randomInt } from "node:crypto";
import type { Rarity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { availableChests } from "@/lib/chests";
import { decorations, rarityOrder } from "@/lib/decorations";
import { prisma } from "@/lib/prisma";

export type ChestState = {
  available: number;
  slug?: string;
  nonce?: string;
  error?: string;
};

function randomRarity(): Rarity {
  const roll = randomInt(100);
  return roll < 50
    ? "COMMON"
    : roll < 80
      ? "RARE"
      : roll < 95
        ? "VERY_RARE"
        : "LEGENDARY";
}

function randomDecoration(rarity: Rarity) {
  const pool = decorations.filter((item) => item.rarity === rarity);
  return pool[randomInt(pool.length)];
}

export async function openChestAction(
  _state: ChestState,
  _data: FormData,
): Promise<ChestState> {
  void _state;
  void _data;
  const user = await requireUser();
  if ((await availableChests(user.id)) < 1)
    return { available: 0, error: "No tienes cofres disponibles" };
  const item = randomDecoration(randomRarity());
  const opened = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    const [awarded, used] = await Promise.all([
      tx.catch.aggregate({
        where: { fisherId: user.id },
        _sum: { chestsAwarded: true },
      }),
      tx.userDecoration.count({ where: { userId: user.id, source: "CHEST" } }),
    ]);
    if ((awarded._sum.chestsAwarded ?? 0) <= used) return false;
    await tx.userDecoration.create({
      data: {
        userId: user.id,
        slug: item.slug,
        rarity: item.rarity,
        source: "CHEST",
      },
    });
    return true;
  });
  if (!opened) return { available: 0, error: "No tienes cofres disponibles" };
  const remaining = await availableChests(user.id);
  revalidatePath("/cofres");
  revalidatePath(`/pescadores/${user.id}/pecera`);
  return { available: remaining, slug: item.slug, nonce: crypto.randomUUID() };
}

export async function craftDecorationsAction(data: FormData) {
  const user = await requireUser();
  const ids = [...new Set(data.getAll("decorationIds").map(String))];
  if (ids.length !== 5) return;
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    const owned = await tx.userDecoration.findMany({
      where: { id: { in: ids }, userId: user.id },
    });
    if (owned.length !== 5 || new Set(owned.map((x) => x.rarity)).size !== 1)
      return;
    const index = rarityOrder.indexOf(owned[0].rarity);
    if (index < 0 || index >= rarityOrder.length - 1) return;
    const reward = randomDecoration(rarityOrder[index + 1]);
    await tx.userDecoration.deleteMany({
      where: { id: { in: ids }, userId: user.id },
    });
    await tx.userDecoration.create({
      data: {
        userId: user.id,
        slug: reward.slug,
        rarity: reward.rarity,
        source: "CRAFT",
      },
    });
  });
  revalidatePath("/cofres/crafteo");
  revalidatePath(`/pescadores/${user.id}/pecera`);
}

export async function dismantleDecorationAction(data: FormData) {
  const user = await requireUser();
  const id = String(data.get("decorationId") ?? "");
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    const owned = await tx.userDecoration.findFirst({
      where: { id, userId: user.id },
    });
    if (!owned) return;
    const index = rarityOrder.indexOf(owned.rarity);
    if (index <= 0) return;
    const rewards = Array.from({ length: 3 }, () =>
      randomDecoration(rarityOrder[index - 1]),
    );
    await tx.userDecoration.delete({ where: { id: owned.id } });
    await tx.userDecoration.createMany({
      data: rewards.map((reward) => ({
        userId: user.id,
        slug: reward.slug,
        rarity: reward.rarity,
        source: "DISMANTLE" as const,
      })),
    });
  });
  revalidatePath("/cofres/crafteo");
  revalidatePath(`/pescadores/${user.id}/pecera`);
}

"use server";

import { redirect, RedirectType } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  removeSavedPhoto,
  saveCroppedAvatar,
  saveCroppedCapture,
  saveImageAsset,
} from "@/lib/storage";

async function store(file: File) {
  const saved = await saveImageAsset(file);
  try {
    return await prisma.storedImage.create({ data: saved });
  } catch (error) {
    await removeSavedPhoto([
      saved.originalPath,
      saved.webPath,
      saved.thumbnailPath,
    ]);
    throw error;
  }
}

async function storeDetail(file: File, data: FormData) {
  const saved = await saveCroppedCapture(
    file,
    Number(data.get("detailCropX") ?? 50),
    Number(data.get("detailCropY") ?? 50),
    Number(data.get("detailCropZoom") ?? 1),
  );
  try {
    return await prisma.storedImage.create({ data: saved });
  } catch (error) {
    await removeSavedPhoto([
      saved.originalPath,
      saved.webPath,
      saved.thumbnailPath,
    ]);
    throw error;
  }
}

export async function updateAvatarAction(data: FormData) {
  const user = await requireUser();
  const file = data.get("avatar");
  if (!(file instanceof File) || file.size === 0)
    redirect(
      `/pescadores/${user.id}?edit=1&error=Selecciona+una+imagen`,
      RedirectType.replace,
    );
  const saved = await saveCroppedAvatar(
    file,
    Number(data.get("avatarCropX") ?? 50),
    Number(data.get("avatarCropY") ?? 50),
    Number(data.get("avatarCropZoom") ?? 1),
  );
  const image = await prisma.storedImage.create({ data: saved });
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarImageId: image.id },
  });
  redirect(`/pescadores/${user.id}?edit=1&avatar=1`, RedirectType.replace);
}

export async function updateSpeciesImagesAction(id: string, data: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("No autorizado");
  const catalog = data.get("catalogImage");
  const detail = data.get("detailImage");
  const update: { catalogImageId?: string; detailImageId?: string } = {};
  if (catalog instanceof File && catalog.size)
    update.catalogImageId = (await store(catalog)).id;
  if (detail instanceof File && detail.size)
    update.detailImageId = (await storeDetail(detail, data)).id;
  if (!Object.keys(update).length)
    redirect(
      `/admin/especies/${id}?error=Selecciona+alguna+imagen`,
      RedirectType.replace,
    );
  await prisma.species.update({ where: { id }, data: update });
  redirect(`/admin/especies/${id}?images=1`, RedirectType.replace);
}

export async function updatePlaceImageAction(id: string, data: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("No autorizado");
  const file = data.get("placeImage");
  if (!(file instanceof File) || !file.size)
    redirect(
      `/admin/lugares/${id}?error=Selecciona+una+imagen`,
      RedirectType.replace,
    );
  const image = await store(file);
  await prisma.fishingPlace.update({
    where: { id },
    data: { placeImageId: image.id },
  });
  redirect(`/admin/lugares/${id}?image=1`, RedirectType.replace);
}

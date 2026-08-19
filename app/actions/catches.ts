"use server";

import { redirect, RedirectType } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeSavedPhoto, saveCroppedCapture, savePhoto } from "@/lib/storage";
import {
  canEditCatch,
  catchEditSchema,
  catchSchema,
  placeSchema,
} from "@/lib/validation";

type SavedPhoto = Awaited<ReturnType<typeof savePhoto>>;

const catchFieldNames: Record<string, string> = {
  speciesId: "Especie",
  placeId: "Lugar",
  caughtAt: "Fecha y hora",
  lengthCm: "Longitud",
  weightG: "Peso",
  mode: "Entorno de pesca",
  disposition: "Resultado",
  notes: "Notas",
  idempotencyKey: "Identificador del formulario",
};

function validationMessage(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  return error.issues
    .map((issue) => {
      const key = String(issue.path[0] ?? "");
      return `${catchFieldNames[key] ?? "Formulario"}: ${issue.message}`;
    })
    .join(" · ");
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

function safeImageError(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "No se pudo procesar la imagen";
}

async function cleanupPhotos(
  paths: string[],
  context: Record<string, unknown>,
) {
  try {
    await removeSavedPhoto(paths);
  } catch (error) {
    console.error("catch_photo_cleanup_failed", {
      ...context,
      reason: safeImageError(error),
    });
  }
}

export async function createCatchAction(formData: FormData) {
  const user = await requireUser();
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0)
    redirect(errorUrl("/capturas/nueva", "Foto principal: es obligatoria"));

  let placeId = String(formData.get("placeId") ?? "");
  if (placeId === "__new" || !placeId) {
    const place = placeSchema.safeParse({
      name: formData.get("placeName"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      waterType: formData.get("placeWaterType"),
    });
    if (!place.success)
      redirect(
        errorUrl(
          "/capturas/nueva",
          `Nuevo lugar: ${place.error.issues.map((issue) => issue.message).join(" · ")}`,
        ),
      );
    placeId = (
      await prisma.fishingPlace.create({
        data: { ...place.data, createdById: user.id },
      })
    ).id;
  }

  const parsed = catchSchema.safeParse({
    ...Object.fromEntries(formData),
    placeId,
  });
  if (!parsed.success)
    redirect(errorUrl("/capturas/nueva", validationMessage(parsed.error)));
  const existing = await prisma.catch.findUnique({
    where: { idempotencyKey: parsed.data.idempotencyKey },
  });
  if (existing) redirect(`/capturas/${existing.id}?saved=1`);

  const extras = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0)
    .slice(0, 5);
  const saved: SavedPhoto[] = [];
  try {
    saved.push(
      await saveCroppedCapture(
        photo,
        Number(formData.get("photoCropX") ?? 50),
        Number(formData.get("photoCropY") ?? 50),
        Number(formData.get("photoCropZoom") ?? 1),
      ),
    );
    for (const file of extras) saved.push(await savePhoto(file));
  } catch (error) {
    console.error("catch_photo_processing_failed", {
      userId: user.id,
      primaryBytes: photo.size,
      extraBytes: extras.map((file) => file.size),
      reason: safeImageError(error),
    });
    await removeSavedPhoto(
      saved.flatMap((file) => [
        file.originalPath,
        file.webPath,
        file.thumbnailPath,
      ]),
    );
    redirect(
      errorUrl("/capturas/nueva", `Foto principal: ${safeImageError(error)}`),
    );
  }
  let itemId: string;
  try {
    const item = await prisma.catch.create({
      data: {
        ...parsed.data,
        fisherId: user.id,
        createdById: user.id,
        photos: {
          create: saved.map((file, index) => ({
            ...file,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        },
      },
    });
    itemId = item.id;
  } catch (error) {
    await removeSavedPhoto(
      saved.flatMap((file) => [
        file.originalPath,
        file.webPath,
        file.thumbnailPath,
      ]),
    );
    throw error;
  }
  redirect(`/capturas/${itemId}?saved=1`);
}

export async function updateCatchAction(id: string, formData: FormData) {
  const actor = await requireUser();
  const current = await prisma.catch.findFirst({
    where: { id, deletedAt: null },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!current || !canEditCatch(actor, current.fisherId))
    throw new Error("No autorizado");
  let placeId = String(formData.get("placeId") ?? "");
  if (placeId === "__new" || !placeId) {
    const place = placeSchema.safeParse({
      name: formData.get("placeName"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      waterType: formData.get("placeWaterType"),
    });
    if (!place.success)
      redirect(
        errorUrl(
          `/capturas/${id}/editar`,
          `Nuevo lugar: ${place.error.issues.map((issue) => issue.message).join(" · ")}`,
        ),
        RedirectType.replace,
      );
    placeId = (
      await prisma.fishingPlace.create({
        data: { ...place.data, createdById: actor.id },
      })
    ).id;
  }
  const parsed = catchEditSchema.safeParse({
    ...Object.fromEntries(formData),
    placeId,
  });
  if (!parsed.success)
    redirect(
      errorUrl(`/capturas/${id}/editar`, validationMessage(parsed.error)),
      RedirectType.replace,
    );
  const primary = formData.get("primaryPhoto");
  const extras = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 5);
  const files = [
    primary instanceof File && primary.size > 0 ? primary : null,
    ...extras,
  ].filter((file): file is File => file !== null);
  const saved: SavedPhoto[] = [];
  try {
    for (const [index, file] of files.entries()) {
      saved.push(
        index === 0 && primary instanceof File && primary.size > 0
          ? await saveCroppedCapture(
              file,
              Number(formData.get("primaryCropX") ?? 50),
              Number(formData.get("primaryCropY") ?? 50),
              Number(formData.get("primaryCropZoom") ?? 1),
            )
          : await savePhoto(file),
      );
    }
  } catch (error) {
    console.error("catch_photo_update_failed", {
      userId: actor.id,
      catchId: id,
      fileBytes: files.map((file) => file.size),
      reason: safeImageError(error),
    });
    await removeSavedPhoto(
      saved.flatMap((file) => [
        file.originalPath,
        file.webPath,
        file.thumbnailPath,
      ]),
    );
    redirect(
      errorUrl(
        `/capturas/${id}/editar`,
        `Fotografía: ${safeImageError(error)}`,
      ),
      RedirectType.replace,
    );
  }
  const replacingPrimary = primary instanceof File && primary.size > 0;
  const oldPrimaries = current.photos.filter((photo) => photo.isPrimary);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.catch.update({ where: { id }, data: parsed.data });
      if (replacingPrimary) {
        if (oldPrimaries.length)
          await tx.catchPhoto.deleteMany({
            where: { id: { in: oldPrimaries.map((photo) => photo.id) } },
          });
        await tx.catchPhoto.updateMany({
          where: { catchId: id },
          data: { isPrimary: false },
        });
      } else if (oldPrimaries.length !== 1 && current.photos[0]) {
        await tx.catchPhoto.updateMany({
          where: { catchId: id },
          data: { isPrimary: false },
        });
        await tx.catchPhoto.update({
          where: { id: current.photos[0].id },
          data: { isPrimary: true },
        });
      }
      const currentCount = await tx.catchPhoto.count({
        where: { catchId: id },
      });
      if (saved.length)
        await tx.catchPhoto.createMany({
          data: saved.map((file, index) => ({
            ...file,
            catchId: id,
            isPrimary: index === 0 && replacingPrimary,
            sortOrder: currentCount + index,
          })),
        });
    });
  } catch (error) {
    await cleanupPhotos(
      saved.flatMap((file) => [
        file.originalPath,
        file.webPath,
        file.thumbnailPath,
      ]),
      { userId: actor.id, catchId: id, phase: "failed_update" },
    );
    console.error("catch_update_failed", {
      userId: actor.id,
      catchId: id,
      reason: safeImageError(error),
    });
    redirect(
      errorUrl(
        `/capturas/${id}/editar`,
        "No se pudieron guardar los cambios. Inténtalo de nuevo.",
      ),
      RedirectType.replace,
    );
  }
  if (replacingPrimary)
    await cleanupPhotos(
      oldPrimaries.flatMap((photo) => [
        photo.originalPath,
        photo.webPath,
        photo.thumbnailPath,
      ]),
      { userId: actor.id, catchId: id, phase: "replaced_primary" },
    );
  redirect(`/capturas/${id}?updated=1`, RedirectType.replace);
}

export async function deleteCatchPhotoAction(photoId: string) {
  const actor = await requireUser();
  const photo = await prisma.catchPhoto.findUnique({
    where: { id: photoId },
    include: {
      catch: { include: { photos: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (
    !photo ||
    photo.catch.deletedAt ||
    !canEditCatch(actor, photo.catch.fisherId)
  )
    throw new Error("No autorizado");
  if (photo.catch.photos.length <= 1)
    redirect(
      `/capturas/${photo.catchId}/editar?error=La+captura+debe+conservar+al+menos+una+foto`,
      RedirectType.replace,
    );
  const replacement = photo.isPrimary
    ? photo.catch.photos.find((item) => item.id !== photo.id)
    : null;
  await prisma.$transaction(async (tx) => {
    await tx.catchPhoto.delete({ where: { id: photo.id } });
    if (replacement) {
      await tx.catchPhoto.updateMany({
        where: { catchId: photo.catchId },
        data: { isPrimary: false },
      });
      await tx.catchPhoto.update({
        where: { id: replacement.id },
        data: { isPrimary: true },
      });
    }
  });
  await removeSavedPhoto([
    photo.originalPath,
    photo.webPath,
    photo.thumbnailPath,
  ]);
  redirect(
    `/capturas/${photo.catchId}/editar?photoDeleted=1`,
    RedirectType.replace,
  );
}

export async function deleteCatchAction(id: string) {
  const actor = await requireUser();
  const current = await prisma.catch.findFirst({
    where: { id, deletedAt: null },
  });
  if (!current || !canEditCatch(actor, current.fisherId))
    throw new Error("No autorizado");
  await prisma.catch.update({ where: { id }, data: { deletedAt: new Date() } });
  redirect("/capturas?deleted=1");
}

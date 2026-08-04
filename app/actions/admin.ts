"use server";

import type { StoredImage } from "@prisma/client";
import { redirect, RedirectType } from "next/navigation";
import { hashPassword, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeSavedPhoto } from "@/lib/storage";
import {
  placeSchema,
  speciesImportSchema,
  speciesInputSchema,
} from "@/lib/validation";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("No autorizado");
  return user;
}

export async function createPlaceAction(data: FormData) {
  const user = await requireAdmin();
  const parsed = placeSchema.parse({
    name: data.get("name"),
    latitude: data.get("latitude"),
    longitude: data.get("longitude"),
    waterType: data.get("waterType"),
  });
  await prisma.fishingPlace.create({
    data: { ...parsed, createdById: user.id },
  });
  redirect("/admin?place=1");
}

export async function createSpeciesAction(data: FormData) {
  await requireAdmin();
  const parsed = speciesInputSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) redirect("/admin?error=Revisa+los+datos+de+la+especie");
  await prisma.species.create({ data: parsed.data });
  redirect("/admin?species=1");
}

export async function archiveSpeciesAction(id: string) {
  await requireAdmin();
  await prisma.species.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  redirect("/admin?archived=1");
}

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const optionalNumber = (value: FormDataEntryValue | null) =>
  value === "" || value == null ? null : Number(value);

export async function updateSpeciesAction(id: string, data: FormData) {
  await requireAdmin();
  await prisma.species.update({
    where: { id },
    data: {
      slug: String(data.get("slug")),
      commonName: String(data.get("commonName")),
      scientificName: String(data.get("scientificName")),
      waterType: String(data.get("waterType")) as
        "FRESHWATER" | "SALTWATER" | "BRACKISH",
      alternateNames: list(data.get("alternateNames")),
      description: String(data.get("description") || "") || null,
      curiosities: String(data.get("curiosities") || "") || null,
      habitat: String(data.get("habitat") || "") || null,
      granadaDistribution:
        String(data.get("granadaDistribution") || "") || null,
      usualSizeCm: optionalNumber(data.get("usualSizeCm")),
      documentedMaxSizeCm: optionalNumber(data.get("documentedMaxSizeCm")),
      usualWeightG: optionalNumber(data.get("usualWeightG")),
      activeMonths: data.getAll("activeMonths").map(Number),
      activityTimes: list(data.get("activityTimes")),
      usualDepth: String(data.get("usualDepth") || "") || null,
      difficulty: optionalNumber(data.get("difficulty")),
      techniques: list(data.get("techniques")),
      baits: list(data.get("baits")),
      conservationStatus: String(data.get("conservationStatus") || "") || null,
      legalStatus: String(data.get("legalStatus") || "") || null,
      closedSeasonNotes: String(data.get("closedSeasonNotes") || "") || null,
      invasiveNotes: String(data.get("invasiveNotes") || "") || null,
      biologicalSeasonNotes:
        String(data.get("biologicalSeasonNotes") || "") || null,
      verificationStatus: String(data.get("verificationStatus")) as
        "PENDING" | "VERIFIED" | "NEEDS_REVIEW",
      reviewedAt:
        data.get("verificationStatus") === "VERIFIED" ? new Date() : null,
    },
  });
  redirect(`/admin/especies/${id}?saved=1`, RedirectType.replace);
}

export async function deleteSpeciesAction(id: string) {
  await requireAdmin();
  const item = await prisma.species.findUnique({
    where: { id },
    include: {
      catalogImage: true,
      detailImage: true,
      catches: { include: { photos: true } },
    },
  });
  if (!item) redirect("/admin");
  const images = [item.catalogImage, item.detailImage].filter(
    (image): image is StoredImage => image !== null,
  );
  await prisma.$transaction(async (tx) => {
    await tx.catch.deleteMany({ where: { speciesId: id } });
    await tx.species.delete({ where: { id } });
    if (images.length) {
      await tx.storedImage.deleteMany({
        where: { id: { in: images.map((image) => image.id) } },
      });
    }
  });
  await removeSavedPhoto([
    ...item.catches.flatMap((capture) =>
      capture.photos.flatMap((photo) => [
        photo.originalPath,
        photo.webPath,
        photo.thumbnailPath,
      ]),
    ),
    ...images.flatMap((image) => [
      image.originalPath,
      image.webPath,
      image.thumbnailPath,
    ]),
  ]);
  redirect("/admin?removedSpecies=1");
}

export async function updatePlaceAction(id: string, data: FormData) {
  await requireAdmin();
  const parsed = placeSchema.parse({
    name: data.get("name"),
    latitude: data.get("latitude"),
    longitude: data.get("longitude"),
    waterType: data.get("waterType"),
  });
  await prisma.fishingPlace.update({
    where: { id },
    data: {
      ...parsed,
    },
  });
  redirect(`/admin/lugares/${id}?saved=1`, RedirectType.replace);
}

export async function deletePlaceAction(id: string) {
  await requireAdmin();
  const item = await prisma.fishingPlace.findUnique({
    where: { id },
    include: { placeImage: true, catches: { include: { photos: true } } },
  });
  if (!item) redirect("/admin");
  await prisma.$transaction(async (tx) => {
    await tx.catch.deleteMany({ where: { placeId: id } });
    await tx.fishingPlace.delete({ where: { id } });
    if (item.placeImageId) {
      await tx.storedImage.delete({ where: { id: item.placeImageId } });
    }
  });
  await removeSavedPhoto([
    ...item.catches.flatMap((capture) =>
      capture.photos.flatMap((photo) => [
        photo.originalPath,
        photo.webPath,
        photo.thumbnailPath,
      ]),
    ),
    ...(item.placeImage
      ? [
          item.placeImage.originalPath,
          item.placeImage.webPath,
          item.placeImage.thumbnailPath,
        ]
      : []),
  ]);
  redirect("/admin?removedPlace=1");
}

export async function resetMemberPasswordAction(id: string, data: FormData) {
  await requireAdmin();
  const password = String(data.get("password") ?? "");
  if (password.length < 10 || password.length > 128)
    redirect("/admin?error=La+contraseña+debe+tener+entre+10+y+128+caracteres");
  const hash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { passwordHash: hash } }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
  redirect("/admin?password=1");
}

export async function importSpeciesAction(data: FormData) {
  await requireAdmin();
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 2_000_000)
    redirect("/admin?error=Selecciona+un+JSON+de+menos+de+2+MB");
  let value: unknown;
  try {
    value = JSON.parse(await file.text());
  } catch {
    redirect("/admin?error=El+archivo+no+es+JSON+válido");
  }
  const parsed = speciesImportSchema.array().safeParse(value);
  if (!parsed.success)
    redirect("/admin?error=El+JSON+no+respeta+el+formato+de+especies");
  await prisma.$transaction(
    parsed.data.map((item) =>
      prisma.species.upsert({
        where: { slug: item.slug },
        update: item,
        create: item,
      }),
    ),
  );
  redirect(`/admin?imported=${parsed.data.length}`);
}

import { z } from "zod";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9._-]+$/),
  password: z.string().min(10).max(128),
});

export const catchSchema = z.object({
  speciesId: z.string().min(1, "elige una especie"),
  placeId: z.string().min(1, "elige o crea un lugar"),
  caughtAt: z.coerce
    .date({ error: "introduce una fecha y hora válidas" })
    .refine(
      (date) => date.getTime() <= Date.now() + 5 * 60_000,
      "La fecha no puede estar en el futuro",
    ),
  lengthCm: z.coerce
    .number({ error: "introduce una longitud válida" })
    .positive("debe ser mayor que cero")
    .max(500, "no puede superar 500 cm"),
  weightG: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce
      .number({ error: "introduce un peso válido" })
      .positive("debe ser mayor que cero")
      .max(1_000_000, "no puede superar 1.000.000 g")
      .optional(),
  ),
  mode: z.enum([
    "SHORE",
    "BOAT",
    "RIVER",
    "RESERVOIR",
    "LAKE",
    "BEACH",
    "PORT",
    "OTHER",
  ]),
  disposition: z.enum(["RELEASED", "KEPT"]),
  notes: z.string().max(2000, "no pueden superar 2.000 caracteres").optional(),
  idempotencyKey: z.string().uuid("recarga la página y vuelve a intentarlo"),
});

export const placeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  waterType: z.enum(["FRESHWATER", "SALTWATER", "BRACKISH"]),
});

export const catchEditSchema = catchSchema
  .omit({ idempotencyKey: true, placeId: true })
  .extend({
    placeId: z.string().min(1),
  });

export const canEditCatch = (
  actor: { id: string; role: "ADMIN" | "MEMBER" },
  fisherId: string,
) => actor.role === "ADMIN" || actor.id === fisherId;

export const speciesInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  commonName: z.string().trim().min(2).max(120),
  scientificName: z.string().trim().min(2).max(160),
  waterType: z.enum(["FRESHWATER", "SALTWATER", "BRACKISH"]),
  description: z.string().trim().max(4000).optional(),
  legalStatus: z.string().trim().max(3000).optional(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "NEEDS_REVIEW"]),
});

const importedPositiveNumber = z.preprocess(
  (value) =>
    value === null || value === ""
      ? undefined
      : typeof value === "string"
        ? Number(value)
        : value,
  z.number().positive().optional(),
);

export const speciesImportSchema = speciesInputSchema.extend({
  verificationStatus: z
    .enum(["PENDING", "VERIFIED", "NEEDS_REVIEW"])
    .default("PENDING"),
  alternateNames: z.array(z.string()).optional(),
  curiosities: z.string().optional(),
  habitat: z.string().optional(),
  granadaDistribution: z.string().optional(),
  usualSizeCm: importedPositiveNumber,
  documentedMaxSizeCm: importedPositiveNumber,
  usualWeightG: importedPositiveNumber,
  activeMonths: z.array(z.number().int().min(1).max(12)).optional(),
  activityTimes: z.array(z.string()).optional(),
  usualDepth: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  techniques: z.array(z.string()).optional(),
  baits: z.array(z.string()).optional(),
  conservationStatus: z.string().optional(),
  closedSeasonNotes: z.string().optional(),
  invasiveNotes: z.string().optional(),
  biologicalSeasonNotes: z.string().optional(),
});

import { execFileSync } from "node:child_process";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const url =
  process.env.E2E_DATABASE_URL ??
  "postgresql://pescamigos:pescamigos_e2e@127.0.0.1:5433/pescamigos_e2e?schema=public";
if (!new URL(url).pathname.includes("pescamigos_e2e"))
  throw new Error(
    "E2E_DATABASE_URL debe apuntar expresamente a pescamigos_e2e",
  );

async function main() {
execFileSync(
  process.execPath,
  [
    "node_modules/prisma/build/index.js",
    "migrate",
    "deploy",
  ],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } },
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
await prisma.$transaction([
  prisma.catch.deleteMany(),
  prisma.species.deleteMany(),
  prisma.fishingPlace.deleteMany(),
  prisma.session.deleteMany(),
  prisma.loginThrottle.deleteMany(),
  prisma.user.deleteMany(),
  prisma.storedImage.deleteMany(),
]);
const passwordHash = await argon2.hash("Pescamigos-2026", {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});
await prisma.user.createMany({
  data: [
    {
      id: "e2e-admin",
      username: "luis",
      displayName: "Luis",
      passwordHash,
      role: "ADMIN",
    },
    {
      id: "e2e-member",
      username: "dani",
      displayName: "Dani",
      passwordHash,
      role: "MEMBER",
    },
  ],
});
await prisma.species.createMany({
  data: [
    {
      id: "e2e-lucio",
      slug: "lucio-e2e",
      commonName: "Lucio E2E",
      scientificName: "Esox lucius",
      waterType: "FRESHWATER",
      verificationStatus: "VERIFIED",
    },
    {
      id: "e2e-trucha",
      slug: "trucha-e2e",
      commonName: "Trucha E2E",
      scientificName: "Salmo trutta",
      waterType: "FRESHWATER",
      verificationStatus: "VERIFIED",
    },
  ],
});
await prisma.fishingPlace.create({
  data: {
    id: "e2e-place",
    name: "Embalse E2E",
    latitude: 37.2,
    longitude: -3.6,
    waterType: "FRESHWATER",
    createdById: "e2e-admin",
  },
});
await prisma.catch.create({
  data: {
    id: "e2e-dani-catch",
    idempotencyKey: "e2e-dani-existing",
    speciesId: "e2e-trucha",
    fisherId: "e2e-member",
    createdById: "e2e-member",
    placeId: "e2e-place",
    caughtAt: new Date("2026-07-01T10:00:00Z"),
    lengthCm: 31,
    mode: "RESERVOIR",
    disposition: "RELEASED",
  },
});
await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

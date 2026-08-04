import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const demo = [
  {
    slug: "trucha-comun-demo",
    commonName: "Trucha común",
    scientificName: "Salmo trutta",
    waterType: "FRESHWATER" as const,
    description:
      "Ficha de demostración; presencia local, regulación y datos biológicos requieren revisión con fuentes oficiales.",
    habitat: "Datos pendientes de revisión.",
    activeMonths: [3, 4, 5, 6],
    verificationStatus: "PENDING" as const,
  },
  {
    slug: "lubina-demo",
    commonName: "Lubina",
    scientificName: "Dicentrarchus labrax",
    waterType: "SALTWATER" as const,
    description:
      "Ficha de demostración; no implica presencia garantizada ni autorización de captura.",
    habitat: "Datos pendientes de revisión.",
    activeMonths: [1, 2, 10, 11, 12],
    verificationStatus: "PENDING" as const,
  },
  {
    slug: "barbo-demo",
    commonName: "Barbo",
    scientificName: "Luciobarbus sp.",
    waterType: "FRESHWATER" as const,
    description:
      "Entrada deliberadamente genérica de demostración; requiere identificación taxonómica y revisión local.",
    activeMonths: [],
    verificationStatus: "NEEDS_REVIEW" as const,
  },
];
async function main() {
  for (const item of demo)
    await prisma.species.upsert({
      where: { slug: item.slug },
      update: {},
      create: item,
    });
  for (const name of ["Spinning", "Pesca a fondo", "Mosca"])
    await prisma.technique.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  for (const name of ["Artificial", "Lombriz", "Pan"])
    await prisma.baitOrLure.upsert({
      where: { name },
      update: {},
      create: { name },
    });
}
main().finally(() => prisma.$disconnect());

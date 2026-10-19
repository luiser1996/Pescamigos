import type { Rarity } from "@prisma/client";

export type DecorationDefinition = {
  slug: string;
  name: string;
  description: string;
  rarity: Rarity;
  atlas: string;
  columns: number;
  rows: number;
  index: number;
  aspectRatio: number;
};

const make = (
  rarity: Rarity,
  atlas: string,
  columns: number,
  rows: number,
  entries: [string, string, number?][],
  aspectRatio = 1.18,
): DecorationDefinition[] =>
  entries.map(([name, description, atlasIndex], index) => ({
    slug: name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name,
    description,
    rarity,
    atlas,
    columns,
    rows,
    index: atlasIndex ?? index,
    aspectRatio,
  }));

export const rarityOrder: Rarity[] = [
  "COMMON",
  "RARE",
  "VERY_RARE",
  "LEGENDARY",
];
export const decorationRarityLabels: Record<Rarity, string> = {
  COMMON: "Común",
  RARE: "Raro",
  VERY_RARE: "Muy raro",
  LEGENDARY: "Legendario",
};
export const decorationOdds: Record<Rarity, number> = {
  COMMON: 50,
  RARE: 30,
  VERY_RARE: 15,
  LEGENDARY: 5,
};

export const chestsForPoints = (points: number) =>
  1 + Math.floor(Math.max(0, points) / 300);

export const remainingChests = (awarded: number, opened: number) =>
  Math.max(0, awarded - opened);

export const decorations: DecorationDefinition[] = [
  ...make(
    "COMMON",
    "/decorations/common-atlas.png?v=4",
    5,
    4,
    [
      ["Roca lisa", "Piedra gris redondeada", 0],
      ["Planta acuática", "Planta verde que se balancea suavemente", 1],
      ["Concha marina", "Concha decorativa sobre la arena", 2],
      ["Guijarros de colores", "Conjunto de pequeñas piedras", 3],
      ["Rama sumergida", "Rama de madera bajo el agua", 4],
      ["Algas verdes", "Grupo de algas que se mueve con la corriente", 5],
      ["Caracola", "Concha de caracol marino", 7],
      ["Piedras apiladas", "Pequeña torre de piedras", 8],
      ["Estrella de mar", "Estrella marina decorativa", 9],
      ["Tronco pequeño", "Fragmento de madera sumergida", 10],
      ["Hierba marina", "Grupo de hojas largas y verdes", 11],
      ["Conchas dispersas", "Conjunto de conchas sobre el sustrato", 12],
      ["Roca musgosa", "Piedra cubierta de musgo", 13],
      ["Cañas acuáticas", "Pequeños tallos verticales", 14],
      ["Piedra agujereada", "Roca con pequeñas cavidades", 17],
      ["Hojas sumergidas", "Hojas caídas sobre el fondo", 18],
    ],
    1,
  ),
  ...make(
    "COMMON",
    "/decorations/items/river-gravel.png",
    1,
    1,
    [["Grava de río", "Guijarros de río sueltos y redondeados"]],
    1.5,
  ),
  ...make(
    "RARE",
    "/decorations/rare-atlas.png?v=4",
    4,
    3,
    [
      ["Coral rojo", "Coral ramificado de color intenso"],
      ["Cofre hundido", "Antiguo cofre cerrado y cubierto de algas"],
      ["Ánfora antigua", "Vasija de barro que sirve de refugio"],
      ["Tronco hueco", "Escondite natural para los peces"],
      ["Arco de piedra", "Formación rocosa que los peces pueden atravesar"],
      ["Almeja gigante", "Concha que se abre y cierra lentamente"],
      ["Piedra burbujeante", "Roca que genera burbujas"],
      ["Ancla oxidada", "Ancla antigua parcialmente enterrada"],
      ["Coral abanico", "Coral plano y ramificado"],
      ["Barril hundido", "Barril de madera deteriorado"],
      ["Jardín de algas", "Plantas acuáticas de diferentes colores"],
      ["Estatua de sirena", "Pequeña escultura de piedra sumergida"],
    ],
    1,
  ),
  ...make(
    "VERY_RARE",
    "/decorations/items/sunken-ruins.png",
    1,
    1,
    [["Ruinas sumergidas", "Columnas y estructuras de un antiguo templo"]],
    1.5,
  ),
  ...make(
    "VERY_RARE",
    "/decorations/items/shipwreck.png",
    1,
    1,
    [["Barco naufragado", "Restos de un navío cubierto de vegetación"]],
    1.5,
  ),
  ...make(
    "VERY_RARE",
    "/decorations/items/giant-pearl.png",
    1,
    1,
    [["Perla gigante", "Gran concha abierta con una perla resplandeciente"]],
    1.094,
  ),
  ...make(
    "VERY_RARE",
    "/decorations/items/luminous-coral.png",
    1,
    1,
    [["Coral luminoso", "Coral bioluminiscente"]],
    1.094,
  ),
  ...make(
    "VERY_RARE",
    "/decorations/items/pirate-treasure.png",
    1,
    1,
    [["Tesoro del pirata", "Cofre abierto repleto de monedas"]],
    1.094,
  ),
  ...make(
    "VERY_RARE",
    "/decorations/items/marine-skeleton.png",
    1,
    1,
    [["Esqueleto marino", "Restos de una enorme criatura marina"]],
    1.5,
  ),
  ...make(
    "LEGENDARY",
    "/decorations/items/atlantis-palace.png",
    1,
    1,
    [
      [
        "Palacio de la Atlántida",
        "Palacio submarino con columnas doradas y cristales luminosos",
      ],
    ],
    1.5,
  ),
  ...make(
    "LEGENDARY",
    "/decorations/items/poseidon-trident.png",
    1,
    1,
    [
      [
        "Tridente de Poseidón",
        "Tridente dorado que emite destellos y un resplandor azul",
      ],
    ],
    0.833,
  ),
];

export const decorationBySlug = new Map(
  decorations.map((item) => [item.slug, item]),
);

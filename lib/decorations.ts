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
};

const make = (
  rarity: Rarity,
  atlas: string,
  columns: number,
  rows: number,
  entries: [string, string][],
): DecorationDefinition[] =>
  entries.map(([name, description], index) => ({
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
    index,
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

export const decorations: DecorationDefinition[] = [
  ...make("COMMON", "/decorations/common-atlas.png?v=2", 5, 4, [
    ["Roca lisa", "Piedra gris redondeada"],
    ["Planta acuática", "Planta verde que se balancea suavemente"],
    ["Concha marina", "Concha decorativa sobre la arena"],
    ["Guijarros de colores", "Conjunto de pequeñas piedras"],
    ["Rama sumergida", "Rama de madera bajo el agua"],
    ["Algas verdes", "Grupo de algas que se mueve con la corriente"],
    ["Montículo de arena", "Pequeña elevación del fondo"],
    ["Caracola", "Concha de caracol marino"],
    ["Piedras apiladas", "Pequeña torre de piedras"],
    ["Estrella de mar", "Estrella marina decorativa"],
    ["Tronco pequeño", "Fragmento de madera sumergida"],
    ["Hierba marina", "Grupo de hojas largas y verdes"],
    ["Conchas dispersas", "Conjunto de conchas sobre el sustrato"],
    ["Roca musgosa", "Piedra cubierta de musgo"],
    ["Cañas acuáticas", "Pequeños tallos verticales"],
    ["Arena blanca", "Zona de arena clara"],
    ["Arena oscura", "Zona de arena volcánica"],
    ["Piedra agujereada", "Roca con pequeñas cavidades"],
    ["Hojas sumergidas", "Hojas caídas sobre el fondo"],
    ["Grava de río", "Piedras pequeñas y redondeadas"],
  ]),
  ...make("RARE", "/decorations/rare-atlas.png?v=2", 4, 3, [
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
  ]),
  ...make("VERY_RARE", "/decorations/very-rare-atlas.png", 3, 2, [
    ["Ruinas sumergidas", "Columnas y estructuras de un antiguo templo"],
    ["Barco naufragado", "Restos de un navío cubierto de vegetación"],
    ["Perla gigante", "Gran concha abierta con una perla resplandeciente"],
    ["Coral luminoso", "Coral bioluminiscente"],
    ["Tesoro del pirata", "Cofre abierto repleto de monedas"],
    ["Esqueleto marino", "Restos de una enorme criatura marina"],
  ]),
  ...make("LEGENDARY", "/decorations/legendary-atlas.png?v=2", 2, 1, [
    [
      "Palacio de la Atlántida",
      "Palacio submarino con columnas doradas y cristales luminosos",
    ],
    [
      "Tridente de Poseidón",
      "Tridente dorado que emite destellos y un resplandor azul",
    ],
  ]),
];

export const decorationBySlug = new Map(
  decorations.map((item) => [item.slug, item]),
);

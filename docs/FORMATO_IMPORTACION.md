# Formato JSON de importación de especies

El archivo debe contener un array JSON. `slug`, `commonName`, `scientificName` y `waterType` son obligatorios. `verificationStatus` es opcional y, si se omite, queda como `PENDING`.

```json
[
  {
    "slug": "pez-sol",
    "commonName": "Pez sol",
    "scientificName": "Lepomis gibbosus",
    "waterType": "FRESHWATER",
    "description": "Descripción revisable.",
    "legalStatus": "Información regulatoria fechada y contrastada.",
    "verificationStatus": "PENDING",
    "alternateNames": ["Percasol"],
    "activeMonths": [4, 5, 6],
    "activityTimes": ["Mañana", "Tarde"],
    "techniques": ["Spinning"],
    "baits": ["Señuelo artificial"],
    "usualSizeCm": 15,
    "difficulty": 2
  }
]
```

Valores admitidos:

- `waterType`: `FRESHWATER`, `SALTWATER` o `BRACKISH`.
- `verificationStatus`: `PENDING`, `NEEDS_REVIEW` o `VERIFIED`.
- `activeMonths`: números enteros de 1 a 12.
- `difficulty`: entero de 1 a 5.
- Medidas y pesos: números positivos, sin unidades dentro del valor. También se aceptan cadenas numéricas procedentes de una exportación de Prisma, por ejemplo `"49.5"`.

La importación fusiona por `slug`: crea las especies nuevas y actualiza únicamente los campos incluidos de las existentes. No elimina las demás especies.

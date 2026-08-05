# Auditoría de seguridad de dependencias

Fecha de auditoría: 5 de agosto de 2026.

## Resultado reproducible

Antes de actualizar, `npm ci` instaló 561 paquetes y `npm audit --omit=dev --json` informó 3 paquetes con severidad alta (`next`, `postcss` y `sharp`), 0 críticos. El nodo `next` era una dependencia directa marcada como afectada por sus copias transitivas vulnerables.

Después de fijar `next@16.3.0`, `sharp@0.35.3`, `postcss@8.5.25` y `eslint-config-next@16.3.0`, `npm audit --omit=dev --json` informa 0 vulnerabilidades: 0 críticas, 0 altas, 0 moderadas, 0 bajas y 0 informativas.

Árbol final relevante:

```text
pescamigos
├─ next@16.3.0
│  ├─ postcss@8.5.23
│  └─ sharp@0.35.3 (deduplicada con la directa)
├─ sharp@0.35.3
├─ postcss@8.5.25
├─ @tailwindcss/postcss@4.3.3 → postcss@8.5.25
└─ vitest@4.1.10 → vite@8.2.0 → postcss@8.5.25
```

No se aplicó `npm audit fix --force`, no se rebajó Next.js y no se mantienen `overrides`: Next 16.3.0 declara rangos compatibles y npm deduplica Sharp de forma segura.

## Avisos detectados antes de la actualización

### GHSA-qx2v-qp2m-jg93 — PostCSS XSS al serializar `</style>`

- Severidad del aviso: moderada; CVSS 6.1, CWE-79.
- Afectadas: PostCSS `<8.5.10`. Corregida: `8.5.10` o posterior.
- Ruta anterior: `pescamigos → next@16.2.12 → postcss@8.4.31`.
- Tipo: transitiva de la dependencia directa de producción Next.js; incluida en la instalación de producción.
- Alcanzabilidad: la copia se utilizaba en el toolchain de Next durante build. Pescamigos no acepta CSS, temas, mapas de fuentes ni estilos proporcionados por usuarios, por lo que no recibía entrada no confiable en producción.
- Mitigación/corrección: Next 16.3.0 incluye PostCSS 8.5.23. PostCSS directo se fijó en 8.5.25.

### GHSA-6g55-p6wh-862q — lectura arbitraria mediante `sourceMappingURL`

- Severidad: alta; CVSS 7.5, CWE-22/CWE-200.
- Afectadas: PostCSS `<=8.5.11`. Corregida: `8.5.12` o posterior.
- Ruta anterior: `pescamigos → next@16.2.12 → postcss@8.4.31`.
- Tipo/producción: transitiva de Next, incluida en producción.
- Alcanzabilidad: solo build con CSS propio versionado; ninguna ruta procesa CSS subido o controlado por usuarios.
- Mitigación/corrección: actualización a la copia 8.5.23 de Next 16.3.0 y directa 8.5.25.

### GHSA-r28c-9q8g-f849 — path traversal al cargar source maps previos

- Severidad: alta; CVSS 7.5, CWE-22.
- Afectadas: PostCSS `<=8.5.17`. Corregida: `8.5.18` o posterior.
- Ruta anterior: `pescamigos → next@16.2.12 → postcss@8.4.31`.
- Tipo/producción: transitiva de Next, incluida en producción.
- Alcanzabilidad: no alcanzable con datos de usuarios; Pescamigos no admite CSS ni source maps subidos.
- Mitigación/corrección: PostCSS 8.5.23/8.5.25.

### GHSA-fxqj-rqcc-2cmp — corrección incompleta de lectura de `.map`

- Severidad: moderada; CWE-22/CWE-200.
- Afectadas: PostCSS `<=8.5.22`. Corregida: `8.5.23` o posterior.
- Ruta anterior: `pescamigos → next@16.2.12 → postcss@8.4.31`.
- Tipo/producción: transitiva de Next, incluida en producción.
- Alcanzabilidad: solo build con CSS confiable del repositorio; no existe entrada CSS de usuarios.
- Mitigación/corrección: Next usa exactamente 8.5.23 y el toolchain directo 8.5.25.

### GHSA-f88m-g3jw-g9cj — Sharp hereda vulnerabilidades de libvips

- Severidad: alta; CWE-1395.
- CVE incluidas: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590 y CVE-2026-35591.
- Afectadas: Sharp `<0.35.0`. Corregida: Sharp `0.35.0` o posterior.
- Ruta anterior vulnerable: `pescamigos → next@16.2.12 → sharp@0.34.5` (transitiva y opcional de Next, instalada en producción).
- Ruta propia anterior y actual: `pescamigos → sharp@0.35.3` (directa, corregida).
- Alcanzabilidad anterior: el procesador de subidas importaba la copia directa corregida. Todas las vistas de imágenes de usuarios usan `unoptimized` o `<img>` contra rutas privadas que sirven WebP ya generado; por tanto, la copia interna de Next no recibía originales controlados por usuarios. Aun así, una configuración futura incorrecta podía volverla alcanzable.
- Mitigación/corrección: Next 16.3.0 comparte Sharp 0.35.3. La subida valida firma JPEG/PNG/WebP antes de invocar Sharp, limita bytes/dimensiones/píxeles, corrige EXIF, elimina metadatos de las versiones WebP, usa nombres aleatorios, limpia salidas parciales y nunca expone originales.

## PostCSS y entrada no confiable

No hay campos, rutas ni importadores que acepten CSS, temas o source maps. PostCSS procesa exclusivamente `app/globals.css` y dependencias versionadas durante el build. Los errores internos y rutas de archivos no se devuelven desde ninguna acción o API.

## Excepciones temporales de CI

No hay excepciones activas. La auditoría de producción es cero y CI ejecuta `npm audit --omit=dev` sin listas genéricas de ignorados. Si apareciera un aviso no corregible, deberá añadirse aquí de forma individual con GHSA/CVE, dependencia, alcance, mitigación, fecha de revisión y condición de retirada antes de modificar CI.

# Pescamigos

Catálogo privado y diario compartido de pesca, construido con Next.js, PostgreSQL, Prisma y almacenamiento local de fotografías.

## Arranque local con Docker

1. Copia `.env.example` a `.env`. Define una contraseña robusta en `POSTGRES_PASSWORD` y usa el mismo valor, codificado para URL si contiene caracteres especiales, en `DATABASE_URL` (no subas `.env` al repositorio).
2. Ejecuta `docker compose build`.
3. Ejecuta las migraciones: `docker compose run --rm app npx prisma migrate deploy`.
4. Carga las tres fichas explícitamente marcadas como demostración: `docker compose run --rm app npm run db:seed`.
5. Inicia: `docker compose up -d` y visita `http://localhost:3000/setup`.
6. Crea a Luis como propietario ADMIN; después crea a Dani en Administración.

PostgreSQL sólo está en la red interna. La aplicación se publica en loopback para quedar detrás de un proxy inverso.

## Variables

Consulta `.env.example`. `DATABASE_URL`, `APP_URL`, `PHOTO_STORAGE_PATH`, `MAX_UPLOAD_MB`, `TILE_URL` y `TILE_ATTRIBUTION` controlan base de datos, origen, fotos y mapa. Da al UID 1001 permisos de escritura sobre un directorio de fotos enlazado desde el host si no utilizas el volumen de Compose.

## Dominio y HTTPS

Apunta el DNS del dominio al servidor, abre 80/443 y configura tu proxy hacia `127.0.0.1:3000`. `Caddyfile.example` muestra la configuración opcional de Caddy, que obtiene y renueva HTTPS automáticamente. Ajusta `APP_URL` al origen HTTPS exacto.

## Publicación desde GitHub en Ubuntu Server

Clona el repositorio en el servidor, crea allí un `.env` propio a partir de `.env.example` y no copies ni publiques el `.env` local. Antes del primer arranque restaura por separado la base de datos y el archivo de fotografías si quieres trasladar los datos existentes. El repositorio contiene el código y las migraciones, pero no contiene usuarios, capturas, lugares ni imágenes.

## Actualizaciones y migraciones

Haz una copia, descarga el código, ejecuta `docker compose build`, `docker compose run --rm app npx prisma migrate deploy` y `docker compose up -d`. Comprueba `docker compose ps` y los healthchecks.

## Copia y restauración

En PowerShell: `./scripts/backup.ps1 -Destination ./backups`. El script crea un `pg_dump` y un tar de fotografías, y muestra sus hashes. Para restaurar, detén la app y ejecuta `./scripts/restore.ps1 -DatabaseDump <dump> -PhotosArchive <tar.gz>`. Una copia sin ambos ficheros está incompleta. Prueba periódicamente la restauración en un entorno separado.

## Contraseña perdida

No hay recuperación pública por seguridad. Con acceso administrativo al servidor, crea un hash Argon2id con el código del proyecto y actualiza `User.passwordHash` mediante una sesión controlada de Prisma; revoca después las sesiones del usuario. Para un MEMBER, un ADMIN puede crear una contraseña temporal desde la gestión de usuarios cuando se complete esa pantalla.

## Calidad

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. Playwright requiere una instancia preparada: `npm run test:e2e`.

## Importación de especies

Consulta `docs/FORMATO_IMPORTACION.md`. El importador fusiona por `slug` y asigna `PENDING` cuando `verificationStatus` no está presente.

## Limitaciones conocidas del MVP

- Las fichas incluidas son sólo demostrativas y están pendientes de revisión; no forman una lista exhaustiva ni consejo legal.
- HEIC se rechaza con un mensaje claro porque su soporte depende de libvips; JPEG, PNG y WebP sí están soportados.
- El rate limit de login es por proceso y presupone una sola réplica.
- El mapa Leaflet permite selección y arrastre, pero todavía no agrupa marcadores cercanos cuando hay muchos.
- Quedan pendientes la edición extensa de especies y sus ilustraciones, y algunos desgloses estadísticos por especie.
- Las pruebas E2E de flujos con base de datos requieren fixtures y todavía no cubren los diez escenarios solicitados.
- A 3 de agosto de 2026, `npm audit --omit=dev` informa tres avisos altos en copias internas de `postcss@8.4.31` y `sharp@0.34.5` de Next.js 16.2.12. Las dependencias directas ya usan versiones corregidas; npm sólo propone degradar a Next 9, una solución incompatible. Hay que actualizar Next cuando publique una versión que renueve esas copias internas.

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

Consulta `.env.example`. Además de la conexión, origen y almacenamiento, configura `LOGIN_RATE_LIMIT_SECRET` con un secreto aleatorio largo. `MAX_UPLOAD_MB`, `MAX_IMAGE_WIDTH`, `MAX_IMAGE_HEIGHT` y `MAX_IMAGE_PIXELS` limitan las imágenes antes de procesarlas. Da al UID 1001 permisos de escritura sobre un directorio enlazado desde el host si no utilizas el volumen de Compose.

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

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.

Las pruebas de integración y E2E utilizan exclusivamente `pescamigos_e2e`. Arranca su PostgreSQL efímero con `docker compose -f docker-compose.e2e.yml up -d`, ejecuta `npm run test:integration` y `npm run test:e2e`, y detenlo con `docker compose -f docker-compose.e2e.yml down`. El preparador se niega a reiniciar una base cuyo nombre no contenga expresamente `pescamigos_e2e`.

GitHub Actions ejecuta instalación reproducible, lint, tipos, pruebas unitarias, integración, build, auditoría de producción y los diez flujos E2E. Consulta `SECURITY_AUDIT.md` para el detalle de dependencias y alcance.

## Importación de especies

Consulta `docs/FORMATO_IMPORTACION.md`. El importador fusiona por `slug` y asigna `PENDING` cuando `verificationStatus` no está presente.

## Limitaciones de seguridad

- HEIC no está soportado. Solo se aceptan por firma JPEG, PNG y WebP; GIF, TIFF, SVG, VIPS y formatos desconocidos se rechazan.
- El rate limit de login es persistente en PostgreSQL y funciona entre reinicios y réplicas que compartan la base. Para despliegues detrás de proxies distintos de Caddy debe verificarse que `X-Forwarded-For`/`X-Real-IP` procedan únicamente del proxy de confianza.
- No hay vulnerabilidades conocidas en `npm audit --omit=dev` a 5 de agosto de 2026. La auditoría debe revisarse en cada actualización.

## Limitaciones funcionales

- El catálogo se mantiene mediante importación JSON y puede no ser exhaustivo. La información biológica y legal debe revisarse y la normativa vigente debe comprobarse siempre antes de pescar.
- El mapa Leaflet no agrupa todavía marcadores cercanos cuando hay muchos.

## Mejoras opcionales

- Automatizar copias cifradas fuera del servidor y ensayar restauraciones periódicas.
- Añadir monitorización externa de disponibilidad, espacio de fotografías y caducidad de copias.

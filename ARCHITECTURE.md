# Arquitectura de Pescamigos

## Decisiones principales

Pescamigos se implementa como monolito modular en Next.js. Para dos usuarios y un servidor doméstico, separarlo en servicios añadiría operaciones y fallos sin aportar una ventaja práctica. Los límites entre dominio, persistencia, autenticación, almacenamiento e interfaz se mantienen en módulos.

PostgreSQL y Prisma ofrecen integridad referencial, migraciones reproducibles y consultas tipadas. Las listas pequeñas que necesitan filtro (meses, franjas, técnicas) se representan de forma consultable; el texto editorial permanece en campos simples.

La autenticación no requiere SaaS: las contraseñas usan Argon2id y las sesiones son tokens aleatorios; en la base sólo se guarda su hash. La cookie es HTTP-only, `SameSite=Lax` y `Secure` en producción. Las mutaciones validan origen, entrada y permisos en servidor. No existe registro público: sólo `/setup` cuando no hay usuarios y la creación de miembros por ADMIN.

Las imágenes originales viven fuera del directorio público. Sharp genera una versión web sin metadatos y una miniatura; una ruta autenticada comprueba sesión antes de servirlas. Los nombres son UUID aleatorios y nunca se usa el nombre aportado por el cliente como ruta.

Leaflet evita una API cartográfica de pago. La URL y atribución de teselas son variables de entorno y la atribución permanece visible.

## Organización prevista

- `app/`: rutas, layouts, acciones y Route Handlers.
- `components/`: interfaz reutilizable y componentes cliente aislados.
- `lib/`: dominio, auth, permisos, validación, almacenamiento y consultas.
- `prisma/`: esquema, migraciones, seed y datos de demostración.
- `tests/` y `e2e/`: pruebas de dominio, integración y navegador.
- `scripts/`: operaciones de backup y restauración.

## Seguridad y consistencia

Toda lectura privada exige sesión en servidor. Las políticas de edición comparan el usuario autenticado con el pescador/creador, salvo ADMIN. La creación de capturas usa una clave de idempotencia para impedir duplicados por doble toque. Las restricciones físicas básicas se validan en Zod y también mediante tipos/rangos coherentes en la capa de dominio.

La subida usa un directorio temporal dentro del mismo volumen: valida firma real, procesa, mueve archivos y finalmente confirma referencias. Ante error elimina artefactos parciales. La eliminación definitiva primero marca el registro y después elimina archivos de forma controlada.

## Datos biológicos y regulatorios

El seed sólo incluirá datos de demostración identificados como pendientes de revisión. Cada fuente conserva URL, organismo, ámbito y fecha de consulta. La temporada biológica y la regulación/veda se muestran en campos separados y siempre con aviso de consulta de normativa oficial vigente.

## Despliegue

La imagen de producción usa salida `standalone`. Docker Compose mantiene redes internas y volúmenes separados para PostgreSQL y fotografías. El proxy inverso termina HTTPS y reenvía cabeceras estándar. Se incluye Caddy únicamente como ejemplo opcional.

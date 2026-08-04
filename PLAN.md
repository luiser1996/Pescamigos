# Plan de implementación de Pescamigos

## Arquitectura propuesta

- Aplicación monolítica Next.js (App Router) con TypeScript estricto y componentes de servidor por defecto.
- PostgreSQL como fuente de verdad y Prisma como ORM/migraciones.
- Autenticación propia por usuario/contraseña: Argon2id, sesiones opacas almacenadas en base de datos y cookie HTTP-only.
- Acciones del servidor y Route Handlers con validación Zod y autorización centralizada.
- Fotografías en almacenamiento local persistente, fuera de `public`, procesadas con Sharp y servidas por ruta autenticada.
- Leaflet en cliente para mapas; teselas y atribución configurables.
- Tailwind CSS para una interfaz mobile-first; Vitest y Playwright para pruebas.
- Contenedores separados para aplicación y PostgreSQL, con volúmenes persistentes.

## Modelo de datos

- `User`: credenciales, rol, estado y auditoría.
- `Session`: token opaco hasheado, expiración y revocación.
- `Species`: identidad, clasificación, información biológica/regulatoria, actividad, imágenes, verificación y archivado.
- `SpeciesSource`: fuente y ámbito de los datos de una especie.
- `FishingPlace`: lugar reutilizable con coordenadas y tipo de masa de agua.
- `Catch`: captura, pescador/creador, especie, lugar, medidas, modalidad, liberación y auditoría.
- `CatchPhoto`: rutas privadas de original/web/miniatura, metadatos seguros y orden.
- `Technique` y `BaitOrLure`: datos maestros administrables.

El estado “descubierta” se deriva de `Catch`; no se persiste. Los borrados de especies y usuarios son lógicos. Las fotos sólo se eliminan de forma definitiva junto con una captura confirmada.

## Fases y progreso

- [x] Inspeccionar el repositorio.
- [x] Definir arquitectura, modelo de datos y riesgos.
- [x] Crear el esqueleto Next.js, estilos y navegación privada.
- [x] Implementar Prisma, migración y seed demostrativo.
- [x] Implementar configuración inicial, autenticación, sesiones y permisos base.
- [x] Implementar catálogo, detalle de especie y selector por URL.
- [x] Completar lugares/mapa con selector Leaflet, marcador arrastrable, coordenadas y geolocalización.
- [x] Completar capturas con edición, archivado confirmado y hasta cinco fotos adicionales.
- [x] Completar cronología, perfiles, galería, primeras capturas, récords, meses y lugares destacados.
- [x] Completar administración de especies e imágenes, usuarios, contraseñas, lugares, importación/exportación y almacenamiento.
- [x] Reemplazar la portada por el catálogo con progreso integrado.
- [x] Añadir imágenes independientes de catálogo/detalle, avatares y edición completa de especies.
- [x] Añadir búsqueda geográfica, marcadores visibles y edición cartográfica de lugares.
- [x] Añadir recorte por arrastre para avatares y capturas, galería ampliable y navegación desde el mapa.
- [x] Documentar y flexibilizar el formato JSON de importación con verificación pendiente por defecto.
- [x] Estabilizar el marco de las fichas y añadir recomendaciones mensuales por actividad biológica.
- [x] Añadir encuadre de imágenes de detalle, simplificar entornos, retirar notas de lugares y aceptar exportaciones JSON.
- [x] Añadir PWA básica, cabeceras, Docker, backup/restauración y documentación.
- [ ] Completar pruebas de integración y los diez escenarios E2E; dominio, tipos, lint y build están cubiertos.

## Riesgos técnicos

- HEIC depende de que la compilación de Sharp/libvips del contenedor incluya soporte; se detectará y rechazará con un mensaje claro si no está disponible.
- Las transacciones de base de datos y archivos no son atómicas; se usará staging, limpieza compensatoria y trabajos idempotentes.
- El rate limiting en memoria sólo sirve para una instancia; el MVP autohospedado será de una instancia y queda documentada la migración a un almacén compartido.
- Los mapas de teselas públicos pueden imponer políticas de uso; URL y atribución serán configurables.
- La normativa pesquera cambia; los datos regulatorios quedarán fechados, asociados a fuentes y con advertencia visible.

## Decisiones pendientes no bloqueantes

- Sustituir ilustraciones provisionales originales por arte definitivo.
- Elegir proveedor de teselas para producción según su política de uso.
- Decidir si se incorpora Redis al crecer a varias instancias.
- Completar el catálogo con revisión humana y fuentes oficiales vigentes.

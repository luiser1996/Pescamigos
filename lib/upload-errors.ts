export function imageErrorMessage(error: unknown) {
  const reason = error instanceof Error ? error.message : "";
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (
    /supera|demasiados píxeles|reducir|está vacía|Usa una imagen/i.test(reason)
  )
    return reason;
  if (/ENOSPC/.test(`${code} ${reason}`))
    return "El servidor no tiene espacio para guardar la foto. Contacta con el administrador.";
  if (/EACCES|EPERM|EROFS|ENOENT/.test(`${code} ${reason}`))
    return "El servidor no pudo guardar la foto. Contacta con el administrador.";
  if (
    /corrupt|header|unsupported|decode|jpeg|png|webp|premature|buffer|vips/i.test(
      reason,
    )
  )
    return "La foto está dañada o usa una codificación incompatible. Prueba a exportarla de nuevo como JPEG o PNG.";
  return "No se pudo procesar la foto. Prueba a exportarla como JPEG o PNG y vuelve a seleccionarla.";
}

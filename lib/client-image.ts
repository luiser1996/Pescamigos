const TARGET_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 5000;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("No se pudo convertir la imagen")),
      "image/webp",
      quality,
    ),
  );
}

export async function optimizeImageFile(file: File) {
  if (file.size <= TARGET_BYTES) return file;
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const initialScale = Math.min(
      1,
      MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    let width = Math.max(1, Math.round(bitmap.width * initialScale));
    let height = Math.max(1, Math.round(bitmap.height * initialScale));
    let quality = 0.86;
    let result: Blob | undefined;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context)
        throw new Error("El navegador no puede procesar esta imagen");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);
      result = await canvasToBlob(canvas, quality);
      if (result.size <= TARGET_BYTES) break;
      if (quality > 0.58) quality -= 0.1;
      else {
        width = Math.max(1, Math.round(width * 0.82));
        height = Math.max(1, Math.round(height * 0.82));
      }
    }
    if (!result || result.size > TARGET_BYTES)
      throw new Error("No se ha podido reducir la imagen por debajo de 10 MB");
    const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return new File([result], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

export function replaceInputFiles(input: HTMLInputElement, files: File[]) {
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

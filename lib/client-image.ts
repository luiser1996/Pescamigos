const TARGET_BYTES = 2 * 1024 * 1024;
const MAX_EDGE = 2560;
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function decodeWithImageElement(file: File): Promise<DecodedImage> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Safari puede mostrar algunos formatos de la cámara aunque
      // createImageBitmap no sea capaz de decodificarlos.
    }
  }
  return decodeWithImageElement(file);
}

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
  const decoded = await decodeImage(file);
  try {
    const initialScale = Math.min(
      1,
      MAX_EDGE / Math.max(decoded.width, decoded.height),
    );
    let width = Math.max(1, Math.round(decoded.width * initialScale));
    let height = Math.max(1, Math.round(decoded.height * initialScale));
    if (
      PASSTHROUGH_TYPES.has(file.type) &&
      file.size <= TARGET_BYTES &&
      Math.max(decoded.width, decoded.height) <= MAX_EDGE
    )
      return file;

    let quality = 0.84;
    let result: Blob | undefined;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context)
        throw new Error("El navegador no puede procesar esta imagen");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(decoded.source, 0, 0, width, height);
      result = await canvasToBlob(canvas, quality);
      if (result.size <= TARGET_BYTES) break;
      if (quality > 0.54) quality -= 0.1;
      else {
        width = Math.max(1, Math.round(width * 0.82));
        height = Math.max(1, Math.round(height * 0.82));
      }
    }
    if (!result || result.size > TARGET_BYTES)
      throw new Error("No se ha podido reducir la imagen a un tamaño seguro");
    const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return new File([result], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    decoded.close();
  }
}

export function setImageProcessing(input: HTMLInputElement, active: boolean) {
  const form = input.form;
  if (!form) return;
  const current = Number(form.dataset.imageProcessing ?? 0);
  const next = Math.max(0, current + (active ? 1 : -1));
  form.dataset.imageProcessing = String(next);
  form.dispatchEvent(
    new CustomEvent("pescamigos:image-processing", {
      detail: { active: next > 0 },
    }),
  );
}

export function replaceInputFiles(input: HTMLInputElement, files: File[]) {
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

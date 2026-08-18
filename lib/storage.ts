import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

const root =
  process.env.PHOTO_STORAGE_PATH ??
  path.join(/* turbopackIgnore: true */ process.cwd(), "storage");
const maxBytes = () => (Number(process.env.MAX_UPLOAD_MB) || 12) * 1024 * 1024;
const maxRawBytes = () =>
  (Number(process.env.MAX_RAW_UPLOAD_MB) || 70) * 1024 * 1024;
const maxWidth = () => Number(process.env.MAX_IMAGE_WIDTH) || 12000;
const maxHeight = () => Number(process.env.MAX_IMAGE_HEIGHT) || 12000;
const maxPixels = () => Number(process.env.MAX_IMAGE_PIXELS) || 60_000_000;

function trustedImageFormat(input: Buffer) {
  if (
    input.length >= 3 &&
    input[0] === 0xff &&
    input[1] === 0xd8 &&
    input[2] === 0xff
  )
    return "jpeg";
  if (
    input.length >= 8 &&
    input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "png";
  if (
    input.length >= 12 &&
    input.subarray(0, 4).toString("ascii") === "RIFF" &&
    input.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";
  throw new Error("Usa una imagen JPEG, PNG o WebP válida");
}

async function inspectImage(file: File) {
  if (file.size === 0) throw new Error("La imagen está vacía");
  if (file.size > maxRawBytes())
    throw new Error("La imagen supera el máximo bruto de 70 MB");
  const input = Buffer.from(await file.arrayBuffer());
  const signature = trustedImageFormat(input);
  const meta = await sharp(input, {
    failOn: "error",
    limitInputPixels: maxPixels(),
    animated: false,
  })
    .metadata()
    .catch(() => null);
  if (!meta || meta.format !== signature || !meta.width || !meta.height)
    throw new Error("Usa una imagen JPEG, PNG o WebP válida");
  if (meta.width * meta.height > maxPixels())
    throw new Error(
      "La imagen tiene demasiados píxeles para procesarla con seguridad",
    );
  return { input, meta };
}

async function normalizedInput(input: Buffer, meta: Metadata) {
  const shouldNormalize =
    input.length > maxBytes() ||
    (meta.width ?? 0) > maxWidth() ||
    (meta.height ?? 0) > maxHeight();
  if (!shouldNormalize) return input;

  let edge = Math.min(5000, maxWidth(), maxHeight());
  let quality = 84;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const output = await sharp(input, {
      failOn: "error",
      limitInputPixels: maxPixels(),
      animated: false,
    })
      .rotate()
      .resize({
        width: edge,
        height: edge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
    if (output.length <= maxBytes()) return output;
    if (quality > 58) quality -= 10;
    else edge = Math.max(1200, Math.round(edge * 0.8));
  }
  throw new Error("No se ha podido reducir la imagen al tamaño permitido");
}

export async function savePhoto(file: File) {
  const inspected = await inspectImage(file);
  const input = await normalizedInput(inspected.input, inspected.meta);
  const meta = await sharp(input).metadata();
  const id = randomUUID();
  const temp = path.join(/* turbopackIgnore: true */ root, "tmp", id);
  const final = path.join(/* turbopackIgnore: true */ root, id.slice(0, 2));
  await mkdir(temp, { recursive: true });
  await mkdir(final, { recursive: true });
  const moved: string[] = [];
  try {
    const original = path.join(temp, `${id}.original`);
    const web = path.join(temp, `${id}.webp`);
    const thumb = path.join(temp, `${id}.thumb.webp`);
    await writeFile(original, input);
    await sharp(input, { failOn: "error", limitInputPixels: maxPixels() })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(web);
    await sharp(input, { failOn: "error", limitInputPixels: maxPixels() })
      .rotate()
      .resize(420, 300, { fit: "cover" })
      .webp({ quality: 76 })
      .toFile(thumb);
    const names = [original, web, thumb];
    for (const name of names) {
      const target = path.join(
        /* turbopackIgnore: true */ final,
        path.basename(name),
      );
      await rename(name, target);
      moved.push(target);
    }
    await rm(temp, { recursive: true, force: true });
    return {
      originalPath: moved[0],
      webPath: moved[1],
      thumbnailPath: moved[2],
      mimeType: "image/webp",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      sizeBytes: input.length,
    };
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    await Promise.all(moved.map((target) => rm(target, { force: true })));
    throw error;
  }
}
export async function removeSavedPhoto(paths: string[]) {
  for (const target of paths) {
    const resolved = path.resolve(target);
    if (
      resolved.startsWith(
        path.resolve(/* turbopackIgnore: true */ root) + path.sep,
      )
    )
      await rm(resolved, { force: true });
  }
}

export const saveImageAsset = savePhoto;

async function saveCroppedImage(
  file: File,
  focusX: number,
  focusY: number,
  zoom: number,
  aspect: number,
) {
  const inspected = await inspectImage(file);
  const input = await normalizedInput(inspected.input, inspected.meta);
  const rotated = await sharp(input, {
    failOn: "error",
    limitInputPixels: maxPixels(),
    animated: false,
  })
    .rotate()
    .toBuffer({ resolveWithObject: true })
    .catch(() => null);
  if (!rotated || !["jpeg", "png", "webp"].includes(rotated.info.format))
    throw new Error("Usa una imagen JPEG, PNG o WebP válida");
  const sourceAspect = rotated.info.width / rotated.info.height;
  const baseWidth =
    sourceAspect >= aspect ? rotated.info.height * aspect : rotated.info.width;
  const baseHeight =
    sourceAspect >= aspect ? rotated.info.height : rotated.info.width / aspect;
  const safeZoom = Math.min(3, Math.max(1, zoom));
  const cropWidth = Math.max(1, Math.floor(baseWidth / safeZoom));
  const cropHeight = Math.max(1, Math.floor(baseHeight / safeZoom));
  const left = Math.round(
    ((rotated.info.width - cropWidth) * Math.min(100, Math.max(0, focusX))) /
      100,
  );
  const top = Math.round(
    ((rotated.info.height - cropHeight) * Math.min(100, Math.max(0, focusY))) /
      100,
  );
  const id = randomUUID();
  const temp = path.join(/* turbopackIgnore: true */ root, "tmp", id);
  const final = path.join(/* turbopackIgnore: true */ root, id.slice(0, 2));
  await mkdir(temp, { recursive: true });
  await mkdir(final, { recursive: true });
  const original = path.join(temp, `${id}.original`),
    web = path.join(temp, `${id}.webp`),
    thumb = path.join(temp, `${id}.thumb.webp`);
  const moved: string[] = [];
  try {
    await writeFile(original, input);
    const cropped = sharp(rotated.data).extract({
      left,
      top,
      width: cropWidth,
      height: cropHeight,
    });
    const outputWidth = aspect === 1 ? 800 : 1600;
    const outputHeight = Math.round(outputWidth / aspect);
    await cropped
      .clone()
      .resize(outputWidth, outputHeight)
      .webp({ quality: 84 })
      .toFile(web);
    await cropped.clone().resize(220, 220).webp({ quality: 78 }).toFile(thumb);
    for (const name of [original, web, thumb]) {
      const target = path.join(
        /* turbopackIgnore: true */ final,
        path.basename(name),
      );
      await rename(name, target);
      moved.push(target);
    }
    await rm(temp, { recursive: true, force: true });
    return {
      originalPath: moved[0],
      webPath: moved[1],
      thumbnailPath: moved[2],
      mimeType: "image/webp",
      width: outputWidth,
      height: outputHeight,
      sizeBytes: input.length,
    };
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    await Promise.all(moved.map((target) => rm(target, { force: true })));
    throw error;
  }
}

export const saveCroppedAvatar = (
  file: File,
  x: number,
  y: number,
  zoom: number,
) => saveCroppedImage(file, x, y, zoom, 1);
export const saveCroppedCapture = (
  file: File,
  x: number,
  y: number,
  zoom: number,
) => saveCroppedImage(file, x, y, zoom, 4 / 3);
